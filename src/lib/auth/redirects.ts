function normalizeAbsoluteNext(next: string) {
  try {
    const url = new URL(next);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/projects";
  }
}

export function resolveNextPath(next?: string | null) {
  if (!next) return "/projects";

  if (next.startsWith("http://") || next.startsWith("https://")) {
    return normalizeAbsoluteNext(next);
  }

  if (!next.startsWith("/")) return "/projects";

  return next;
}
