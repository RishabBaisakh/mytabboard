export const WEATHER_LOCATION = {
  name: "Montreal",
  latitude: 45.5019,
  longitude: -73.5674
}

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm"
  | "unknown"

export type CurrentWeather = {
  temperatureC: number
  condition: WeatherCondition
}

export function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return "clear"
  if (code === 1 || code === 2) return "partly-cloudy"
  if (code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code >= 51 && code <= 57) return "drizzle"
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow"
  if (code >= 95 && code <= 99) return "thunderstorm"
  return "unknown"
}

export function parseCurrentWeather(payload: unknown): CurrentWeather | null {
  if (!payload || typeof payload !== "object") return null
  const current = (payload as { current?: unknown }).current
  if (!current || typeof current !== "object") return null

  const { temperature_2m, weather_code } = current as Record<string, unknown>
  if (typeof temperature_2m !== "number" || !Number.isFinite(temperature_2m)) {
    return null
  }

  return {
    temperatureC: Math.round(temperature_2m),
    condition:
      typeof weather_code === "number"
        ? getWeatherCondition(weather_code)
        : "unknown"
  }
}

export async function fetchCurrentWeather(
  signal?: AbortSignal,
  location = WEATHER_LOCATION
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,weather_code",
    timezone: "auto"
  })
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal }
  )
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status}).`)
  }

  const weather = parseCurrentWeather(await response.json())
  if (!weather) throw new Error("Weather data was unavailable.")
  return weather
}
