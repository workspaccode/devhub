<script setup lang="ts">
import { ref, watch } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  getProfile,
  getGetProfileQueryKey,
  updateProfile,
} from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { Save } from "lucide-vue-next";

const WORK_STATUS_OPTS = [
  { value: "employed", label: "Employed" },
  { value: "freelance", label: "Freelance" },
  { value: "open", label: "Open to Work" },
];

const qc = useQueryClient();
const loading = ref(false);
const saved = ref(false);

const form = ref({
  fullName: "",
  title: "",
  bio: "",
  location: "",
  currentCompany: "",
  currentRole: "",
  workStatus: "employed",
  skills: "",
  email: "",
  websiteUrl: "",
  avatarUrl: "",
});

const { data: profile } = useQuery({
  queryKey: getGetProfileQueryKey(),
  queryFn: () => getProfile(),
});

watch(
  profile,
  (p) => {
    if (p) {
      form.value = {
        fullName: p.fullName ?? "",
        title: p.title ?? "",
        bio: p.bio ?? "",
        location: p.location ?? "",
        currentCompany: p.currentCompany ?? "",
        currentRole: p.currentRole ?? "",
        workStatus: p.workStatus ?? "employed",
        skills: (p.skills ?? []).join(", "),
        email: p.email ?? "",
        websiteUrl: p.websiteUrl ?? "",
        avatarUrl: p.avatarUrl ?? "",
      };
    }
  },
  { immediate: true },
);

async function handleSave() {
  loading.value = true;
  try {
    await updateProfile({
      fullName: form.value.fullName || undefined,
      title: form.value.title || undefined,
      bio: form.value.bio || undefined,
      location: form.value.location || undefined,
      currentCompany: form.value.currentCompany || undefined,
      currentRole: form.value.currentRole || undefined,
      workStatus: form.value.workStatus as any,
      skills: form.value.skills
        ? form.value.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      email: form.value.email || undefined,
      websiteUrl: form.value.websiteUrl || undefined,
      avatarUrl: form.value.avatarUrl || undefined,
    });
    await qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="max-w-2xl space-y-6">
      <div class="border border-border rounded-xl bg-card p-6 space-y-4">
        <h2 class="text-sm font-mono font-medium">Personal Info</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Full Name</label>
            <input v-model="form.fullName" placeholder="Your Name" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Title</label>
            <input v-model="form.title" placeholder="Senior Software Engineer" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Work Status</label>
            <select v-model="form.workStatus" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
              <option v-for="o in WORK_STATUS_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">Bio</label>
          <textarea v-model="form.bio" rows="3" placeholder="A short bio about yourself..." class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none" />
        </div>
      </div>

      <div class="border border-border rounded-xl bg-card p-6 space-y-4">
        <h2 class="text-sm font-mono font-medium">Work</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Current Company</label>
            <input v-model="form.currentCompany" placeholder="Company Name" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Current Role</label>
            <input v-model="form.currentRole" placeholder="Senior Developer" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label class="text-xs text-muted-foreground block mb-1">Location</label>
            <input v-model="form.location" placeholder="Remote" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>
      </div>

      <div class="border border-border rounded-xl bg-card p-6 space-y-4">
        <h2 class="text-sm font-mono font-medium">Links & Skills</h2>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">Email</label>
          <input v-model="form.email" type="email" placeholder="you@company.com" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">Website URL</label>
          <input v-model="form.websiteUrl" placeholder="https://yoursite.dev" class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">Avatar URL</label>
          <input v-model="form.avatarUrl" placeholder="https://..." class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label class="text-xs text-muted-foreground block mb-1">Skills (comma-separated)</label>
          <input v-model="form.skills" placeholder="TypeScript, Vue, Node.js, Go..." class="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
      </div>

      <button
        @click="handleSave"
        :disabled="loading"
        class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        <Save :size="14" />
        {{ saved ? "Saved!" : loading ? "Saving..." : "Save Profile" }}
      </button>
    </div>
  </DashboardLayout>
</template>
