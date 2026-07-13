# deploily-cli

Deploily CLI is a native Node.js command-line tool for authenticating with a Keycloak-backed Deploily environment.

## Features

- OAuth2 login flow with PKCE
- Local callback server for browser-based authentication
- Secure credential storage via `keytar` with file fallback
- `login`, `logout`, and `whoami` commands
- TypeScript + native ESM project setup

## Requirements

- Node.js 20+ recommended
- pnpm
- A running Keycloak instance

## Quick Start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start Keycloak with Docker Compose:

   ```bash
   docker compose up -d
   ```

3. Navigate to `http://localhost:8080` and log in with the default admin credentials (`admin` / `admin`)
   - Create a new realm
   - Create a new client and add `http://localhost:8976/callback` as a valid redirect URI
   - Create a new user and assign them to the realm

4. Configure your `.env` file with the Keycloak endpoints and client details

5. Build and run the CLI:

   ```bash
   pnpm build
   node dist/index.js --help
   ```

## Docker Compose

The repository includes a simple local Keycloak setup in [docker-compose.yml](docker-compose.yml), This starts Keycloak with the default admin credentials `admin` / `admin` on port `8080`.

## Commands

```bash
deploily login
deploily logout
deploily whoami
deploily --help
deploily --version
```

### `login`

Opens your browser, starts the local callback server, and completes the OAuth2 PKCE flow against Keycloak.

### `logout`

Clears locally stored credentials and attempts to log out from Keycloak.

### `whoami`

Shows the current authenticated user when credentials are available.

## Authentication Flow

1. The CLI generates a PKCE code verifier, code challenge, and state value.
2. It opens the Keycloak authorization URL in your browser.
3. Keycloak redirects back to the local callback server on port `8976`.
4. The CLI exchanges the authorization code for tokens.
5. User info is fetched from the Keycloak userinfo endpoint.
6. Credentials are stored with `keytar`, or in `~/.config/deploily/config.json` if `keytar` is unavailable.

## Project Structure

- `src/index.ts` - CLI entry point and command routing
- `src/commands/` - CLI command handlers
- `src/auth/` - authentication service and callback server
- `src/config/` - configuration constants
- `src/storage/` - credential persistence
- `src/utils/` - PKCE helpers
- `src/types/` - shared TypeScript types
