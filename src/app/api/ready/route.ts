import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { logger } from "@/server/logger";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", service: "trip-planner" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");
    return NextResponse.json(
      { status: "not_ready", service: "trip-planner" },
      { status: 503 },
    );
  }
}

