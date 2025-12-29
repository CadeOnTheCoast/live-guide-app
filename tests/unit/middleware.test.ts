import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

describe("middleware", () => {
  it("redirects magic link codes to the auth callback", async () => {
    const middleware = (await import("../../middleware")).middleware;
    const request = new NextRequest("http://localhost:3000/?code=test-code&next=/projects/123");

    const response = middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost:3000/auth/callback?code=test-code&next=%2Fprojects%2F123");
  });

  it("defaults next to /projects when missing", async () => {
    const middleware = (await import("../../middleware")).middleware;
    const request = new NextRequest("http://localhost:3000/?code=test-code");

    const response = middleware(request);

    expect(response?.headers.get("location")).toBe("http://localhost:3000/auth/callback?code=test-code&next=%2Fprojects");
  });

  it("ignores requests without a code", async () => {
    const middleware = (await import("../../middleware")).middleware;
    const request = new NextRequest("http://localhost:3000/projects");

    const response = middleware(request);

    expect(response?.status).toBe(200);
  });

  it("supports token-style magic link params", async () => {
    const middleware = (await import("../../middleware")).middleware;
    const request = new NextRequest("http://localhost:3000/projects?token=pkce-abc");

    const response = middleware(request);

    expect(response?.headers.get("location")).toBe("http://localhost:3000/auth/callback?code=pkce-abc&next=%2Fprojects");
  });
});
