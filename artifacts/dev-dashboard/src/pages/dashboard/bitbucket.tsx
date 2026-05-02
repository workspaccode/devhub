import { useListBitbucketRepos, useListBitbucketPullRequests } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative } from "@/lib/utils";
import { ExternalLink, GitPullRequest, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PR_STATES = ["OPEN", "MERGED", "DECLINED"] as const;

export default function BitbucketPage() {
  const { data: repos, isLoading } = useListBitbucketRepos();
  const [prState, setPrState] = useState<"OPEN" | "MERGED" | "DECLINED">("OPEN");
  const { data: prs } = useListBitbucketPullRequests({ state: prState });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Repos */}
          <div className="lg:col-span-2 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-mono font-medium">Repositories</span>
              <span className="text-xs text-muted-foreground">{repos?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
              ) : (repos ?? []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Connect Bitbucket to see your repos.</div>
              ) : (
                (repos ?? []).map((r) => (
                  <div key={r.uuid} className="px-4 py-3 hover:bg-card/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {r.isPrivate && <Lock size={11} className="text-amber-400 shrink-0" />}
                        <a href={r.webUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-primary transition-colors truncate">
                          {r.name}
                        </a>
                      </div>
                      {r.language && <span className="text-xs text-muted-foreground font-mono shrink-0">{r.language}</span>}
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>}
                    {r.updatedOn && <p className="text-xs text-muted-foreground mt-1">{formatRelative(r.updatedOn)}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pull Requests */}
          <div className="border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-medium">Pull Requests</span>
              </div>
              <div className="flex rounded border border-border overflow-hidden">
                {PR_STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrState(s)}
                    className={cn(
                      "flex-1 px-2 py-1 text-xs font-mono transition-colors",
                      prState === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
              {(prs ?? []).length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">No pull requests</div>
              ) : (
                (prs ?? []).map((pr) => (
                  <div key={pr.id} className="px-4 py-2.5 hover:bg-card/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <GitPullRequest size={12} className="text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <a href={pr.webUrl} target="_blank" rel="noreferrer" className="text-xs hover:text-primary transition-colors line-clamp-2">
                          {pr.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-0.5">{pr.repoFullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{pr.sourceBranch} → {pr.destinationBranch}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(pr.updatedOn)}</p>
                      </div>
                    </div>
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
