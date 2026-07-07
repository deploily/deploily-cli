import crypto from "crypto"

// Generate a cryptographically secure random string
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Generate PKCE code verifier
export function generateCodeVerifier(): string {
  const length = 128
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let result = ""
  const randomValues = crypto.getRandomValues(new Uint8Array(length))

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length]
  }

  return result
}

// Generate PKCE code challenge from verifier
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest()
  return hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

// Generate state parameter for CSRF protection
export function generateState(): string {
  return generateRandomString(32)
}
