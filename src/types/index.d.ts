export interface CallbackResult {
  code: string
  state: string
}

// auth
export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface UserInfo {
  email: string
  name: string
  preferred_username: string
  given_name: string
  family_name: string
}

export interface AuthContext {
  state: string
  codeVerifier: string
  codeChallenge: string
}

// storage
export interface StoredCredentials {
  access_token: string
  refresh_token: string
  expires_at: number
  user_email?: string
}
