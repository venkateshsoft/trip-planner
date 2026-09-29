const supportedHosts = new Set([
  "maps.google.com",
  "www.google.com",
  "google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

export function normalizeGoogleMapsUrl(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;

  const url = new URL(value);
  if (!supportedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("googleMapsUrl must be a Google Maps link");
  }

  return url.toString();
}

export function extractMapCoordinates(value: string | undefined): {
  latitude?: number;
  longitude?: number;
} {
  if (!value) return {};

  const url = new URL(value);
  const query = url.searchParams.get("query") ?? url.searchParams.get("q");
  const match = query?.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  );
  if (!match) return {};

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {};
  }

  return { latitude, longitude };
}

