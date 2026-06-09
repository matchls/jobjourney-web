import { ApplicationCard } from "./application-card";
import type { Application } from "@/types";

type Props = {
  title: string;
  applications: Application[];
};

export function KanbanColumn({ title, applications }: Props) {
  return (
    <div className="flex flex-col gap-3 min-w-60 w-60">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {applications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
            Aucune candidature
          </p>
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))
        )}
      </div>
    </div>
  );
}
