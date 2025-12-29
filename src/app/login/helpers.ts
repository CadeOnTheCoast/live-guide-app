import { resolveNextPath } from "@/lib/auth/redirects";

export function buildEmailRedirectTo(next?: string | null, origin?: string) {
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000").replace(/\/$/, "");
  const safeNext = resolveNextPath(next);
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
