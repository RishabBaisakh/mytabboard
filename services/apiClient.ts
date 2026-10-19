import { API_BASE_URL, ApiClient } from "./api"
import { ChromeTokenStorage } from "./chromeStorage"

export const apiClient = new ApiClient(API_BASE_URL, new ChromeTokenStorage())
