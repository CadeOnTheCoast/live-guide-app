import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/server/auth-domain";
import { getPersonByEmail } from "@/server/current-user";

export async function getUserOrRedirect(nextPath?: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  const desiredNext = nextPath ?? headers().get("x-pathname") ?? undefined;

  if (!user) {
    redirect(buildLoginRedirect(desiredNext));
  }

  const email = user.email;

  if (!email || !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    redirect(buildLoginRedirect(desiredNext, "unauthorized"));
  }

  const person = email ? await getPersonByEmail(email) : null;

  return { user, person, supabase };
}

function buildLoginRedirect(nextPath?: string, error?: string) {
  const params = new URLSearchParams();

  if (nextPath) {
    params.set("next", nextPath);
  }

  if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
