import { z } from "zod";

export const transportModeSchema = z.enum([
  "WALKING",
  "BICYCLING",
  "TRANSIT",
  "DRIVING",
]);

const moneySchema = z.number().int().min(0).max(1_000_000_000);

export const tripInputSchema = z
  .object({
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().max(120).optional(),
    country: z.string().trim().min(1).max(120),
    googleMapsUrl: z
      .string()
      .trim()
      .url()
      .max(2_048)
      .optional()
      .or(z.literal("")),
    startingLocation: z.string().trim().min(1).max(240),
    transportMode: transportModeSchema,
    travelDays: z.number().int().min(1).max(90),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/)
      .default("USD"),
    totalBudgetMinor: moneySchema,
    hotelBudgetMinor: moneySchema,
    foodBudgetMinor: moneySchema,
    travelerCount: z.number().int().min(1).max(100).default(1),
    hotelStarRating: z.number().int().min(1).max(5).optional(),
    interests: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  })
  .refine(
    (value) =>
      value.travelDays ===
      Math.floor(
        (value.endDate.getTime() - value.startDate.getTime()) / 86_400_000,
      ) +
        1,
    {
      message: "travelDays must match the inclusive date range",
      path: ["travelDays"],
    },
  )
  .refine(
    (value) =>
      value.hotelBudgetMinor + value.foodBudgetMinor <= value.totalBudgetMinor,
    {
      message:
        "hotelBudgetMinor and foodBudgetMinor cannot exceed totalBudgetMinor",
      path: ["totalBudgetMinor"],
    },
  );

export type TripInput = z.infer<typeof tripInputSchema>;

