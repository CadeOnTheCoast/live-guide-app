export function buildEmailRedirectTo(next: string, origin?: string) {
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000").replace(/\/$/, "");
  const safeNext = next || "/projects";
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}