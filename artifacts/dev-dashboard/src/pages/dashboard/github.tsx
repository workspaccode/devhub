import {
  useListGithubRepos,
  useGetGithubActivity,
  useGetGithubContributions,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative } from "@/lib/utils";
import { Star, GitFork, AlertCircle, ExternalLink, Lock } from "lucide-react";

function ContributionHeatmap({ data }: { data: { weeks: Array<{ days: Array<{ date: string; count: number; level: number }> }> } }) {
  const levels = [
    "bg-zinc-800",
    "bg-emerald-900",
    "bg-emerald-700",
    "bg-emerald-500",
    "bg-emerald-400",
  ];
  const weeks = data.weeks.slice(-52);
  const days = ["Mon", "Wed", "Fri"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.days.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${levels[day.level ?? 0]} cursor-default transition-opacity hover:opacity-70`}
                title={`${day.date}: ${day.count} contributions`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GitHubPage() {
  const { data: repos, isLoading: reposLoading } = useListGithubRepos({});
  const { data: activity } = useGetGithubActivity({});
  const { data: contributions } = useGetGithubContributions();

  const sortedRepos = [...(repos ?? [])].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Contributions heatmap */}
        {contributions && contributions.weeks.length > 0 && (
          <div className="border border-border rounded-lg bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono font-medium">Contributions</h2>
              <span className="text-xs text-muted-foreground">{contributions.totalContributions} total</span>
            </div>
            <ContributionHeatmap data={contributions} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Repos */}
          <div className="lg:col-span-2 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-mono font-medium">Repositories</span>
              <span className="text-xs text-muted-foreground">{repos?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
              {reposLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading repos...</div>
              ) : sortedRepos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Connect GitHub to see your repositories.</div>
              ) : (
                sortedRepos.map((repo) => (
                  <div key={repo.id} className="px-4 py-3 hover:bg-card/50 transition-colors">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {repo.private && <Lock size={11} className="text-amber-400 shrink-0" />}
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors truncate"
                        >
                          {repo.name}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        {(repo.stars ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5"><Star size={10} />{repo.stars}</span>
                        )}
                        {(repo.forks ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5"><GitFork size={10} />{repo.forks}</span>
                        )}
                        {(repo.openIssuesCount ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-400">
                            <AlertCircle size={10} />{repo.openIssuesCount}
                          </span>
                        )}
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {repo.language && <span className="font-mono">{repo.language}</span>}
                      {repo.pushedAt && <span>{formatRelative(repo.pushedAt)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-mono font-medium">Recent Events</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
              {(activity ?? []).length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">No events yet</div>
              ) : (
                (activity ?? []).map((item) => (
                  <div key={item.id} className="px-4 py-2.5 hover:bg-card/50 transition-colors">
                    <p className="text-xs truncate">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-primary">
                          {item.title}
                        </a>
                      ) : item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span className="font-mono">{(item.type ?? "").replace(/Event$/, "")}</span>
                      <span>·</span>
                      <span>{formatRelative(item.activityAt)}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
