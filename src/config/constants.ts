import "dotenv/config"

const defaultKeycloakBaseUrl =
  process.env.KEYCLOAK_URL ??
  process.env.KEYCLOAK_BASE_URL ??
  "https://auth.deploily.cloud"

const defaultRealm = process.env.KEYCLOAK_REALM ?? "deploily"
const defaultClientId = process.env.KEYCLOAK_CLIENT_ID ?? "deploily"
const defaultRedirectUri =
  process.env.KEYCLOAK_REDIRECT_URI ?? "http://localhost:8080/callback"

const realmUrl = `${defaultKeycloakBaseUrl.replace(/\/$/, "")}/realms/${defaultRealm}`

export const AUTH_CONFIG = {
  // Keycloak Configuration
  KEYCLOAK_REALM_URL: process.env.KEYCLOAK_REALM_URL ?? realmUrl,
  KEYCLOAK_TOKEN_ENDPOINT:
    process.env.KEYCLOAK_TOKEN_ENDPOINT ??
    `${realmUrl}/protocol/openid-connect/token`,
  KEYCLOAK_AUTH_ENDPOINT:
    process.env.KEYCLOAK_AUTH_ENDPOINT ??
    `${realmUrl}/protocol/openid-connect/auth`,
  KEYCLOAK_LOGOUT_ENDPOINT:
    process.env.KEYCLOAK_LOGOUT_ENDPOINT ??
    `${realmUrl}/protocol/openid-connect/logout`,
  KEYCLOAK_USERINFO_ENDPOINT:
    process.env.KEYCLOAK_USERINFO_ENDPOINT ??
    `${realmUrl}/protocol/openid-connect/userinfo`,

  // CLI Configuration
  CLIENT_ID: defaultClientId,
  CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
  REDIRECT_URI: defaultRedirectUri,
  CALLBACK_PORT: 8976,
  SCOPE: "openid profile email",
  RESPONSE_TYPE: "code",
  CODE_CHALLENGE_METHOD: "S256",

  // Token Configuration
  TOKEN_EXPIRY_BUFFER: 60,
}

export const STORAGE_CONFIG = {
  SERVICE_NAME: "deploily-cli",
  CONFIG_DIR: "~/.config/deploily",
  CONFIG_FILE: "config.json",
}
