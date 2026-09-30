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
  const requestWithCookies = request as Request & {
    cookies?: { get: (name: string) => { value: string } | undefined };
  };
  const parsedCookie = requestWithCookies.cookies?.get(authCookieName)?.value;
  const headerCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${authCookieName}=`))
    ?.slice(authCookieName.length + 1);
  const cookie = parsedCookie ?? decodeCookieValue(headerCookie);
  return bearer === token || cookie === token;
}

function decodeCookieValue(value: string | undefined) {
  if (!value) return undefined;
  const unquoted = value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
  try {
    return decodeURIComponent(unquoted);
  } catch {
    return unquoted;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: { "www-authenticate": "Bearer" } },
  );
}

