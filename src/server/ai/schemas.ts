import { z } from "zod";

export const preferenceExtractionSchema = z.object({
  interests: z.array(z.string().trim().min(1).max(60)).max(20),
  cuisines: z.array(z.string().trim().min(1).max(60)).max(10),
  pace: z.enum(["relaxed", "balanced", "packed"]),
  hotelStarRating: z.number().int().min(1).max(5).nullable(),
  transportPreference: z
    .enum(["WALKING", "BICYCLING", "TRANSIT", "DRIVING"])
    .nullable(),
  constraints: z.array(z.string().trim().min(1).max(160)).max(20),
});

export const recommendationExplanationSchema = z.object({
  recommendations: z
    .array(
      z.object({
        entityId: z.string().min(1).max(120),
        reason: z.string().min(1).max(500),
        caveats: z.array(z.string().min(1).max(240)).max(5),
      }),
    )
    .max(50),
});

export const itineraryCommandSchema = z
  .object({
    action: z.enum(["remove", "reorder", "suggest_discovery", "noop"]),
    stopId: z.string().max(120).nullable(),
    dayNumber: z.number().int().min(1).max(90).nullable(),
    orderedStopIds: z.array(z.string().max(120)).max(20),
    query: z.string().max(200).nullable(),
    replaceStopId: z.string().max(120).nullable(),
    explanation: z.string().min(1).max(500),
  })
  .superRefine((value, context) => {
    if (value.action === "remove" && !value.stopId) {
      context.addIssue({
        code: "custom",
        message: "remove requires stopId",
        path: ["stopId"],
      });
    }
    if (
      value.action === "reorder" &&
      (!value.dayNumber || value.orderedStopIds.length === 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "reorder requires dayNumber and orderedStopIds",
        path: ["orderedStopIds"],
      });
    }
    if (value.action === "suggest_discovery" && !value.query) {
      context.addIssue({
        code: "custom",
        message: "suggest_discovery requires query",
        path: ["query"],
      });
    }
  });

export const aiPreferenceRequestSchema = z.object({
  text: z.string().trim().min(1).max(4_000),
});

export const aiExplanationRequestSchema = z.object({
  preferences: z.string().trim().max(2_000).default(""),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
        rating: z.number().min(0).max(5).nullable().optional(),
        categories: z.array(z.string().max(80)).max(20).default([]),
      }),
    )
    .min(1)
    .max(50),
});

export const itineraryCommandRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(2_000),
  itinerary: z.object({
    days: z
      .array(
        z.object({
          dayNumber: z.number().int().min(1).max(90),
          stops: z
            .array(
              z.object({
                id: z.string().min(1).max(120),
                name: z.string().min(1).max(200),
              }),
            )
            .max(20),
        }),
      )
      .max(90),
  }),
});

export type PreferenceExtraction = z.infer<typeof preferenceExtractionSchema>;
export type RecommendationExplanations = z.infer<
  typeof recommendationExplanationSchema
>;
export type ItineraryCommand = z.infer<typeof itineraryCommandSchema>;

