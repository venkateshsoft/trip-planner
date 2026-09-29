import { z } from "zod";
import { coordinatesSchema } from "@/server/providers/schemas";

const baseDiscoverySchema = z.object({
  query: z.string().trim().min(1).max(160),
  location: coordinatesSchema.optional(),
  limit: z.number().int().min(1).max(50).default(20),
  minRating: z.number().min(0).max(5).optional(),
});

export const poiDiscoverySchema = baseDiscoverySchema;

export const hotelDiscoverySchema = baseDiscoverySchema.extend({
  maxPriceLevel: z.number().int().min(0).max(4).optional(),
  preferredStarRating: z.number().int().min(1).max(5).optional(),
});

export const restaurantDiscoverySchema = baseDiscoverySchema.extend({
  cuisine: z.string().trim().min(1).max(80).optional(),
  maxPriceLevel: z.number().int().min(0).max(4).optional(),
});

