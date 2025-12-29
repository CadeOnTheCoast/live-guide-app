import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveNextPath } from "@/lib/auth/redirects";

export function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const path = request.nextUrl.pathname;

  if (code && path !== "/auth/callback") {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const fallbackNext = path === "/" ? "/projects" : path;
    const next = resolveNextPath(requestedNext ?? fallbackNext);

    const redirectUrl = new URL("/auth/callback", request.nextUrl.origin);
    redirectUrl.searchParams.set("code", code);
    redirectUrl.searchParams.set("next", next);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
