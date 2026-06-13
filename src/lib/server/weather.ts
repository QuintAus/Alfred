import type { WeatherData } from "@/lib/types";

/**
 * Real weather via Open-Meteo (free, no API key). Geocodes a place name, then
 * fetches the current conditions + a short hourly outlook. Server-only.
 */
const DEFAULT_LOCATION = process.env.DEFAULT_WEATHER_LOCATION ?? "Malibu";

function mapCode(code: number): { icon: WeatherData["icon"]; condition: string } {
  if (code === 0) return { icon: "clear", condition: "Clear skies" };
  if (code === 1 || code === 2) return { icon: "cloud", condition: "Partly cloudy" };
  if (code === 3) return { icon: "cloud", condition: "Overcast" };
  if (code === 45 || code === 48) return { icon: "fog", condition: "Fog" };
  if (code >= 51 && code <= 67) return { icon: "rain", condition: "Drizzle" };
  if (code >= 71 && code <= 77) return { icon: "snow", condition: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "rain", condition: "Rain showers" };
  if (code >= 95) return { icon: "storm", condition: "Thunderstorm" };
  return { icon: "cloud", condition: "Cloudy" };
}

export async function getWeather(location?: string): Promise<WeatherData> {
  const place = location?.trim() || DEFAULT_LOCATION;

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en`,
  );
  const geo = await geoRes.json();
  const hit = geo?.results?.[0];
  if (!hit) throw new Error(`Couldn't find a place called "${place}".`);

  const { latitude, longitude, name } = hit;
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code&hourly=temperature_2m` +
      `&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`,
  );
  const d = await res.json();

  const tempC = Math.round(d?.current?.temperature_2m ?? 0);
  const { icon, condition } = mapCode(d?.current?.weather_code ?? 0);
  const highC = Math.round(d?.daily?.temperature_2m_max?.[0] ?? tempC);
  const lowC = Math.round(d?.daily?.temperature_2m_min?.[0] ?? tempC);

  const times: string[] = d?.hourly?.time ?? [];
  const temps: number[] = d?.hourly?.temperature_2m ?? [];
  const startIdx = Math.max(
    0,
    times.findIndex((t) => new Date(t).getTime() >= Date.now()),
  );
  const hourly: WeatherData["hourly"] = [];
  for (let i = 0; i < 6; i++) {
    const idx = startIdx + i * 2;
    if (times[idx] == null) break;
    const h = new Date(times[idx]);
    hourly.push({
      time: `${h.getHours().toString().padStart(2, "0")}:00`,
      tempC: Math.round(temps[idx]),
    });
  }

  return { location: name ?? place, tempC, condition, icon, highC, lowC, hourly };
}
