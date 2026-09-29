import { ProviderClient, type ProviderClientOptions } from "./client";
import { ProviderError } from "./errors";
import type { Coordinates, WeatherDay } from "./types";

type OpenMeteoResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_probability_max?: number[];
  };
};

export class WeatherProvider extends ProviderClient {
  constructor(options: ProviderClientOptions = {}) {
    super("open-meteo", options);
  }

  async forecast(
    location: Coordinates,
    startDate: string,
    endDate: string,
  ): Promise<WeatherDay[]> {
    const cacheKey = `forecast:${JSON.stringify({ location, startDate, endDate })}`;
    return this.cached(cacheKey, 1_800, async () => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(location.latitude));
      url.searchParams.set("longitude", String(location.longitude));
      url.searchParams.set("start_date", startDate);
      url.searchParams.set("end_date", endDate);
      url.searchParams.set(
        "daily",
        "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max",
      );
      url.searchParams.set("timezone", "auto");
      const payload = await this.requestJson<OpenMeteoResponse>(url);
      const daily = payload.daily;
      if (
        !daily?.time ||
        !daily.weather_code ||
        !daily.temperature_2m_min ||
        !daily.temperature_2m_max ||
        !daily.precipitation_probability_max
      ) {
        throw new ProviderError(
          "Weather forecast response was incomplete",
          this.provider,
        );
      }
      return daily.time.map((date, index) => ({
        date,
        weatherCode: daily.weather_code![index],
        temperatureMinC: daily.temperature_2m_min![index],
        temperatureMaxC: daily.temperature_2m_max![index],
        precipitationProbability: daily.precipitation_probability_max![index],
      }));
    });
  }
}

