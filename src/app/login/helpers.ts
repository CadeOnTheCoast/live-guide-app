import { resolveNextPath } from "@/lib/auth/redirects";

export function buildEmailRedirectTo(next?: string | null, origin?: string) {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const safeNext = resolveNextPath(next);
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
