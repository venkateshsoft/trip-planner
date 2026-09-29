import { describe, expect, it } from "vitest";
import { loginPath, safeReturnPath } from "@/components/auth/client-fetch";

describe("planner authentication redirect", () => {
  it("preserves an internal planner destination after login", () => {
    expect(loginPath("/trips/trip-123?tab=places")).toBe(
      "/login?returnTo=%2Ftrips%2Ftrip-123%3Ftab%3Dplaces",
    );
  });

  it("does not allow an external return URL", () => {
    expect(safeReturnPath("https://example.com/steal-session")).toBe("/");
    expect(safeReturnPath("//example.com/steal-session")).toBe("/");
  });
});

