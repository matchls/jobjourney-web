export function formatFrenchDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// `input type="date"` expects YYYY-MM-DD and reads it as a plain calendar day,
// with no timezone attached. Formatting through toISOString() would yield the
// UTC day instead, which is not always the local one: on a positive offset the
// local clock runs ahead of UTC, so the early hours of a local day still belong
// to the previous UTC day; on a negative offset it runs behind, so the late
// hours of a local day already belong to the next UTC day. Either way the field
// would open on the wrong day. The local getters keep the day the user is
// actually living.
export function formatLocalDateForInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
