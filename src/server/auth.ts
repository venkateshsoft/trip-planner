import { NextResponse } from "next/server";

export const authCookieName = "trip_planner_session";

export function configuredApiToken() {
  return process.env.APP_API_TOKEN ?? "";
}

export function isAuthorized(request: Request) {
  const token = configuredApiToken();
  if (!token) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${authCookieName}=`))
    ?.slice(authCookieName.length + 1);
  return bearer === token || cookie === token;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: { "www-authenticate": "Bearer" } },
  );
}

