#!/usr/bin/env python3
"""
Minimal hawkBit DDI simulator.

Pretends to be a single device polling hawkBit for an OTA update,
downloading the artifact, and reporting feedback. Use this to validate
the OpenRemote <-> hawkBit pipeline end-to-end without flashing real
firmware.

Usage:
    export HAWKBIT_BASE=http://localhost:8090
    export CONTROLLER_ID=streetlight-0001
    export TARGET_TOKEN=<the securityToken you set on the target>
    python3 ota_sim.py

Optional:
    TENANT (default: DEFAULT)
    POLL_INTERVAL_SEC (default: 5)
    DOWNLOAD_DIR (default: ./ota_downloads)
    SIMULATE_FAILURE=1   -> report failure instead of success
"""

from __future__ import annotations

import hashlib
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

BASE = os.environ.get("HAWKBIT_BASE", "http://localhost:8090").rstrip("/")
TENANT = os.environ.get("TENANT", "DEFAULT")
CONTROLLER_ID = os.environ["CONTROLLER_ID"]
TOKEN = os.environ["TARGET_TOKEN"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SEC", "5"))
DOWNLOAD_DIR = Path(os.environ.get("DOWNLOAD_DIR", "./ota_downloads"))
SIMULATE_FAILURE = os.environ.get("SIMULATE_FAILURE") == "1"

HEADERS = {
    "Authorization": f"TargetToken {TOKEN}",
    "Accept": "application/hal+json",
}

DDI_ROOT = f"{BASE}/{TENANT}/controller/v1/{CONTROLLER_ID}"


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def poll() -> dict:
    r = requests.get(DDI_ROOT, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


def get_deployment(url: str) -> dict:
    r = requests.get(url, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


def download_artifact(url: str, expected_sha1: str | None) -> Path:
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = Path(urlparse(url).path).name or "artifact.bin"
    out = DOWNLOAD_DIR / name
    sha1 = hashlib.sha1()
    with requests.get(url, headers=HEADERS, stream=True, timeout=30) as r:
        r.raise_for_status()
        with open(out, "wb") as f:
            for chunk in r.iter_content(chunk_size=64 * 1024):
                f.write(chunk)
                sha1.update(chunk)
    digest = sha1.hexdigest()
    if expected_sha1 and digest != expected_sha1:
        raise RuntimeError(
            f"sha1 mismatch for {name}: got {digest}, expected {expected_sha1}"
        )
    log(f"  downloaded {name} ({out.stat().st_size} bytes, sha1={digest[:8]}...)")
    return out


def post_feedback(
    feedback_url: str,
    action_id: str,
    execution: str,
    finished: str,
    message: str,
) -> None:
    body = {
        "id": action_id,
        "status": {
            "execution": execution,
            "result": {"finished": finished},
            "details": [message],
        },
    }
    r = requests.post(feedback_url, headers=HEADERS, json=body, timeout=10)
    r.raise_for_status()


def handle_deployment(deployment_url: str) -> None:
    dep = get_deployment(deployment_url)
    action_id = dep["id"]
    chunks = dep["deployment"]["chunks"]
    feedback_url = deployment_url  # DDI: feedback POSTs to same URL
    log(f"  action {action_id}: {len(chunks)} chunk(s)")

    post_feedback(
        feedback_url, action_id, "proceeding", "none", "download started"
    )

    try:
        for chunk in chunks:
            for art in chunk.get("artifacts", []):
                dl = (
                    art["_links"].get("download-http")
                    or art["_links"].get("download")
                )
                if not dl:
                    raise RuntimeError(f"no download link for {art['filename']}")
                download_artifact(dl["href"], art.get("hashes", {}).get("sha1"))
    except Exception as e:
        log(f"  download failed: {e}")
        post_feedback(
            feedback_url, action_id, "closed", "failure", f"download error: {e}"
        )
        return

    if SIMULATE_FAILURE:
        log("  SIMULATE_FAILURE=1 -> reporting failure")
        post_feedback(
            feedback_url, action_id, "closed", "failure", "simulated failure"
        )
    else:
        log("  reporting success")
        post_feedback(
            feedback_url, action_id, "closed", "success", "applied successfully"
        )


def main() -> int:
    log(f"polling {DDI_ROOT} every {POLL_INTERVAL}s")
    while True:
        try:
            root = poll()
            links = root.get("_links", {})
            if "deploymentBase" in links:
                log("deployment available")
                handle_deployment(links["deploymentBase"]["href"])
            elif "cancelAction" in links:
                # honour cancel by closing as cancelled
                cancel_url = links["cancelAction"]["href"]
                log("cancel requested")
                cd = requests.get(cancel_url, headers=HEADERS, timeout=10).json()
                action_id = cd["id"]
                requests.post(
                    cancel_url,
                    headers=HEADERS,
                    json={
                        "id": action_id,
                        "status": {
                            "execution": "closed",
                            "result": {"finished": "success"},
                        },
                    },
                    timeout=10,
                )
            else:
                log("idle")
        except requests.HTTPError as e:
            log(f"HTTP error: {e} body={e.response.text[:200]}")
        except Exception as e:
            log(f"error: {e}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
