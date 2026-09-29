import { ProviderClient, type ProviderClientOptions } from "./client";
import { ProviderError } from "./errors";
import type {
  Coordinates,
  GeocodedLocation,
  PlaceResult,
  RouteResult,
  RouteTransportMode,
} from "./types";

type GoogleGeocodeResponse = {
  status: string;
  results?: Array<{
    formatted_address: string;
    place_id?: string;
    address_components?: GoogleAddressComponent[];
    geometry?: { location?: { lat: number; lng: number } };
  }>;
};

type GoogleAddressComponent = { long_name: string; types: string[] };

type GooglePlacesResponse = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    priceLevel?: PlaceResult["priceLevel"];
    types?: string[];
  }>;
};

type GoogleRoutesResponse = {
  routes?: Array<{ distanceMeters?: number; duration?: string }>;
};

export class GoogleMapsProvider extends ProviderClient {
  private readonly apiKey: string;

  constructor(options: ProviderClientOptions = {}) {
    super("google-maps", options);
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
    if (!this.apiKey)
      throw new ProviderError(
        "GOOGLE_MAPS_API_KEY is not configured",
        this.provider,
        503,
      );
  }

  async geocode(address: string): Promise<GeocodedLocation | undefined> {
    const cacheKey = `geocode:${address.trim().toLowerCase()}`;
    return this.cached(cacheKey, 86_400, async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("address", address);
      url.searchParams.set("key", this.apiKey);
      const payload = await this.requestJson<GoogleGeocodeResponse>(url);
      if (payload.status === "ZERO_RESULTS") return undefined;
      if (
        payload.status !== "OK" ||
        !payload.results?.[0]?.geometry?.location
      ) {
        throw new ProviderError("Google geocoding failed", this.provider);
      }
      const result = payload.results[0];
      const location = result.geometry?.location;
      if (!location)
        throw new ProviderError(
          "Google geocoding returned no coordinates",
          this.provider,
        );
      return {
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        latitude: location.lat,
        longitude: location.lng,
        city: addressComponent(result.address_components, [
          "locality",
          "postal_town",
          "administrative_area_level_2",
        ]),
        state: addressComponent(result.address_components, [
          "administrative_area_level_1",
        ]),
        country: addressComponent(result.address_components, ["country"]),
      };
    });
  }

  async searchPlaces(
    query: string,
    location?: Coordinates,
    includedType?: string,
  ): Promise<PlaceResult[]> {
    const cacheKey = `places:${JSON.stringify({ query: query.trim().toLowerCase(), location, includedType })}`;
    return this.cached(cacheKey, 3_600, async () => {
      const payload = await this.requestJson<GooglePlacesResponse>(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types",
          },
          body: JSON.stringify({
            textQuery: query,
            ...(includedType ? { includedType } : {}),
            ...(location
              ? {
                  locationBias: {
                    circle: {
                      center: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                      },
                      radius: 10_000,
                    },
                  },
                }
              : {}),
          }),
        },
      );
      return (payload.places ?? []).flatMap((place) => {
        if (
          place.location?.latitude === undefined ||
          place.location.longitude === undefined ||
          !place.displayName?.text
        )
          return [];
        return [
          {
            providerId: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            latitude: place.location.latitude,
            longitude: place.location.longitude,
            rating: place.rating,
            userRatingsTotal: place.userRatingCount,
            priceLevel: place.priceLevel,
            types: place.types ?? [],
          },
        ];
      });
    });
  }

  async route(
    origin: Coordinates | string,
    destination: Coordinates | string,
    mode: RouteTransportMode,
  ): Promise<RouteResult> {
    const cacheKey = `route:${JSON.stringify({ origin, destination, mode })}`;
    return this.cached(cacheKey, 900, async () => {
      const payload = await this.requestJson<GoogleRoutesResponse>(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
          },
          body: JSON.stringify({
            origin: {
              address: typeof origin === "string" ? origin : undefined,
              location:
                typeof origin === "string"
                  ? undefined
                  : {
                      latLng: {
                        latitude: origin.latitude,
                        longitude: origin.longitude,
                      },
                    },
            },
            destination: {
              address:
                typeof destination === "string" ? destination : undefined,
              location:
                typeof destination === "string"
                  ? undefined
                  : {
                      latLng: {
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                      },
                    },
            },
            travelMode: mode,
          }),
        },
      );
      const route = payload.routes?.[0];
      if (!route?.distanceMeters || !route.duration)
        throw new ProviderError("Google route not found", this.provider, 404);
      const durationSeconds = Number.parseFloat(
        route.duration.replace("s", ""),
      );
      if (!Number.isFinite(durationSeconds))
        throw new ProviderError("Invalid route duration", this.provider);
      return {
        distanceMeters: route.distanceMeters,
        durationSeconds,
        provider: this.provider,
      };
    });
  }
}

function addressComponent(
  components: GoogleAddressComponent[] | undefined,
  types: string[],
) {
  return components?.find((component) =>
    types.some((type) => component.types.includes(type)),
  )?.long_name;
}

