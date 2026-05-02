<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { listAllGithubIssues } from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, cn } from "@/lib/utils";
import { MessageSquare, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-vue-next";

const STATE_OPTS = ["open", "closed", "all"] as const;
const FILTER_OPTS = [
  { value: "assigned", label: "Assigned" },
  { value: "created", label: "Created" },
  { value: "mentioned", label: "Mentioned" },
] as const;

const state = ref<"open" | "closed" | "all">("open");
const filter = ref<"assigned" | "created" | "mentioned">("assigned");
const search = ref("");

const { data: issues, isLoading } = useQuery({
  queryKey: computed(() => ["/api/github/issues/all", state.value, filter.value]),
  queryFn: () => listAllGithubIssues({ state: state.value, filter: filter.value }),
  staleTime: 30_000,
});

const filtered = computed(() => {
  if (!issues.value) return [];
  if (!search.value) return issues.value;
  const q = search.value.toLowerCase();
  return issues.value.filter(
    (i) => i.title.toLowerCase().includes(q) || (i.repoFullName ?? "").toLowerCase().includes(q),
  );
});

const grouped = computed(() => {
  return filtered.value.reduce<Record<string, typeof filtered.value>>((acc, issue) => {
    const repo = issue.repoFullName ?? "unknown";
    if (!acc[repo]) acc[repo] = [];
    acc[repo].push(issue);
    return acc;
  }, {});
});
</script>

<template>
  <DashboardLayout>
    <div class="space-y-5 max-w-5xl">
      <div class="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search issues..."
          v-model="search"
          class="bg-card border border-border rounded px-3 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-64"
        />
        <div class="flex rounded border border-border overflow-hidden">
          <button
            v-for="s in STATE_OPTS"
            :key="s"
            @click="state = s"
            :class="cn('px-3 py-1.5 text-xs font-mono transition-colors', state === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')"
          >
            {{ s }}
          </button>
        </div>
        <div class="flex rounded border border-border overflow-hidden">
          <button
            v-for="f in FILTER_OPTS"
            :key="f.value"
            @click="filter = f.value"
            :class="cn('px-3 py-1.5 text-xs font-mono transition-colors', filter === f.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')"
          >
            {{ f.label }}
          </button>
        </div>
        <span class="text-xs text-muted-foreground ml-auto">{{ filtered.length }} issues</span>
      </div>

      <div v-if="isLoading" class="text-muted-foreground text-sm py-12 text-center">Loading issues...</div>
      <div
        v-else-if="!filtered.length"
        class="text-muted-foreground text-sm py-12 text-center border border-border rounded-lg bg-card"
      >
        {{ !issues ? "Connect GitHub to view your issues." : "No issues found." }}
      </div>
      <div v-else class="space-y-6">
        <div
          v-for="(repoIssues, repo) in grouped"
          :key="repo"
          class="border border-border rounded-lg bg-card overflow-hidden"
        >
          <div class="px-4 py-2.5 border-b border-border bg-card/50 flex items-center justify-between">
            <span class="text-xs font-mono font-medium">{{ repo }}</span>
            <span class="text-xs text-muted-foreground">{{ repoIssues.length }}</span>
          </div>
          <div class="divide-y divide-border/50">
            <div
              v-for="issue in repoIssues"
              :key="issue.id"
              class="px-4 py-3 flex items-start gap-3 hover:bg-card/50 transition-colors"
            >
              <AlertCircle v-if="issue.state === 'open'" :size="14" class="text-emerald-400 mt-0.5 shrink-0" />
              <CheckCircle2 v-else :size="14" class="text-purple-400 mt-0.5 shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-start gap-2 flex-wrap">
                  <a :href="issue.url" target="_blank" rel="noreferrer" class="text-sm hover:text-primary transition-colors">
                    {{ issue.title }}
                  </a>
                  <span
                    v-for="label in issue.labels"
                    :key="label.name"
                    class="text-xs px-1.5 py-0.5 rounded-full font-mono"
                    :style="{ backgroundColor: `#${label.color}20`, color: `#${label.color}`, border: `1px solid #${label.color}40` }"
                  >
                    {{ label.name }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>#{{ issue.number }}</span>
                  <span v-if="issue.author">by {{ issue.author }}</span>
                  <span>{{ formatRelative(issue.updatedAt) }}</span>
                  <span v-if="(issue.commentsCount ?? 0) > 0" class="flex items-center gap-1">
                    <MessageSquare :size="10" />{{ issue.commentsCount }}
                  </span>
                </div>
              </div>
              <a :href="issue.url" target="_blank" rel="noreferrer" class="text-muted-foreground hover:text-foreground mt-0.5 shrink-0">
                <ExternalLink :size="12" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
