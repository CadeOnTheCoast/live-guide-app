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

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase exchangeCodeForSession error:", error);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = new URL(next, url.origin);
  return NextResponse.redirect(redirectUrl.toString());
}
