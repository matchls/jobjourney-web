"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Columns2,
  Briefcase,
  TrendingUp,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { NewApplicationDialog } from "@/components/applications/new-application-dialog";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban", label: "Kanban", icon: Columns2 },
  { href: "/applications", label: "Candidatures", icon: Briefcase },
  { href: "/progression", label: "Progression", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="py-5 px-5 flex items-center gap-3">
        <Image
          src="/icon.png"
          alt="Job Journey"
          width={70}
          height={70}
          className="rounded-sm"
          unoptimized
        />
        <div>
          <p className="font-bold text-lg leading-none text-primary">
            Job Journey
          </p>
          <p className="text-xs text-sidebar-foreground/60 leading-none mt-1">
            Career Tracker
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <NewApplicationDialog
          trigger={
            <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={16} />
              New Application
            </button>
          }
        />
      </div>
    </aside>
  );
}
