"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ApplicationCard } from "./application-card";
import type { Application, ApplicationStatus } from "@/types";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";
import { useUpdateApplication } from "@/hooks/use-update-application";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  status: ApplicationStatus;
  applications: Application[];
};

export function KanbanColumn({ title, status, applications }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { mutate: updateApplication, error } = useUpdateApplication();

  return (
    <div
      className="flex flex-col gap-3 min-w-65 w-65"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const id = e.dataTransfer.getData("application/id");
        const fromStatus = e.dataTransfer.getData("application/status");
        if (!id || fromStatus === status) return;
        updateApplication({ id, status });
      }}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {applications.length}
          </span>
        </div>
        <NewApplicationDialog
          defaultStatus={status}
          trigger={
            <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-accent">
              <Plus size={14} />
            </button>
          }
        />
      </div>
      {error && <p className="text-xs text-destructive px-1">{error.message}</p>}
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl transition-colors min-h-16",
          isDragOver && "bg-primary/5 outline-dashed outline-2 outline-primary/30",
        )}
      >
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
