import { Plus } from "lucide-react";
import { ApplicationCard } from "./application-card";
import type { Application } from "@/types";

type Props = {
  title: string;
  applications: Application[];
};

export function KanbanColumn({ title, applications }: Props) {
  return (
    <div className="flex flex-col gap-3 min-w-65 w-65">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {applications.length}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-accent">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {applications.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-10 border border-dashed border-border rounded-xl">
            Aucune candidature
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))
        )}
      </div>
    </div>
  );
}
