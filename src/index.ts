#!/usr/bin/env node
import { handleLogin, handleLogout, handleWhoami } from "./commands/auth.js"

const VERSION = "1.0.0" // TODO: read from package.json

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === "--help" || command === "-h") {
    showHelp()
    return
  }

  if (command === "--version" || command === "-v") {
    console.log(`deploily version ${VERSION}`)
    return
  }

  try {
    switch (command) {
      case "login":
        await handleLogin()
        break

      case "logout":
        await handleLogout()
        break

      case "whoami":
        await handleWhoami()
        break

      default:
        console.error(`Unknown command: ${command}`)
        showHelp()
        process.exit(1)
    }
  } catch (err) {
    console.error(`Error executing command '${command}':`, err)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
Usage:
  deploily [command]

Commands:
  login        Authenticate with Keycloak
  logout       Clear authentication tokens
  whoami       Show current user information

Options:
  --help, -h   Show this help message
  --version    Show version number

Examples:
  deploily login
  deploily logout
  deploily whoami
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
