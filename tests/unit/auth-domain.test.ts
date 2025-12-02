import { describe, expect, it } from "vitest";
import { isAllowedEmail } from "@/server/auth-domain";

describe("isAllowedEmail", () => {
  it("returns true for allowed domain", () => {
    expect(isAllowedEmail("user@mobilebaykeeper.org", "mobilebaykeeper.org")).toBe(true);
  });

  it("returns false for other domains", () => {
    expect(isAllowedEmail("user@example.org", "mobilebaykeeper.org")).toBe(false);
  });

  it("handles comma separated domains", () => {
    expect(isAllowedEmail("user@example.com", "mobilebaykeeper.org,example.com")).toBe(true);
  });
});
