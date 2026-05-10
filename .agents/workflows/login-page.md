OpenRemote Login Page Customization
The login page is powered by Keycloak (OpenRemote's identity provider). There are two layers you can customize:

Layer 1: Keycloak Login Theme (the actual /auth login page)
Keycloak uses FTL (FreeMarker Template) themes. The deployment directory is:

deployment/keycloak/themes/

Place a custom Keycloak theme folder here (e.g., deployment/keycloak/themes/my-theme/)
It gets mounted into the Keycloak container via Docker volumes
The theme name is controlled by the environment variable DEFAULT_REALM_KEYCLOAK_THEME or per-realm via {REALM_NAME}_REALM_KEYCLOAK_THEME
The default built-in theme is named "openremote" and is baked into the Keycloak Docker image.

Layer 2: Manager UI Branding (app title, logo, colors)
The main customization file is:

deployment/build/image/manager/app/manager_config.json

You can configure per-realm:


{
  "realms": {
    "master": {
      "appTitle": "My Platform",
      "logo": "/images/my-logo.svg",
      "logoMobile": "/images/my-logo-mobile.svg",
      "language": "en",
      "styles": ":host > * { --or-app-color3: #1B1464; --or-app-color4: #662D91; }"
    }
  }
}
Logo images go in: deployment/build/image/manager/app/images/

Layer 3: Realm-level Theme via API/Environment Variables
In ManagerKeycloakIdentityProvider.java, the configureRealm() method reads environment variables to set the Keycloak theme:

DEFAULT_REALM_KEYCLOAK_THEME=my-theme — applies to all realms
MASTER_REALM_KEYCLOAK_THEME=my-theme — applies only to the master realm
Key Customizable CSS Variables
Inside the styles field in manager_config.json:

Variable	Purpose
--or-app-color2	Background color
--or-app-color3	Primary brand color
--or-app-color4	Accent color
What do you want to customize specifically? For example:

Logo and colors on the Manager UI
The actual Keycloak login page (background, logo, form styling)
Custom realm/theme configuration