import { describe, expect, it, afterEach } from "vitest";
import { buildEmailRedirectTo } from "@/app/login/helpers";

describe("buildEmailRedirectTo", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_VERCEL_URL = originalVercelUrl;
  });

  it("prioritizes provided origin over environment variables", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://env.example.com";
    const result = buildEmailRedirectTo("/projects", "https://actual.example.com");
    expect(result).toBe("https://actual.example.com/auth/callback?next=%2Fprojects");
  });

  it("falls back to NEXT_PUBLIC_SITE_URL if origin is missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://env.example.com";
    const result = buildEmailRedirectTo("/projects");
    expect(result).toBe("https://env.example.com/auth/callback?next=%2Fprojects");
  });

  it("falls back to NEXT_PUBLIC_VERCEL_URL if origin and site URL are missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    process.env.NEXT_PUBLIC_VERCEL_URL = "app-v2.vercel.app";
    const result = buildEmailRedirectTo("/projects");
    expect(result).toBe("https://app-v2.vercel.app/auth/callback?next=%2Fprojects");
  });

  it("falls back to localhost:3000 as a last resort", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    process.env.NEXT_PUBLIC_VERCEL_URL = "";
    const result = buildEmailRedirectTo("/projects");
    expect(result).toBe("http://localhost:3000/auth/callback?next=%2Fprojects");
  });
});
