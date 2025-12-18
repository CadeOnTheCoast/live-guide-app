import { describe, expect, it, afterEach } from "vitest";
import { buildEmailRedirectTo } from "@/app/login/helpers";

describe("buildEmailRedirectTo", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("builds callback URL using NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";

    const result = buildEmailRedirectTo("/projects/123");

    expect(result).toBe("https://app.example.com/auth/callback?next=%2Fprojects%2F123");
  });

  it("falls back to provided origin when env is missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";

    const result = buildEmailRedirectTo("/projects", "http://localhost:4000");

    expect(result).toBe("http://localhost:4000/auth/callback?next=%2Fprojects");
  });
});
