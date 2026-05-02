import { useGetDashboardSummary, useListPlatforms, useListActivity, useSyncPlatform } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative, PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/utils";
import { PlatformIcon } from "@/components/PlatformIcon";
import { RefreshCw, GitBranch, AlertCircle, GitPullRequest, FolderOpen, Plug, Activity, Flame } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPlatformsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey } from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: platforms } = useListPlatforms();
  const { data: activity } = useListActivity({ limit: 20 });
  const { mutateAsync: syncPlatform } = useSyncPlatform();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);

  const stats = [
    { label: "Open Issues", value: summary?.openIssues ?? 0, icon: AlertCircle },
    { label: "Open PRs", value: summary?.openPullRequests ?? 0, icon: GitPullRequest },
    { label: "Projects", value: summary?.totalProjects ?? 0, icon: FolderOpen },
    { label: "Connected", value: summary?.connectedPlatforms ?? 0, icon: Plug },
    { label: "This Week", value: summary?.activityThisWeek ?? 0, icon: Activity },
    { label: "Streak", value: `${summary?.contributionStreak ?? 0}d`, icon: Flame },
  ];

  async function handleSync(platform: string) {
    setSyncing(platform);
    try {
      await syncPlatform({ platform: platform as any });
      await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
      await qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      await qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
    } finally {
      setSyncing(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={13} className="text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold font-mono">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="lg:col-span-2 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium font-mono">Activity Feed</span>
              <span className="text-xs text-muted-foreground">{activity?.length ?? 0} events</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[520px] overflow-y-auto">
              {(activity ?? []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No activity yet. Connect a platform and sync.
                </div>
              ) : (
                (activity ?? []).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-card/50 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      <PlatformIcon platform={item.platform} size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                            {item.title}
                          </a>
                        ) : item.title}
                      </p>
                      {item.repoName && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.repoName}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{formatRelative(item.activityAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Platform status */}
          <div className="border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-medium font-mono">Platforms</span>
            </div>
            <div className="divide-y divide-border/50">
              {(platforms ?? []).map((p) => (
                <div key={p.platform} className="px-4 py-3 flex items-center gap-3">
                  <PlatformIcon platform={p.platform} size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    </div>
                    {p.isConnected && p.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground">{formatRelative(p.lastSyncedAt)}</p>
                    )}
                    {!p.isConnected && (
                      <p className="text-xs text-muted-foreground">Not connected</p>
                    )}
                  </div>
                  {p.isConnected && (
                    <button
                      onClick={() => handleSync(p.platform)}
                      disabled={syncing === p.platform}
                      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={syncing === p.platform ? "animate-spin" : ""} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
