import { NextResponse } from "next/server";
import { z } from "zod";
import { authCookieName, configuredApiToken } from "@/server/auth";
import { errorResponse } from "@/server/http";

const loginSchema = z.object({ token: z.string().min(1).max(500) });

export async function POST(request: Request) {
  try {
    const configured = configuredApiToken();
    if (!configured || process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "Token login is only enabled with APP_API_TOKEN in production",
        },
        { status: 503 },
      );
    }
    const { token } = loginSchema.parse(await request.json());
    if (token !== configured)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 86_400,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

