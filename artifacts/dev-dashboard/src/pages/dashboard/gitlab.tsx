import { useListGitlabProjects, useListGitlabMergeRequests, useGetGitlabActivity } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative } from "@/lib/utils";
import { ExternalLink, GitMerge, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MR_STATES = ["opened", "closed", "merged"] as const;

export default function GitLabPage() {
  const { data: projects, isLoading } = useListGitlabProjects({});
  const [mrState, setMrState] = useState<"opened" | "closed" | "merged">("opened");
  const { data: mrs } = useListGitlabMergeRequests({ state: mrState, scope: "assigned_to_me" as any });
  const { data: activity } = useGetGitlabActivity();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Projects */}
          <div className="lg:col-span-2 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-mono font-medium">Projects</span>
              <span className="text-xs text-muted-foreground">{projects?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
              ) : (projects ?? []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Connect GitLab to see your projects.</div>
              ) : (
                (projects ?? []).map((p) => (
                  <div key={p.id} className="px-4 py-3 hover:bg-card/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <a href={p.webUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-primary transition-colors truncate">
                        {p.name}
                      </a>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        {(p.stars ?? 0) > 0 && <span className="flex items-center gap-0.5"><Star size={10} />{p.stars}</span>}
                        <span className="px-1.5 py-0.5 rounded text-xs bg-card border border-border">{p.visibility}</span>
                      </div>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                    {p.lastActivityAt && (
                      <p className="text-xs text-muted-foreground mt-1">{formatRelative(p.lastActivityAt)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Merge Requests */}
          <div className="border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-medium">Merge Requests</span>
              </div>
              <div className="flex rounded border border-border overflow-hidden">
                {MR_STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setMrState(s)}
                    className={cn(
                      "flex-1 px-2 py-1 text-xs font-mono transition-colors",
                      mrState === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
              {(mrs ?? []).length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">No merge requests</div>
              ) : (
                (mrs ?? []).map((mr) => (
                  <div key={mr.id} className="px-4 py-2.5 hover:bg-card/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <GitMerge size={12} className="text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <a href={mr.webUrl} target="_blank" rel="noreferrer" className="text-xs hover:text-primary transition-colors line-clamp-2">
                          {mr.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-0.5">{mr.projectName} · {formatRelative(mr.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{mr.sourceBranch} → {mr.targetBranch}</p>
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
