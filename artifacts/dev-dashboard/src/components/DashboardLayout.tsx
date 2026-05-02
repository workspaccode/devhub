import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./PlatformIcon";
import {
  LayoutDashboard, GitBranch, Activity, BookOpen, Settings,
  Plug, User, ChevronLeft, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/issues", label: "Issues", icon: BookOpen },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/github", label: "GitHub", icon: null, platform: "github" },
  { href: "/dashboard/gitlab", label: "GitLab", icon: null, platform: "gitlab" },
  { href: "/dashboard/bitbucket", label: "Bitbucket", icon: null, platform: "bitbucket" },
  { href: "/dashboard/slack", label: "Slack", icon: null, platform: "slack" },
  { href: "/dashboard/projects", label: "Projects", icon: GitBranch },
  { href: "/dashboard/connections", label: "Connections", icon: Plug },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary font-mono">&gt;_</span>
          </div>
          <span className="font-semibold text-sm font-mono tracking-tight">DevHub</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors mb-2">
            <ChevronLeft size={12} />
            <span>Public Portfolio</span>
          </Link>

          <div className="h-px bg-sidebar-border my-2" />

          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                )}
              >
                {item.platform ? (
                  <PlatformIcon platform={item.platform} size={14} />
                ) : item.icon ? (
                  <item.icon size={14} />
                ) : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground font-mono">dashboard v1</div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 sticky top-0 bg-background/80 backdrop-blur z-30">
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm text-muted-foreground font-mono">
            {navItems.find(n => n.href === location || (n.href !== "/dashboard" && location.startsWith(n.href)))?.label ?? "Dashboard"}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
