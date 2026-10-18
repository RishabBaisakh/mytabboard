import { API_BASE_URL, ApiClient, type AuthTokens } from "./api"
import { requestGoogleAccessToken } from "./chromeIdentity"
import { ChromeTokenStorage } from "./chromeStorage"

type AuthResponse = {
  access: string
  refresh: string
  [key: string]: unknown
}

export type SignupCredentials = {
  username: string
  email: string
  password: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type GoogleAccessTokenProvider = () => Promise<string>

export function createAuthService(
  api: ApiClient,
  getGoogleAccessToken: GoogleAccessTokenProvider = requestGoogleAccessToken
) {
  async function saveAuthResponse(
    response: AuthResponse
  ): Promise<AuthResponse> {
    if (
      typeof response?.access !== "string" ||
      typeof response?.refresh !== "string"
    ) {
      throw new Error("The server returned an invalid authentication response.")
    }

    const tokens: AuthTokens = {
      access: response.access,
      refresh: response.refresh
    }
    await api.setTokens(tokens)
    return response
  }

  return {
    async signup(credentials: SignupCredentials) {
      const response = await api.request<AuthResponse>(
        "/api/auth/registration/",
        {
          method: "POST",
          body: {
            username: credentials.username,
            email: credentials.email,
            password1: credentials.password,
            password2: credentials.password
          }
        }
      )
      return saveAuthResponse(response)
    },

    async login(credentials: LoginCredentials) {
      const response = await api.request<AuthResponse>("/api/auth/login/", {
        method: "POST",
        body: credentials
      })
      return saveAuthResponse(response)
    },

    async loginWithGoogle() {
      const googleAccessToken = await getGoogleAccessToken()
      const response = await api.request<AuthResponse>("/api/auth/google/", {
        method: "POST",
        body: { access_token: googleAccessToken }
      })
      return saveAuthResponse(response)
    },

    async logout() {
      const tokens = await api.getTokens()
      if (!tokens) {
        await api.clearTokens()
        return
      }

      try {
        await api.request("/api/auth/logout/", {
          method: "POST",
          body: { refresh: tokens.refresh },
          authenticated: true,
          retryOnUnauthorized: false,
          accessToken: tokens.access
        })
      } catch {
        // The local session must end even when the backend rejects an expired token.
      } finally {
        await api.clearTokens()
      }
    },

    async refresh() {
      const tokens = await api.refreshTokens()
      if (!tokens) {
        throw new Error("Your session has expired. Please sign in again.")
      }
      return tokens
    },

    async hasStoredTokens() {
      const tokens = await api.getTokens()
      return Boolean(tokens?.access && tokens.refresh)
    },

    currentUser<T = unknown>() {
      return api.request<T>("/api/auth/user/", { authenticated: true })
    }
  }
}

export const authService = createAuthService(
  new ApiClient(API_BASE_URL, new ChromeTokenStorage())
)
