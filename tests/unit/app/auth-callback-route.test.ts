import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

const exchangeCodeForSession = vi.fn();
const createSupabaseRouteHandlerClient = vi.fn(() => ({
  auth: { exchangeCodeForSession }
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseRouteHandlerClient
}));

describe("auth callback route", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    createSupabaseRouteHandlerClient.mockClear();
  });

  it("exchanges the code for a session and redirects to next", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest("http://localhost:3000/auth/callback?code=test-code&next=/projects");

    const response = await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response.headers.get("location")).toBe("http://localhost:3000/projects");
  });

  it("redirects to login when code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fprojects&error=missing_code");
  });

  it("redirects to login when exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid") });
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest("http://localhost:3000/auth/callback?code=bad-code&next=/admin");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fadmin&error=auth_failed");
  });

  it("accepts token-based magic link params", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest("http://localhost:3000/auth/callback?token=pkce-token&next=/projects");

    const response = await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-token");
    expect(response.headers.get("location")).toBe("http://localhost:3000/projects");
  });
});
