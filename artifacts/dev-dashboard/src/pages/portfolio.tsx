import { useGetProfile, useListProjects, useGetRecentActivity, useListPlatforms } from "@workspace/api-client-react";
import { formatRelative, PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/utils";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Link } from "wouter";
import { ExternalLink, MapPin, Building2, Github, Star, GitFork, Zap } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  in_progress: "In Progress",
  open_source: "Open Source",
  archived: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  in_progress: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  open_source: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

export default function Portfolio() {
  const { data: profile } = useGetProfile();
  const { data: projects } = useListProjects({ featured: true });
  const { data: recentActivity } = useGetRecentActivity();
  const { data: platforms } = useListPlatforms();

  const connectedPlatforms = (platforms ?? []).filter((p) => p.isConnected);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold text-sm">&gt;_</span>
          <span className="text-sm font-semibold">{profile?.username ?? "devhub"}</span>
        </div>
        <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border hover:border-primary/40 transition-colors">
          Dashboard →
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Hero */}
        <section className="space-y-6">
          <div className="flex items-start gap-4">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-16 h-16 rounded-full border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full border border-border bg-card flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {(profile?.fullName ?? "?")[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile?.fullName ?? "Developer"}</h1>
              <p className="text-muted-foreground mt-1">{profile?.title ?? "Software Engineer"}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {profile?.location && (
                  <span className="flex items-center gap-1"><MapPin size={11} />{profile.location}</span>
                )}
                {profile?.currentCompany && (
                  <span className="flex items-center gap-1"><Building2 size={11} />{profile.currentCompany}</span>
                )}
                {profile?.workStatus && (
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${
                    profile.workStatus === "open"
                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                      : "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
                  }`}>
                    {profile.workStatus === "open" ? "Open to work" : profile.workStatus === "freelance" ? "Freelance" : "Employed"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-muted-foreground leading-relaxed max-w-2xl">{profile.bio}</p>
          )}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="text-xs px-2 py-1 rounded border border-border bg-card text-muted-foreground font-mono">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Connected platforms */}
          {connectedPlatforms.length > 0 && (
            <div className="flex items-center gap-3">
              {connectedPlatforms.map((p) => (
                <div key={p.platform} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <PlatformIcon platform={p.platform} size={14} />
                  <span>{p.username}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Projects */}
        {projects && projects.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              // featured_projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="border border-border rounded-lg p-5 bg-card hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{project.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.archived}`}>
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                      {project.demoUrl && (
                        <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {(project.techStack ?? []).slice(0, 4).map((tech) => (
                        <span key={tech} className="text-xs text-muted-foreground font-mono">{tech}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {(project.stars ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><Star size={10} />{project.stars}</span>
                      )}
                      {(project.forks ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><GitFork size={10} />{project.forks}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              // recent_activity
            </h2>
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{item.repoName}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{formatRelative(item.activityAt)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
            // contact
          </h2>
          <div className="flex items-center gap-4">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Zap size={13} /> {profile.email}
              </a>
            )}
            {profile?.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <ExternalLink size={13} /> Website
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
