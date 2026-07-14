export function formatFrenchDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
