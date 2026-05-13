# Over-the-Air (OTA) Updates with Eclipse hawkBit

This OpenRemote deployment ships with [Eclipse hawkBit](https://www.eclipse.org/hawkbit/)
as the OTA / firmware rollout backend. hawkBit handles artifact storage, target
(device) registration, distribution sets, and rollouts. Devices pull updates
over the **DDI** (Direct Device Integration) HTTP API.

This document covers the **monolith profile** baked into [deployment.yml](../deployment.yml):

- One `hawkbit-update-server` container
- One MariaDB container backing it
- Local artifact repository on a docker volume
- DMF/RabbitMQ disabled (DDI HTTP only)
- **No host port** — hawkBit is reachable only inside the docker network

---

## 1. Architecture

```
                        ┌─────────────────────┐
                        │   OpenRemote        │
   Admin / UI ────────► │   Manager           │ ──► assets, rules, alarms
                        │ (handles devices)   │
                        └──────────┬──────────┘
                                   │ REST (mgmt API)
                                   ▼
                        ┌─────────────────────┐
                        │   hawkBit           │ ──► hawkbit-mariadb
                        │   update-server     │ ──► /artifactrepo (volume)
                        └──────────┬──────────┘
                                   │ DDI HTTP (devices poll)
                                   ▼
                        ┌─────────────────────┐
                        │ Field devices       │
                        │ (street lights etc.)│
                        └─────────────────────┘
```

- **Manager → hawkBit**: server-to-server, uses `HAWKBIT_URL`,
  `HAWKBIT_USERNAME`, `HAWKBIT_PASSWORD` env vars.
- **Device → hawkBit**: device polls `/{tenant}/controller/v1/{controllerId}`
  using its DDI security token.

---

## 2. Required environment variables

Add these to your deployment shell / `.env` file before bringing the stack up:

```bash
# hawkBit admin (web UI + management REST API)
export HAWKBIT_USERNAME=admin
export HAWKBIT_PASSWORD=<a-strong-password>

# MariaDB credentials
export HAWKBIT_DB_ROOT_PASSWORD=<root-password>
export HAWKBIT_DB_PASSWORD=<hawkbit-user-password>

# Optional pin — MUST be a "-mysql" tag when using MariaDB.
# The plain hawkBit tags only ship with the H2 driver and will fail with
# "Cannot load driver class: org.mariadb.jdbc.Driver" on startup.
export HAWKBIT_VERSION=0.6.1-mysql
```

> ⚠️ The defaults in `deployment.yml` (`admin/admin`) are for first-boot
> convenience only. **Always override them in production.**

Bring the stack up as usual:

```bash
docker compose -f deployment.yml -p custom up -d
```

Verify the new services:

```bash
docker compose -p custom ps hawkbit hawkbit-mariadb
docker compose -p custom logs -f hawkbit
```

You should see Spring Boot output ending in
`Started Application in N seconds`.

---

## 3. Accessing the hawkBit UI

hawkBit is **not exposed publicly**. Two safe ways to reach the UI:

### Option A — SSH tunnel (recommended for ops)

From your laptop:

```bash
ssh -L 8181:localhost:8181 user@<openremote-host>
```

On the host, forward the container port locally:

```bash
docker run --rm --network custom_default -p 127.0.0.1:8181:8080 alpine/socat \
  TCP-LISTEN:8080,fork TCP:hawkbit:8080
```

Then open `http://localhost:8181` and log in with `HAWKBIT_USERNAME` /
`HAWKBIT_PASSWORD`.

### Option B — temporarily publish the port

Edit [deployment.yml](../deployment.yml), uncomment the `ports:` block under
the `hawkbit:` service:

```yaml
ports:
  - "127.0.0.1:8181:8080"
```

Then `docker compose -p custom up -d hawkbit` and visit
`http://localhost:8181`. Re-comment and redeploy when done.

> If you eventually need public access, add an HAProxy frontend rule on the
> existing `proxy` service (`/hawkbit` path or a subdomain) and put HTTP
> basic-auth or OIDC in front. **Do not bind hawkBit to `0.0.0.0` directly.**

---

## 4. Concepts cheatsheet

| Term | Meaning |
|---|---|
| **Target** | A single device. Identified by `controllerId` (e.g. `streetlight-0001`). |
| **Software Module** | A single artifact + metadata (e.g. `firmware-1.2.3.bin`). Has a *type* (`os`, `application`, `bApp`...). |
| **Distribution Set** | A bundle of software modules that should be installed together (e.g. `os-1.2.3 + app-4.5.6`). What you actually assign to targets. |
| **Rollout** | Staged deployment of a distribution set to many targets, with success/error thresholds. |
| **Action** | The unit of work assigned to one target (install distribution set X). |

---

## 5. Typical workflow — uploading and deploying firmware

The examples below use the management REST API. Replace `HAWKBIT_BASE` with
the URL you tunneled to (e.g. `http://localhost:8181`) and use HTTP basic
auth with the admin credentials.

```bash
HAWKBIT_BASE=http://localhost:8181
AUTH="-u $HAWKBIT_USERNAME:$HAWKBIT_PASSWORD"
JSON='-H Content-Type:application/json'
```

### 5.1 Create a software module type (once per artifact kind)

```bash
curl $AUTH $JSON -X POST $HAWKBIT_BASE/rest/v1/softwaremoduletypes -d '[{
  "key": "streetlight-fw",
  "name": "Street Light Firmware",
  "maxAssignments": 1
}]'
```

### 5.2 Create a software module

```bash
SM_ID=$(curl -s $AUTH $JSON -X POST $HAWKBIT_BASE/rest/v1/softwaremodules -d '[{
  "name": "streetlight-fw",
  "version": "1.2.3",
  "type": "streetlight-fw"
}]' | jq '.[0].id')
```

### 5.3 Upload the artifact (the actual binary)

```bash
curl $AUTH -X POST \
  -F "file=@./firmware-1.2.3.bin" \
  $HAWKBIT_BASE/rest/v1/softwaremodules/$SM_ID/artifacts
```

### 5.4 Create a distribution set type and distribution set

```bash
curl $AUTH $JSON -X POST $HAWKBIT_BASE/rest/v1/distributionsettypes -d '[{
  "key": "streetlight-ds",
  "name": "Street Light DS",
  "mandatorymodules": [<id-of-streetlight-fw-type>]
}]'

DS_ID=$(curl -s $AUTH $JSON -X POST $HAWKBIT_BASE/rest/v1/distributionsets -d "[{
  \"name\": \"streetlight-1.2.3\",
  \"version\": \"1.2.3\",
  \"type\": \"streetlight-ds\",
  \"modules\": [{\"id\": $SM_ID}]
}]" | jq '.[0].id')
```

### 5.5 Register a target (device)

Devices can be auto-registered on first poll, or pre-created:

```bash
curl $AUTH $JSON -X POST $HAWKBIT_BASE/rest/v1/targets -d '[{
  "controllerId": "streetlight-0001",
  "name": "Street Light 0001",
  "securityToken": "REPLACE-WITH-RANDOM-TOKEN"
}]'
```

The `securityToken` is what the device sends in the
`Authorization: TargetToken <token>` header when polling DDI.

### 5.6 Assign the distribution set to the target

```bash
curl $AUTH $JSON -X POST \
  $HAWKBIT_BASE/rest/v1/targets/streetlight-0001/assignedDS \
  -d "{\"id\": $DS_ID}"
```

The next time the device polls, it will be told to download and install.

---

## 6. Device side — DDI polling

The device implements a small client that polls hawkBit periodically:

```
GET  /default/controller/v1/streetlight-0001
       Authorization: TargetToken <securityToken>
```

Response includes a `_links.deploymentBase` URL when an action is pending.
The device then:

1. `GET deploymentBase` — receive distribution set + artifact list
2. `GET` each artifact's `download` URL — fetch the binary
3. Apply the update locally
4. `POST` feedback to `_links.deploymentBase` with `status.execution`
   (`proceeding`, `closed`, `rejected`, ...) and `status.result.finished`
   (`success` / `failure` / `none`)

Reference clients:

- C: <https://github.com/eclipse/hawkbit-clients> (`hawkbit-rs`, `hawkbit-c`)
- Python: <https://pypi.org/project/python-hawkbit-client/>
- For ESP/Arduino targets, a minimal HTTP client is enough — DDI is plain
  REST + JSON.

> Set the polling interval in hawkBit (Tenant Configuration → Polling time)
> based on your fleet size. A 5-minute interval is fine for hundreds of
> devices; larger fleets need longer intervals + rollouts.

---

## 7. Rollouts (staged deployments)

For more than a handful of devices, use a **rollout** instead of direct
assignment. Rollouts split targets into groups and pause/abort on error
thresholds.

In the UI: *Rollout Management → +* — pick a distribution set, a target
filter (e.g. `name==streetlight-*`), number of groups, success/error
thresholds.

Equivalent REST: `POST /rest/v1/rollouts`. See
<https://www.eclipse.org/hawkbit/apis/management_api/>.

---

## 8. Integration with OpenRemote Manager

The `manager` service is wired with these env vars:

| Variable | Purpose |
|---|---|
| `HAWKBIT_URL` | Internal URL — `http://hawkbit:8080` |
| `HAWKBIT_USERNAME` | Mgmt API user |
| `HAWKBIT_PASSWORD` | Mgmt API password |

Use them from a custom protocol / agent / rule to:

- Register a new asset's controllerId in hawkBit on creation
- Trigger a rollout when an alarm fires (e.g. critical CVE)
- Mirror hawkBit action status back into the asset's attributes

There is no out-of-the-box bridge yet — implement the integration in your
custom manager extension using a standard HTTP client.

---

## 9. Backups

Two volumes hold all OTA state — back them up together:

| Volume | What's in it |
|---|---|
| `custom_hawkbit-mariadb-data` | All metadata: targets, modules, DS, rollouts, history |
| `custom_hawkbit-artifact-data` | The actual binary artifacts (firmware files) |

Standard pattern:

```bash
docker run --rm \
  -v custom_hawkbit-mariadb-data:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/hawkbit-mariadb-$(date +%F).tgz -C /data .

docker run --rm \
  -v custom_hawkbit-artifact-data:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/hawkbit-artifacts-$(date +%F).tgz -C /data .
```

---

## 10. Hardening checklist before production

- [ ] Override `HAWKBIT_USERNAME` / `HAWKBIT_PASSWORD` (not `admin/admin`)
- [ ] Override both DB passwords
- [ ] Generate a strong unique `securityToken` per target (don't reuse)
- [ ] Sign your firmware artifacts and verify signatures on the device —
      hawkBit ships them; it does not sign them
- [ ] Decide on TLS termination if you ever expose hawkBit publicly
      (HAProxy frontend on the existing `proxy` service)
- [ ] Schedule MariaDB + artifact volume backups
- [ ] Pin `HAWKBIT_VERSION` rather than tracking `latest`

---

## 11. References

- hawkBit docs: <https://www.eclipse.org/hawkbit/>
- Management API: <https://www.eclipse.org/hawkbit/apis/management_api/>
- DDI API: <https://www.eclipse.org/hawkbit/apis/ddi_api/>
- Source / images: <https://github.com/eclipse-hawkbit/hawkbit>
