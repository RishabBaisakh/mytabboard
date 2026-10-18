import { getChromeApi } from "./chromeApi"

export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chromeApi = getChromeApi()
    if (!chromeApi?.identity) {
      reject(
        new Error("Google sign-in is unavailable in this extension context.")
      )
      return
    }

    chromeApi.identity.getAuthToken({ interactive: true }, (token) => {
      const error = chromeApi.runtime.lastError
      if (error || !token) {
        reject(new Error("Google sign-in could not be completed."))
        return
      }
      resolve(token)
    })
  })
}
