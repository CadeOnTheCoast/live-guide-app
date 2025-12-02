export function isAllowedEmail(email: string, allowedDomainsEnv = process.env.ALLOWED_EMAIL_DOMAINS): boolean {
  if (!allowedDomainsEnv) return false;
  const domains = allowedDomainsEnv
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const domain = email.split("@")[1]?.toLowerCase();
  return domain !== undefined && domains.includes(domain);
}
