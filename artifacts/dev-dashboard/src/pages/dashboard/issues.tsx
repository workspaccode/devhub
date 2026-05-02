import { useListAllGithubIssues, useListGithubRepos } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative } from "@/lib/utils";
import { MessageSquare, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATE_OPTS = ["open", "closed", "all"] as const;
const FILTER_OPTS = [
  { value: "assigned", label: "Assigned" },
  { value: "created", label: "Created" },
  { value: "mentioned", label: "Mentioned" },
] as const;

export default function Issues() {
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [filter, setFilter] = useState<"assigned" | "created" | "mentioned">("assigned");
  const [search, setSearch] = useState("");

  const { data: issues, isLoading } = useListAllGithubIssues({ state, filter });

  const filtered = (issues ?? []).filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || (i.repoFullName ?? "").toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, issue) => {
    const repo = issue.repoFullName ?? "unknown";
    if (!acc[repo]) acc[repo] = [];
    acc[repo].push(issue);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border border-border rounded px-3 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-64"
          />
          <div className="flex rounded border border-border overflow-hidden">
            {STATE_OPTS.map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors",
                  state === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex rounded border border-border overflow-hidden">
            {FILTER_OPTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono transition-colors",
                  filter === f.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} issues</span>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground text-sm py-12 text-center">Loading issues...</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground text-sm py-12 text-center border border-border rounded-lg bg-card">
            {issues === undefined ? "Connect GitHub to view your issues." : "No issues found."}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([repo, repoIssues]) => (
              <div key={repo} className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-card/50 flex items-center justify-between">
                  <span className="text-xs font-mono font-medium">{repo}</span>
                  <span className="text-xs text-muted-foreground">{repoIssues.length}</span>
                </div>
                <div className="divide-y divide-border/50">
                  {repoIssues.map((issue) => (
                    <div key={issue.id} className="px-4 py-3 flex items-start gap-3 hover:bg-card/50 transition-colors">
                      {issue.state === "open" ? (
                        <AlertCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 size={14} className="text-purple-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm hover:text-primary transition-colors"
                          >
                            {issue.title}
                          </a>
                          {issue.labels?.map((label) => (
                            <span
                              key={label.name}
                              className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                              style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}`, border: `1px solid #${label.color}40` }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>#{issue.number}</span>
                          {issue.author && <span>by {issue.author}</span>}
                          <span>{formatRelative(issue.updatedAt)}</span>
                          {(issue.commentsCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare size={10} />{issue.commentsCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <a href={issue.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
