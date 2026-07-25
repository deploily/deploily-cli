import axios, { AxiosInstance } from "axios"
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "../utils/pkce.js"
import { AUTH_CONFIG } from "../config/constants.js"
import { credentialStorage } from "../storage/credentials.js"
import {
  AuthContext,
  StoredCredentials,
  TokenResponse,
  UserInfo,
} from "../types/index.js"

class AuthenticationService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      timeout: 10000,
    })
  }

  private buildClientAuthHeaders(): Record<string, string> {
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET

    if (!clientSecret) {
      return {}
    }

    const clientId = process.env.KEYCLOAK_CLIENT_ID!
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    )

    return {
      Authorization: `Basic ${basicAuth}`,
    }
  }

  // Generate authorization URL for user login
  generateAuthorizationUrl(): { url: string; context: AuthContext } {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.CLIENT_ID,
      response_type: AUTH_CONFIG.RESPONSE_TYPE,
      redirect_uri: AUTH_CONFIG.REDIRECT_URI,
      scope: AUTH_CONFIG.SCOPE,
      code_challenge: codeChallenge,
      code_challenge_method: AUTH_CONFIG.CODE_CHALLENGE_METHOD,
      state,
    })

    const url = `${AUTH_CONFIG.KEYCLOAK_AUTH_ENDPOINT}?${params.toString()}`

    return {
      url,
      context: { state, codeVerifier, codeChallenge },
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse> {
    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        redirect_uri: process.env.KEYCLOAK_REDIRECT_URI!,
        code_verifier: codeVerifier,
      })

      const response = await this.client.post<TokenResponse>(
        process.env.KEYCLOAK_TOKEN_ENDPOINT!,
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...this.buildClientAuthHeaders(),
          },
        },
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData =
          typeof error.response?.data === "string"
            ? error.response.data
            : JSON.stringify(error.response?.data ?? {})
        const authHint =
          error.response?.status === 401 &&
          responseData.includes("unauthorized_client")
            ? " This usually means the Keycloak client is confidential and KEYCLOAK_CLIENT_SECRET is missing or invalid."
            : ""

        throw new Error(
          `Failed to exchange code for token: ${error.message}${responseData ? ` (${responseData})` : ""}${authHint}`,
        )
      }

      throw new Error(
        `Failed to exchange code for token: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
      })

      const response = await this.client.post<TokenResponse>(
        process.env.KEYCLOAK_TOKEN_ENDPOINT!,
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...this.buildClientAuthHeaders(),
          },
        },
      )

      return response.data
    } catch (error) {
      throw new Error(
        `Failed to refresh token: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  // Get user information from access token
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await this.client.get<UserInfo>(
        process.env.KEYCLOAK_USERINFO_ENDPOINT!,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      return response.data
    } catch (error) {
      throw new Error(
        `Failed to fetch user info: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  // Store tokens after successful authentication
  async storeTokens(token: TokenResponse, userEmail?: string): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + token.expires_in

    const credentials: StoredCredentials = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      user_email: userEmail,
    }

    await credentialStorage.save(credentials)
  }

  // Get valid access token
  async getValidAccessToken(): Promise<string | null> {
    const credentials = await credentialStorage.load()
    if (!credentials) {
      return null
    }

    // Check if token is expired
    if (credentials.expires_at < Date.now() / 1000) {
      try {
        const newToken = await this.refreshAccessToken(
          credentials.refresh_token,
        )
        await this.storeTokens(newToken, credentials.user_email)
        return newToken.access_token
      } catch (error) {
        // Token refresh failed, need to re-authenticate
        await credentialStorage.clear()
        return null
      }
    }

    return credentials.access_token
  }

  // Logout and clear stored tokens
  async logout(): Promise<void> {
    const credentials = await credentialStorage.load()

    if (credentials) {
      try {
        const body = new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          refresh_token: credentials.refresh_token,
        })

        // Optionally call Keycloak logout endpoint
        await this.client.post(process.env.KEYCLOAK_LOGOUT_ENDPOINT!, body, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...this.buildClientAuthHeaders(),
          },
        })
      } catch (error) {
        // Continue with local logout even if server call fails
      }
    }

    // Clear local credentials
    await credentialStorage.clear()
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const credentials = await credentialStorage.load()
    return credentials !== null
  }
}

export const authService = new AuthenticationService()
