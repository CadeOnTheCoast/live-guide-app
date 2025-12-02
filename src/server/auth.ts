import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/server/auth-domain";
import { getPersonByEmail } from "@/server/current-user";

export async function getUserOrRedirect() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const email = user.email;

  if (!email || !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  const person = email ? await getPersonByEmail(email) : null;

  return { user, person, supabase };
}
