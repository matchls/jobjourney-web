import Link from "next/link";
import type { Application } from "@/types";

type Props = {
  application: Application;
};

export function ApplicationCard({ application }: Props) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className="block p-3 bg-card border border-border rounded-lg hover:border-ring transition-colors"
    >
      <p className="font-medium text-sm truncate">{application.company}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {application.position}
      </p>
      {application.appliedAt && (
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(application.appliedAt).toLocaleDateString("fr-FR")}
        </p>
      )}
    </Link>
  );
}
