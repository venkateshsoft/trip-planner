import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import {
  authCookieName,
  isAuthorized,
  unauthorizedResponse,
} from "@/server/auth";

afterEach(() => vi.unstubAllEnvs());

describe("production session authentication", () => {
  it("creates a session cookie that authorizes planner API requests", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_API_TOKEN", "demo secret+encoded");

    const response = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ token: "demo secret+encoded" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${authCookieName}=demo%20secret%2Bencoded`);
    expect(
      isAuthorized(
        new Request("http://localhost/api/trips", {
          headers: { cookie: setCookie?.split(";")[0] ?? "" },
        }),
      ),
    ).toBe(true);
  });

  it("rejects an invalid token without creating a session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_API_TOKEN", "demo-secret");

    const response = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ token: "wrong" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns the existing API authentication error shape", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });
});

