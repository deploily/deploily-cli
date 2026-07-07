import open from "open"
import { authService } from "../auth/index.js"
import { startCallbackServer } from "../auth/callback.js"

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
  } catch (error) {
    console.error("Error occurred while logging in:", error)
    process.exit(1)
  }
}

export async function handleWhoami() {
  try {
  } catch (error) {
    console.error("Error occurred while logging in:", error)
    process.exit(1)
  }
}
