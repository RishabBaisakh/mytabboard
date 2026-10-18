type ChromeExtensionApi = {
  runtime: {
    lastError?: { message?: string }
  }
  storage: {
    local: {
      get(
        keys: string[],
        callback: (items: Record<string, unknown>) => void
      ): void
      set(items: Record<string, string>, callback: () => void): void
      remove(keys: string[], callback: () => void): void
    }
  }
  identity?: {
    getAuthToken(
      options: { interactive: boolean },
      callback: (token?: string) => void
    ): void
  }
}

export function getChromeApi(): ChromeExtensionApi | undefined {
  return (globalThis as typeof globalThis & { chrome?: ChromeExtensionApi })
    .chrome
}
