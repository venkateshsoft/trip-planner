import { z } from "zod";

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const routePointSchema = z.union([
  z.string().trim().min(1).max(240),
  coordinatesSchema,
]);

export const providerGeocodeSchema = z.object({
  address: z.string().trim().min(1).max(240),
});

export const destinationResolveSchema = z
  .object({
    tripId: z.string().trim().min(1).max(64),
    city: z.string().trim().min(1).max(120).optional(),
    state: z.string().trim().max(120).optional(),
    country: z.string().trim().min(1).max(120).optional(),
    location: z.string().trim().min(1).max(240).optional(),
    googleMapsUrl: z.string().trim().url().max(2_048).optional(),
  })
  .refine(
    (value) => Boolean(value.location || value.googleMapsUrl || (value.city && value.country)),
    { message: "Provide location, googleMapsUrl, or city and country" },
  );

export const providerPlacesSchema = z.object({
  query: z.string().trim().min(1).max(200),
  location: coordinatesSchema.optional(),
  includedType: z.string().trim().min(1).max(80).optional(),
  destinationId: z.string().trim().min(1).max(64).optional(),
});

export const providerRouteSchema = z.object({
  origin: routePointSchema,
  destination: routePointSchema,
  mode: z.enum(["WALKING", "BICYCLING", "TRANSIT", "DRIVING"]),
});

export const providerWeatherSchema = z
  .object({
    location: coordinatesSchema,
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

