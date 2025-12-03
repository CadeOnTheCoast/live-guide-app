export function formatDate(value: Date | string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
