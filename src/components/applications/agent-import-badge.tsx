import { Bot, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAgentImport, needsImportReview } from "@/lib/agent-import";
import type { Application } from "@/types";

export function AgentSourceTag({
  application,
  className,
}: {
  application: Pick<Application, "creationSource">;
  className?: string;
}) {
  if (!isAgentImport(application)) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      <Bot size={11} className="shrink-0" />
      Import agent
    </span>
  );
}

export function ImportReviewBadge({
  application,
  className,
}: {
  application: Pick<Application, "creationSource" | "importReviewStatus">;
  className?: string;
}) {
  if (!needsImportReview(application)) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 bg-amber-50 text-amber-600 border border-amber-200",
        className,
      )}
    >
      <AlertCircle size={12} className="shrink-0" />
      À vérifier
    </span>
  );
}
