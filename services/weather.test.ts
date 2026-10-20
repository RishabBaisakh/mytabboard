import { describe, expect, it, vi } from "vitest"

import {
  fetchCurrentWeather,
  getWeatherCondition,
  parseCurrentWeather
} from "./weather"

describe("weather service", () => {
  it("maps WMO codes to conditions with an unknown fallback", () => {
    expect(getWeatherCondition(0)).toBe("clear")
    expect(getWeatherCondition(2)).toBe("partly-cloudy")
    expect(getWeatherCondition(3)).toBe("cloudy")
    expect(getWeatherCondition(45)).toBe("fog")
    expect(getWeatherCondition(53)).toBe("drizzle")
    expect(getWeatherCondition(81)).toBe("rain")
    expect(getWeatherCondition(73)).toBe("snow")
    expect(getWeatherCondition(95)).toBe("thunderstorm")
    expect(getWeatherCondition(1234)).toBe("unknown")
  })

  it("parses valid responses and rejects malformed ones", () => {
    expect(
      parseCurrentWeather({
        current: { temperature_2m: 17.6, weather_code: 0 }
      })
    ).toEqual({ temperatureC: 18, condition: "clear" })
    expect(parseCurrentWeather({ current: { weather_code: 0 } })).toBeNull()
    expect(parseCurrentWeather(null)).toBeNull()
  })

  it("requests only current temperature and weather code", async () => {
    const fetchMock = vi.fn(async (_url: string) =>
      Response.json({ current: { temperature_2m: 5, weather_code: 71 } })
    )
    vi.stubGlobal("fetch", fetchMock)

    try {
      await expect(fetchCurrentWeather()).resolves.toEqual({
        temperatureC: 5,
        condition: "snow"
      })
      const url = new URL(fetchMock.mock.calls[0][0])
      expect(url.searchParams.get("current")).toBe(
        "temperature_2m,weather_code"
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("throws on failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 }))
    )
    try {
      await expect(fetchCurrentWeather()).rejects.toThrow(/500/)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
