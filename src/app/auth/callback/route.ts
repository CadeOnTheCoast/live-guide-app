import { NextRequest, NextResponse } from "next/server";
import { resolveNextPath } from "@/lib/auth/redirects";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/projects";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code =
    url.searchParams.get("code") ??
    url.searchParams.get("token") ??
    url.searchParams.get("token_hash");
  const next = resolveNextPath(url.searchParams.get("next") ?? DEFAULT_NEXT);

  // Build the login URL once to reuse it for errors
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("next", next);

  if (!code) {
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase exchangeCodeForSession error:", error);
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const { data: { session: debugSession } } = await supabase.auth.getSession();
  console.log("Auth Debug: Callback session check:", debugSession ? "Session found" : "No session");

  // Use a relative path or the origin from the request to ensure we stay on the same domain
  const redirectUrl = new URL(next, url.origin);

  // We MUST create a response and return it to ensure cookies are set
  const response = NextResponse.redirect(redirectUrl.toString());
  return response;
}
