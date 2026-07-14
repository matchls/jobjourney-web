import type { Application, ApplicationStatus } from "@/types";

const STALE_THRESHOLD_DAYS: Partial<Record<ApplicationStatus, number>> = {
  TARGETED: 14,
  APPLIED: 21,
  INTERVIEWING: 30,
};

function daysSince(dateString: string): number {
  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatRelativeTime(dateString: string): string {
  const days = daysSince(dateString);

  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }

  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export function getColumnEntryDate(
  application: Pick<Application, "statusChangedAt" | "appliedAt" | "createdAt">,
): string {
  return (
    application.statusChangedAt ?? application.appliedAt ?? application.createdAt
  );
}

export function isStale(status: ApplicationStatus, dateString: string): boolean {
  const threshold = STALE_THRESHOLD_DAYS[status];
  if (!threshold) return false;
  return daysSince(dateString) > threshold;
}
