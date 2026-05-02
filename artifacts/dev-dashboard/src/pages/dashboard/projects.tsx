import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Star, GitFork, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTS = [
  { value: "live", label: "Live" },
  { value: "in_progress", label: "In Progress" },
  { value: "open_source", label: "Open Source" },
  { value: "archived", label: "Archived" },
];

const STATUS_COLORS: Record<string, string> = {
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  in_progress: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  open_source: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

type ProjectForm = {
  name: string;
  description: string;
  techStack: string;
  status: string;
  githubRepo: string;
  demoUrl: string;
  isFeatured: boolean;
};

const EMPTY_FORM: ProjectForm = {
  name: "", description: "", techStack: "", status: "in_progress",
  githubRepo: "", demoUrl: "", isFeatured: false,
};

function ProjectModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ProjectForm & { id?: string };
  onSave: (data: ProjectForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProjectForm>(initial ?? EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  function set(key: keyof ProjectForm, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setLoading(true);
    try { await onSave(form); onClose(); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold font-mono">{initial?.id ? "Edit Project" : "New Project"}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Project name" className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Short description" className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tech Stack (comma-separated)</label>
            <input value={form.techStack} onChange={(e) => set("techStack", e.target.value)} placeholder="React, TypeScript, Node.js" className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
                {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="rounded" />
                <span className="text-sm">Featured</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">GitHub Repo (owner/repo)</label>
            <input value={form.githubRepo} onChange={(e) => set("githubRepo", e.target.value)} placeholder="username/my-project" className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Demo URL</label>
            <input value={form.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} placeholder="https://..." className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded border border-border text-sm hover:bg-card/50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || !form.name.trim()} className="flex-1 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { data: projects, isLoading } = useListProjects({});
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: updateProject } = useUpdateProject();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);

  async function handleSave(form: ProjectForm) {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      techStack: form.techStack ? form.techStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: form.status as any,
      githubRepo: form.githubRepo || undefined,
      demoUrl: form.demoUrl || undefined,
      isFeatured: form.isFeatured,
    };
    if (editProject?.id) {
      await updateProject({ id: editProject.id, data: payload });
    } else {
      await createProject({ data: payload });
    }
    await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    setEditProject(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    await deleteProject({ id });
    await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
  }

  return (
    <DashboardLayout>
      {(showModal || editProject) && (
        <ProjectModal
          initial={editProject ? {
            name: editProject.name ?? "",
            description: editProject.description ?? "",
            techStack: (editProject.techStack ?? []).join(", "),
            status: editProject.status ?? "in_progress",
            githubRepo: editProject.githubRepo ?? "",
            demoUrl: editProject.demoUrl ?? "",
            isFeatured: editProject.isFeatured ?? false,
            id: editProject.id,
          } : undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditProject(null); }}
        />
      )}
      <div className="space-y-4 max-w-5xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{projects?.length ?? 0} projects</span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
          >
            <Plus size={12} /> New Project
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground text-sm py-12">Loading...</div>
        ) : (projects ?? []).length === 0 ? (
          <div className="border border-border rounded-lg bg-card p-12 text-center text-muted-foreground text-sm">
            No projects yet. Add your first portfolio project.
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="divide-y divide-border/50">
              {(projects ?? []).map((project) => (
                <div key={project.id} className="px-5 py-4 flex items-start gap-4 hover:bg-card/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{project.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.archived}`}>
                        {STATUS_OPTS.find((s) => s.value === project.status)?.label ?? project.status}
                      </span>
                      {project.isFeatured && (
                        <span className="text-xs text-amber-400">featured</span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {(project.techStack ?? []).map((t) => (
                        <span key={t} className="text-xs text-muted-foreground font-mono">{t}</span>
                      ))}
                      {(project.stars ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Star size={10} />{project.stars}</span>
                      )}
                      {(project.forks ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><GitFork size={10} />{project.forks}</span>
                      )}
                      {project.language && (
                        <span className="text-xs text-muted-foreground font-mono">{project.language}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.demoUrl && (
                      <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button onClick={() => setEditProject(project)} className="text-muted-foreground hover:text-foreground">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
