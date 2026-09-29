import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "trip-planner" },
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

