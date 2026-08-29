# deploily-cli

Deploily CLI is a Node.js command-line tool for authenticating against a Keycloak-backed Deploily environment.

## Features

- OAuth2 login flow with PKCE
- Local callback server for browser-based authentication
- Secure credential storage via `keytar` with a file fallback
- `login`, `logout`, and `whoami` commands
- TypeScript + native ESM project setup

## Section 1: Using the CLI

This is the recommended section for developers who want to install and use the published CLI without contributing to the repository.

### Requirements

- Node.js 20+
- npm (or pnpm)
- A browser for the OAuth login flow

### Default behavior

The CLI connects to the public Deploily Keycloak instance by default:

- URL: `https://auth.deploily.cloud`
- realm: `deploily`
- client ID: `deploily`

No `.env` file is required for standard use. If you need to override the defaults for a custom environment, you can set `KEYCLOAK_URL`, `KEYCLOAK_REALM`, or `KEYCLOAK_CLIENT_ID`.

### Install from npm

```bash
npm install -g @deploily/deploily-cli
```

Or run it without installing globally:

```bash
npx @deploily/deploily-cli --help
```

### Basic usage

```bash
deploily --help
deploily --version
deploily login
deploily logout
deploily whoami
```

### Commands

```bash
deploily login
deploily logout
deploily whoami
deploily --help
deploily --version
```

### Authentication flow

1. The CLI uses the default Keycloak base URL `https://auth.deploily.cloud` when no environment variables are set.
2. It uses the `deploily` realm and the `deploily` client ID by default.
3. It opens the Keycloak authorization URL in your browser.
4. Keycloak redirects back to the local callback server on port `8976`.
5. The CLI exchanges the authorization code for tokens.
6. User info is fetched from the Keycloak userinfo endpoint.
7. Credentials are stored with `keytar`, or in `~/.config/deploily/config.json` if `keytar` is unavailable.

## Section 2: Contributing to the project

This section is for contributors working from the repository source.

### Requirements

- Node.js 20+
- pnpm
- Docker (optional, for the local Keycloak container)

### Clone and install

```bash
git clone <repository-url>
cd deploily-cli
pnpm install
```

### Build the CLI from source

```bash
pnpm build
node dist/index.js --help
```

### Run the local CLI binary

If you want to invoke the project as `deploily` from your shell while developing locally:

```bash
export PATH="$HOME/.local/share/pnpm/bin:$PATH"
pnpm setup
pnpm link --global .
deploily --help
```

If the command is still not found, use the direct entry point instead:

```bash
node dist/index.js --help
```

### Local development flow

```bash
pnpm build
node dist/index.js --help
deploily login
```

The project devcontainer already exposes the Keycloak service, so no separate Docker Compose startup is required.

### Project structure

- `src/index.ts` - CLI entry point and command routing
- `src/commands/` - CLI command handlers
- `src/auth/` - authentication service and callback server
- `src/config/` - configuration constants
- `src/storage/` - credential persistence
- `src/utils/` - PKCE helpers
- `src/types/` - shared TypeScript types

### Publishing checks

Before publishing a release, validate the package and the npm auth flow:

```bash
export NPM_TOKEN="npm_your_token_here"
npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
npm whoami
npm publish --access public --dry-run
```

In GitHub Actions, configure a repository secret named `NPM_SECRET_TOKEN` and the publish workflow will:

- install dependencies
- build the CLI
- validate authentication with `npm whoami`
- run a dry-run publish
- publish the package to npm on a successful run
