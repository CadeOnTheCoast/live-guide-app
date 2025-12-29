import { describe, expect, it, afterEach } from "vitest";
import { buildEmailRedirectTo } from "@/app/login/helpers";
import { resolveNextPath } from "@/lib/auth/redirects";

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

  it("normalizes unsafe next values to the default projects path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";

    const result = buildEmailRedirectTo("not-a-path");

    expect(result).toBe("https://app.example.com/auth/callback?next=%2Fprojects");
  });
});

describe("resolveNextPath", () => {
  it("returns the default when next is empty", () => {
    expect(resolveNextPath(undefined)).toBe("/projects");
  });

  it("returns pathname for absolute URLs", () => {
    expect(resolveNextPath("https://example.com/projects?tab=1")).toBe("/projects?tab=1");
  });
});
