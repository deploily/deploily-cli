import open from "open"
import { authService } from "../auth/index.js"
import { startCallbackServer } from "../auth/callback.js"
import { credentialStorage } from "../storage/credentials.js"
import chalk from "chalk"

export async function handleLogin() {
  try {
    // 1. Check if logged in
    const isAuth = await authService.isAuthenticated()
    if (isAuth) {
      console.log("Already logged in. Use 'deploily logout' to log out first.")
      return
    }
    console.log("Opening browser for authentication...")

    // 2. Generate authorization URL
    const { url, context } = authService.generateAuthorizationUrl()

    // 3. Start callback server
    const callbackPromise = startCallbackServer(context.state)

    // 4. Open browser
    await open(url)

    console.log("Waiting for authentication...")

    // 5. Wait for callback
    const callback = await callbackPromise

    // 6. Exchange code for token
    const tokens = await authService.exchangeCodeForToken(
      callback.code,
      context.codeVerifier,
    )

    // 7. Get user info
    const userInfo = await authService.getUserInfo(tokens.access_token)

    // 8. Store tokens
    await authService.storeTokens(tokens, userInfo.email)
    console.log("Successfully authenticated")
    console.log(`Welcome, ${userInfo.email}!`)
  } catch (error) {
    console.error("Error occurred while logging in:", error)
    process.exit(1)
  }
}

export async function handleLogout() {
  try {
    const isAuth = await authService.isAuthenticated()

    if (!isAuth) {
      console.log("You are not logged in.")
      return
    }

    await authService.logout()
    console.log("Successfully logged out")
  } catch (error) {
    console.error("Error occurred while logging in:", error)
    process.exit(1)
  }
}

export async function handleWhoami() {
  try {
    const isAuth = await authService.isAuthenticated()

    if (!isAuth) {
      console.log(
        "You are not logged in. Use `deploily login` to authenticate.",
      )
      process.exit(1)
    }

    // Get stored credentials
    const credentials = await credentialStorage.load()

    if (!credentials) {
      console.log(
        "You are not logged in. Use `deploily login` to authenticate.",
      )
      process.exit(1)
    }

    // Get user info from API
    const userInfo = await authService.getUserInfo(credentials.access_token)

    console.log("Current User:")
    console.log(`├─ Email: ${userInfo.email}`)
    console.log(`├─ Name: ${userInfo.name}`)
    console.log(`├─ Username: ${userInfo.preferred_username}`)

    // Calculate token expiry
    const expiresAt = new Date(credentials.expires_at * 1000)
    const now = new Date()
    const timeRemaining = Math.floor(
      (credentials.expires_at * 1000 - now.getTime()) / 1000,
    )

    if (timeRemaining > 0) {
      const hours = Math.floor(timeRemaining / 3600)
      const minutes = Math.floor((timeRemaining % 3600) / 60)
      console.log(chalk.gray(`└─ Token expires in: ${hours}h ${minutes}m`))
    } else {
      console.log(chalk.gray(`└─ Token expires in: Soon (will auto-refresh)`))
    }
  } catch (error) {
    console.error("Error occurred while logging in:", error)
    process.exit(1)
  }
}
