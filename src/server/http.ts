import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/server/logger";
import { ProviderError } from "@/server/providers/errors";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof ProviderError) {
    return NextResponse.json(
      { error: error.message, provider: error.provider },
      { status: error.status },
    );
  }

  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error";
  if (message.includes("Google Maps link")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logger.error({ err: error }, "Request failed");
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

