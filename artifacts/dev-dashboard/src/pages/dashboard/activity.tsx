import { useListActivity } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative, PLATFORM_LABELS } from "@/lib/utils";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PLATFORM_TABS = [
  { value: "all", label: "All" },
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "bitbucket", label: "Bitbucket" },
  { value: "slack", label: "Slack" },
] as const;

export default function ActivityPage() {
  const [platform, setPlatform] = useState<string>("all");

  const { data: activity, isLoading } = useListActivity({ platform: platform as any, limit: 100 });

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl">
        {/* Platform tabs */}
        <div className="flex gap-1 border-b border-border">
          {PLATFORM_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPlatform(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors border-b-2 -mb-px",
                platform === tab.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.value !== "all" && <PlatformIcon platform={tab.value} size={12} />}
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center pr-1">{activity?.length ?? 0} events</span>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-12">Loading activity...</div>
        ) : (activity ?? []).length === 0 ? (
          <div className="border border-border rounded-lg bg-card p-12 text-center text-muted-foreground text-sm">
            No activity. Connect a platform and sync.
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card divide-y divide-border/50 overflow-hidden">
            {(activity ?? []).map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-card/50 transition-colors group">
                <div className="mt-0.5 shrink-0">
                  <PlatformIcon platform={item.platform} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        {item.title}
                      </a>
                    ) : item.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{PLATFORM_LABELS[item.platform] ?? item.platform}</span>
                    {item.repoName && <span>{item.repoName}</span>}
                    <span>{formatRelative(item.activityAt)}</span>
                  </div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
