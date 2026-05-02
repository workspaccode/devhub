<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { listGitlabProjects, listGitlabMergeRequests, getGitlabActivity } from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, cn } from "@/lib/utils";
import { GitMerge, Star } from "lucide-vue-next";

const MR_STATES = ["opened", "closed", "merged"] as const;
const mrState = ref<"opened" | "closed" | "merged">("opened");

const { data: projects, isLoading } = useQuery({
  queryKey: ["/api/gitlab/projects"],
  queryFn: () => listGitlabProjects({}),
});
const { data: mrs } = useQuery({
  queryKey: computed(() => ["/api/gitlab/mrs", mrState.value]),
  queryFn: () => listGitlabMergeRequests({ state: mrState.value, scope: "assigned_to_me" as any }),
  staleTime: 30_000,
});
const { data: activity } = useQuery({
  queryKey: ["/api/gitlab/activity"],
  queryFn: () => getGitlabActivity(),
});
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 max-w-5xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <span class="text-sm font-mono font-medium">Projects</span>
            <span class="text-xs text-muted-foreground">{{ projects?.length ?? 0 }}</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-if="isLoading" class="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            <div v-else-if="!projects?.length" class="p-8 text-center text-muted-foreground text-sm">
              Connect GitLab to see your projects.
            </div>
            <div v-else v-for="p in projects" :key="p.id" class="px-4 py-3 hover:bg-card/50 transition-colors">
              <div class="flex items-center justify-between gap-2">
                <a :href="p.webUrl" target="_blank" rel="noreferrer" class="text-sm font-medium hover:text-primary transition-colors truncate">
                  {{ p.name }}
                </a>
                <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span v-if="(p.stars ?? 0) > 0" class="flex items-center gap-0.5"><Star :size="10" />{{ p.stars }}</span>
                  <span class="px-1.5 py-0.5 rounded text-xs bg-card border border-border">{{ p.visibility }}</span>
                </div>
              </div>
              <p v-if="p.description" class="text-xs text-muted-foreground mt-0.5 truncate">{{ p.description }}</p>
              <p v-if="p.lastActivityAt" class="text-xs text-muted-foreground mt-1">{{ formatRelative(p.lastActivityAt) }}</p>
            </div>
          </div>
        </div>

        <div class="border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-mono font-medium">Merge Requests</span>
            </div>
            <div class="flex rounded border border-border overflow-hidden">
              <button
                v-for="s in MR_STATES"
                :key="s"
                @click="mrState = s"
                :class="cn('flex-1 px-2 py-1 text-xs font-mono transition-colors', mrState === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')"
              >
                {{ s }}
              </button>
            </div>
          </div>
          <div class="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            <div v-if="!mrs?.length" class="p-6 text-center text-muted-foreground text-xs">No merge requests</div>
            <div v-else v-for="mr in mrs" :key="mr.id" class="px-4 py-2.5 hover:bg-card/50 transition-colors">
              <div class="flex items-start gap-2">
                <GitMerge :size="12" class="text-primary mt-0.5 shrink-0" />
                <div class="min-w-0">
                  <a :href="mr.webUrl" target="_blank" rel="noreferrer" class="text-xs hover:text-primary transition-colors line-clamp-2">
                    {{ mr.title }}
                  </a>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ mr.projectName }} · {{ formatRelative(mr.updatedAt) }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ mr.sourceBranch }} → {{ mr.targetBranch }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
