import type { AuthTokens, TokenStorage } from "./api"
import { getChromeApi } from "./chromeApi"

const ACCESS_TOKEN_KEY = "mytabboard.auth.access"
const REFRESH_TOKEN_KEY = "mytabboard.auth.refresh"

export class ChromeTokenStorage implements TokenStorage {
  async getTokens(): Promise<AuthTokens | null> {
    const chromeApi = getChromeApi()
    if (!chromeApi) {
      throw new Error("Chrome extension storage is unavailable.")
    }

    return new Promise((resolve, reject) => {
      chromeApi.storage.local.get(
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY],
        (items) => {
          const error = chromeApi.runtime.lastError
          if (error) {
            reject(
              new Error("Unable to read extension authentication storage.")
            )
            return
          }

          const access = items[ACCESS_TOKEN_KEY]
          const refresh = items[REFRESH_TOKEN_KEY]
          resolve(
            typeof access === "string" && typeof refresh === "string"
              ? { access, refresh }
              : null
          )
        }
      )
    })
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    const chromeApi = getChromeApi()
    if (!chromeApi) {
      throw new Error("Chrome extension storage is unavailable.")
    }

    await new Promise<void>((resolve, reject) => {
      chromeApi.storage.local.set(
        {
          [ACCESS_TOKEN_KEY]: tokens.access,
          [REFRESH_TOKEN_KEY]: tokens.refresh
        },
        () => {
          if (chromeApi.runtime.lastError) {
            reject(new Error("Unable to save extension authentication state."))
            return
          }
          resolve()
        }
      )
    })
  }

  async clearTokens(): Promise<void> {
    const chromeApi = getChromeApi()
    if (!chromeApi) {
      throw new Error("Chrome extension storage is unavailable.")
    }

    await new Promise<void>((resolve, reject) => {
      chromeApi.storage.local.remove(
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY],
        () => {
          if (chromeApi.runtime.lastError) {
            reject(new Error("Unable to clear extension authentication state."))
            return
          }
          resolve()
        }
      )
    })
  }
}
