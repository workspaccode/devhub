<script setup lang="ts">
import { ref } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  listProjects,
  getListProjectsQueryKey,
  createProject,
  updateProject,
  deleteProject,
} from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Star, GitFork, ExternalLink } from "lucide-vue-next";

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

const qc = useQueryClient();
const showModal = ref(false);
const editProject = ref<any>(null);
const form = ref<ProjectForm>({ ...EMPTY_FORM });
const formLoading = ref(false);

const { data: projects, isLoading } = useQuery({
  queryKey: getListProjectsQueryKey({}),
  queryFn: () => listProjects({}),
});

function openNew() {
  form.value = { ...EMPTY_FORM };
  editProject.value = null;
  showModal.value = true;
}

function openEdit(project: any) {
  editProject.value = project;
  form.value = {
    name: project.name ?? "",
    description: project.description ?? "",
    techStack: (project.techStack ?? []).join(", "),
    status: project.status ?? "in_progress",
    githubRepo: project.githubRepo ?? "",
    demoUrl: project.demoUrl ?? "",
    isFeatured: project.isFeatured ?? false,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editProject.value = null;
}

async function handleSave() {
  if (!form.value.name.trim()) return;
  formLoading.value = true;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      techStack: form.value.techStack ? form.value.techStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      status: form.value.status as any,
      githubRepo: form.value.githubRepo || undefined,
      demoUrl: form.value.demoUrl || undefined,
      isFeatured: form.value.isFeatured,
    };
    if (editProject.value?.id) {
      await updateProject(editProject.value.id, payload);
    } else {
      await createProject(payload);
    }
    await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    closeModal();
  } finally {
    formLoading.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm("Delete this project?")) return;
  await deleteProject(id);
  await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
}
</script>

<template>
  <DashboardLayout>
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click="closeModal">
        <div class="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl space-y-4" @click.stop>
          <h2 class="text-base font-semibold font-mono">{{ editProject?.id ? "Edit Project" : "New Project" }}</h2>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Name *</label>
              <input v-model="form.name" placeholder="Project name" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Description</label>
              <textarea v-model="form.description" rows="2" placeholder="Short description" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Tech Stack (comma-separated)</label>
              <input v-model="form.techStack" placeholder="React, TypeScript, Node.js" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-muted-foreground block mb-1">Status</label>
                <select v-model="form.status" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
                  <option v-for="o in STATUS_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="flex items-end">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.isFeatured" class="rounded" />
                  <span class="text-sm">Featured</span>
                </label>
              </div>
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1">GitHub Repo (owner/repo)</label>
              <input v-model="form.githubRepo" placeholder="username/my-project" class="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Demo URL</label>
              <input v-model="form.demoUrl" placeholder="https://..." class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            <button @click="closeModal" class="flex-1 px-4 py-2 rounded border border-border text-sm hover:bg-card/50 transition-colors">Cancel</button>
            <button
              @click="handleSave"
              :disabled="formLoading || !form.name.trim()"
              class="flex-1 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ formLoading ? "Saving..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="space-y-4 max-w-5xl">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">{{ projects?.length ?? 0 }} projects</span>
        <button
          @click="openNew"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
        >
          <Plus :size="12" /> New Project
        </button>
      </div>

      <div v-if="isLoading" class="text-center text-muted-foreground text-sm py-12">Loading...</div>
      <div v-else-if="!projects?.length" class="border border-border rounded-lg bg-card p-12 text-center text-muted-foreground text-sm">
        No projects yet. Add your first portfolio project.
      </div>
      <div v-else class="border border-border rounded-lg bg-card overflow-hidden">
        <div class="divide-y divide-border/50">
          <div
            v-for="project in projects"
            :key="project.id"
            class="px-5 py-4 flex items-start gap-4 hover:bg-card/50 transition-colors group"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-medium text-sm">{{ project.name }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full border" :class="STATUS_COLORS[project.status] ?? STATUS_COLORS.archived">
                  {{ STATUS_OPTS.find((s) => s.value === project.status)?.label ?? project.status }}
                </span>
                <span v-if="project.isFeatured" class="text-xs text-amber-400">featured</span>
              </div>
              <p v-if="project.description" class="text-xs text-muted-foreground mb-2 leading-relaxed">{{ project.description }}</p>
              <div class="flex items-center gap-3 flex-wrap">
                <span v-for="t in (project.techStack ?? [])" :key="t" class="text-xs text-muted-foreground font-mono">{{ t }}</span>
                <span v-if="(project.stars ?? 0) > 0" class="flex items-center gap-0.5 text-xs text-muted-foreground"><Star :size="10" />{{ project.stars }}</span>
                <span v-if="(project.forks ?? 0) > 0" class="flex items-center gap-0.5 text-xs text-muted-foreground"><GitFork :size="10" />{{ project.forks }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <a v-if="project.demoUrl" :href="project.demoUrl" target="_blank" rel="noreferrer" class="text-muted-foreground hover:text-foreground">
                <ExternalLink :size="13" />
              </a>
              <button @click="openEdit(project)" class="text-muted-foreground hover:text-foreground">
                <Pencil :size="13" />
              </button>
              <button @click="handleDelete(project.id)" class="text-muted-foreground hover:text-destructive">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
