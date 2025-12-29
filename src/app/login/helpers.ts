export function buildEmailRedirectTo(next: string, origin?: string) {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const safeNext = next || "/projects";
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}