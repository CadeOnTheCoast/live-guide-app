import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}
