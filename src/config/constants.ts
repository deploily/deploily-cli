import "dotenv/config"

export const AUTH_CONFIG = {
  // Keycloak Configuration
  KEYCLOAK_REALM_URL: process.env.KEYCLOAK_REALM_URL!,
  KEYCLOAK_TOKEN_ENDPOINT: process.env.KEYCLOAK_TOKEN_ENDPOINT!,
  KEYCLOAK_AUTH_ENDPOINT: process.env.KEYCLOAK_AUTH_ENDPOINT!,
  KEYCLOAK_LOGOUT_ENDPOINT: process.env.KEYCLOAK_LOGOUT_ENDPOINT!,
  KEYCLOAK_USERINFO_ENDPOINT: process.env.KEYCLOAK_USERINFO_ENDPOINT!,

  // CLI Configuration
  CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID!,
  CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET!,
  REDIRECT_URI: process.env.KEYCLOAK_REDIRECT_URI!,
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
