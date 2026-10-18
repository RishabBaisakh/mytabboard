export type AuthTokens = {
  access: string
  refresh: string
}

export interface TokenStorage {
  getTokens(): Promise<AuthTokens | null>
  setTokens(tokens: AuthTokens): Promise<void>
  clearTokens(): Promise<void>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export type ApiRequestOptions = {
  method?: string
  body?: unknown
  authenticated?: boolean
  retryOnUnauthorized?: boolean
  accessToken?: string
}

type TokenResponse = Partial<AuthTokens>

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function responseErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback

  const record = payload as Record<string, unknown>
  if (typeof record.detail === "string") return record.detail
  if (typeof record.error === "string") return record.error
  if (Array.isArray(record.non_field_errors)) {
    const message = record.non_field_errors.find(
      (value): value is string => typeof value === "string"
    )
    if (message) return message
  }

  return fallback
}

function isTokenPair(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") return false

  const tokens = value as TokenResponse
  return typeof tokens.access === "string" && typeof tokens.refresh === "string"
}

export class ApiClient {
  private readonly baseUrl: string
  private refreshInFlight: Promise<AuthTokens | null> | null = null

  constructor(
    baseUrl: string,
    private readonly storage: TokenStorage,
    private readonly fetcher: typeof fetch = fetch
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "")
  }

  getTokens(): Promise<AuthTokens | null> {
    return this.storage.getTokens()
  }

  setTokens(tokens: AuthTokens): Promise<void> {
    return this.storage.setTokens(tokens)
  }

  clearTokens(): Promise<void> {
    return this.storage.clearTokens()
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      body,
      authenticated = false,
      retryOnUnauthorized = true,
      accessToken
    } = options
    const tokens = authenticated ? await this.storage.getTokens() : null
    const requestToken = accessToken ?? tokens?.access
    const headers = new Headers()

    if (body !== undefined) headers.set("Content-Type", "application/json")
    if (authenticated && requestToken) {
      headers.set("Authorization", `Bearer ${requestToken}`)
    }

    let response: Response
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch {
      throw new ApiError("Unable to reach the API server.", 0)
    }

    const payload = await readResponse(response)
    if (response.status === 401 && authenticated) {
      if (!retryOnUnauthorized) {
        await this.storage.clearTokens()
      } else {
        const currentTokens = await this.storage.getTokens()
        const rotatedByAnotherRequest =
          !!tokens &&
          !!currentTokens &&
          (currentTokens.access !== tokens.access ||
            currentTokens.refresh !== tokens.refresh)
        const nextTokens = rotatedByAnotherRequest
          ? currentTokens
          : await this.refreshTokens()

        if (!nextTokens) {
          await this.storage.clearTokens()
          throw new ApiError(
            "Your session has expired. Please sign in again.",
            401,
            payload
          )
        }

        return this.request<T>(path, {
          ...options,
          retryOnUnauthorized: false,
          accessToken: nextTokens.access
        })
      }
    }

    if (!response.ok) {
      throw new ApiError(
        responseErrorMessage(
          payload,
          `API request failed (${response.status}).`
        ),
        response.status,
        payload
      )
    }

    return payload as T
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh().finally(() => {
        this.refreshInFlight = null
      })
    }

    return this.refreshInFlight
  }

  private async performRefresh(): Promise<AuthTokens | null> {
    try {
      const currentTokens = await this.storage.getTokens()
      if (!currentTokens?.refresh) {
        await this.storage.clearTokens()
        return null
      }

      const response = await this.fetcher(
        `${this.baseUrl}/api/auth/token/refresh/`,
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ refresh: currentTokens.refresh })
        }
      )
      const payload = await readResponse(response)
      if (!response.ok || !isTokenPair(payload)) {
        await this.storage.clearTokens()
        return null
      }

      await this.storage.setTokens(payload)
      return payload
    } catch {
      await this.storage.clearTokens()
      return null
    }
  }
}

export const API_BASE_URL =
  process.env.PLASMO_PUBLIC_API_BASE_URL?.trim() || "http://127.0.0.1:8000"
