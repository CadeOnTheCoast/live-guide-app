import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/projects";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? DEFAULT_NEXT;

  if (!code) {
    const loginUrl = buildLoginUrl(requestUrl, next, "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = buildLoginUrl(requestUrl, next, "auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = new URL(next, requestUrl.origin);
  return NextResponse.redirect(redirectUrl.toString());
}

function buildLoginUrl(currentUrl: URL, next: string, error?: string) {
  const loginUrl = new URL("/login", currentUrl.origin);
  if (next) {
    loginUrl.searchParams.set("next", next);
  }
  if (error) {
    loginUrl.searchParams.set("error", error);
  }
  return loginUrl.toString();
}
