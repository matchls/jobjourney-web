"use client";

import Link from "next/link";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
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
    <header className="h-14 border-b border-border flex items-center justify-between gap-3 px-4 md:px-6 shrink-0 bg-background">
      <button
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground md:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 w-full max-w-64 min-w-0">
        <Search size={14} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-1 md:gap-3 shrink-0">
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
