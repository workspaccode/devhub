import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const PLATFORM_COLORS: Record<string, string> = {
  github: "#e6edf3",
  gitlab: "#FC6D26",
  bitbucket: "#0052CC",
  slack: "#4A154B",
  zoho: "#E42527",
};

export const PLATFORM_BG: Record<string, string> = {
  github: "rgba(230,237,243,0.08)",
  gitlab: "rgba(252,109,38,0.10)",
  bitbucket: "rgba(0,82,204,0.10)",
  slack: "rgba(74,21,75,0.20)",
  zoho: "rgba(228,37,39,0.10)",
};

export const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  slack: "Slack",
  zoho: "Zoho Mail",
};
