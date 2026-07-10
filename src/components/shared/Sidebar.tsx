import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Kanban, Mail, Briefcase, BarChart3, Settings, Zap, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/outreach", label: "Outreach", icon: Mail },
  { to: "/clients", label: "Clients", icon: Briefcase },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-text-secondary hover:bg-white/5 hover:text-text-primary",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400" />
            )}
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex items-center gap-2.5 px-6 py-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
        <Zap className="h-4.5 w-4.5 text-white" fill="currentColor" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-text-primary">PROXIM</div>
        <div className="text-[10px] uppercase tracking-widest text-text-muted">Ops Console</div>
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-white/5 p-3">
      <button
        onClick={() => supabase.auth.signOut()}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/5 bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-sm font-bold tracking-tight">PROXIM</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-2 text-text-secondary hover:bg-white/5 cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 flex h-full w-60 flex-col bg-surface pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-surface md:flex">
        {header}
        {nav}
        {footer}
      </aside>
    </>
  );
}
