import { z } from "zod";

const openingWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openMinute: z.number().int().min(0).max(1_439),
    closeMinute: z.number().int().min(1).max(1_440),
  })
  .refine((value) => value.closeMinute > value.openMinute, {
    message: "closeMinute must be after openMinute",
    path: ["closeMinute"],
  });

export const itineraryCandidateSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  rating: z.number().min(0).max(5).optional(),
  interestTags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  estimatedVisitMinutes: z.number().int().min(15).max(480).default(90),
  estimatedCostMinor: z.number().int().min(0).max(1_000_000_000).default(0),
  openingHours: z.array(openingWindowSchema).max(7).optional(),
});

export const generateItinerarySchema = z.object({
  tripId: z.string().trim().min(1).max(32),
  candidates: z.array(itineraryCandidateSchema).min(1).max(12),
});

export type GenerateItineraryInput = z.infer<typeof generateItinerarySchema>;

export const editItinerarySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("remove"), stopId: z.string().min(1) }),
  z.object({
    action: z.literal("reorder"),
    dayNumber: z.number().int().min(1).max(90),
    orderedStopIds: z.array(z.string().min(1)).min(1).max(20),
  }),
  z.object({
    action: z.literal("add"),
    dayNumber: z.number().int().min(1).max(90),
    candidate: itineraryCandidateSchema,
  }),
  z.object({
    action: z.literal("replace"),
    stopId: z.string().min(1),
    candidate: itineraryCandidateSchema,
  }),
]);

