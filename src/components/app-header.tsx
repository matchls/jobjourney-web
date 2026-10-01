"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, HelpCircle, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";

// The global search bar is an entry point, not a second filtering engine: it
// hands the typed term to the applications list through the `q` search param,
// which stays the single source of truth for the term. Submitting on Enter
// rather than navigating on every keystroke keeps one history entry per search.
function GlobalSearch() {
  const searchParams = useSearchParams();
  const appliedTerm = searchParams.get("q") ?? "";

  // Remounting the form whenever the applied term changes resets the field to
  // what is actually filtering the results — after a reset from the list, or
  // when leaving for a tab that carries no search. This is how React itself
  // recommends resetting state on a prop change, and it spares a
  // synchronising effect.
  return <GlobalSearchForm key={appliedTerm} appliedTerm={appliedTerm} />;
}

function GlobalSearchForm({ appliedTerm }: { appliedTerm: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(appliedTerm);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();
    router.push(
      trimmed
        ? `/applications?q=${encodeURIComponent(trimmed)}`
        : "/applications",
    );
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 w-64"
    >
      <Search size={14} className="text-muted-foreground" />
      <input
        type="text"
        aria-label="Rechercher une candidature"
        placeholder="Rechercher une entreprise..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
      />
    </form>
  );
}

export function AppHeader() {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0].toUpperCase() ?? "?");

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background">
      {/* useSearchParams opts its subtree out of static rendering, so it is
          isolated behind its own boundary, as on the login page. */}
      <Suspense fallback={<div className="w-64" />}>
        <GlobalSearch />
      </Suspense>

      <div className="flex items-center gap-3">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent">
          <Bell size={18} />
        </button>
        <Link
          href="/help-center"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
        >
          <HelpCircle size={18} />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
