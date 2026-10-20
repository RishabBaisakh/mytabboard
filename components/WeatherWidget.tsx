import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  ThermometerSun,
  type LucideIcon
} from "lucide-react"
import { useEffect, useState } from "react"

import {
  fetchCurrentWeather,
  WEATHER_LOCATION,
  type CurrentWeather,
  type WeatherCondition
} from "../services/weather"

const REFRESH_INTERVAL_MS = 20 * 60 * 1000

const conditionIcons: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
  unknown: ThermometerSun
}

type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; weather: CurrentWeather }

export function WeatherWidget() {
  const [state, setState] = useState<WeatherState>({ status: "loading" })

  useEffect(() => {
    let controller: AbortController | null = null

    function load() {
      controller?.abort()
      const current = new AbortController()
      controller = current
      fetchCurrentWeather(current.signal)
        .then((weather) => setState({ status: "ready", weather }))
        .catch(() => {
          if (current.signal.aborted) return
          // Keep the last good reading if a refresh fails.
          setState((previous) =>
            previous.status === "ready" ? previous : { status: "error" }
          )
        })
    }

    load()
    const timer = window.setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      window.clearInterval(timer)
      controller?.abort()
    }
  }, [])

  const Icon =
    state.status === "ready"
      ? conditionIcons[state.weather.condition]
      : ThermometerSun

  return (
    <div className="weather-widget" aria-live="polite">
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      {state.status === "ready" ? (
        <span>
          {state.weather.temperatureC}°C · {WEATHER_LOCATION.name}
        </span>
      ) : (
        <span className="weather-widget-muted">
          {state.status === "loading"
            ? "Loading weather…"
            : "Weather unavailable"}
        </span>
      )}
    </div>
  )
}
