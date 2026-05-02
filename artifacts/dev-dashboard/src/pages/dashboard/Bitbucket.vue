<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { listBitbucketRepos, listBitbucketPullRequests } from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, cn } from "@/lib/utils";
import { GitPullRequest, Lock } from "lucide-vue-next";

const PR_STATES = ["OPEN", "MERGED", "DECLINED"] as const;
const prState = ref<"OPEN" | "MERGED" | "DECLINED">("OPEN");

const { data: repos, isLoading } = useQuery({
  queryKey: ["/api/bitbucket/repos"],
  queryFn: () => listBitbucketRepos(),
});
const { data: prs } = useQuery({
  queryKey: computed(() => ["/api/bitbucket/prs", prState.value]),
  queryFn: () => listBitbucketPullRequests({ state: prState.value }),
  staleTime: 30_000,
});
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 max-w-5xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <span class="text-sm font-mono font-medium">Repositories</span>
            <span class="text-xs text-muted-foreground">{{ repos?.length ?? 0 }}</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-if="isLoading" class="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            <div v-else-if="!repos?.length" class="p-8 text-center text-muted-foreground text-sm">
              Connect Bitbucket to see your repos.
            </div>
            <div v-else v-for="r in repos" :key="r.uuid" class="px-4 py-3 hover:bg-card/50 transition-colors">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <Lock v-if="r.isPrivate" :size="11" class="text-amber-400 shrink-0" />
                  <a :href="r.webUrl" target="_blank" rel="noreferrer" class="text-sm font-medium hover:text-primary transition-colors truncate">
                    {{ r.name }}
                  </a>
                </div>
                <span v-if="r.language" class="text-xs text-muted-foreground font-mono shrink-0">{{ r.language }}</span>
              </div>
              <p v-if="r.description" class="text-xs text-muted-foreground mt-0.5 truncate">{{ r.description }}</p>
              <p v-if="r.updatedOn" class="text-xs text-muted-foreground mt-1">{{ formatRelative(r.updatedOn) }}</p>
            </div>
          </div>
        </div>

        <div class="border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-mono font-medium">Pull Requests</span>
            </div>
            <div class="flex rounded border border-border overflow-hidden">
              <button
                v-for="s in PR_STATES"
                :key="s"
                @click="prState = s"
                :class="cn('flex-1 px-2 py-1 text-xs font-mono transition-colors', prState === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')"
              >
                {{ s.toLowerCase() }}
              </button>
            </div>
          </div>
          <div class="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            <div v-if="!prs?.length" class="p-6 text-center text-muted-foreground text-xs">No pull requests</div>
            <div v-else v-for="pr in prs" :key="pr.id" class="px-4 py-2.5 hover:bg-card/50 transition-colors">
              <div class="flex items-start gap-2">
                <GitPullRequest :size="12" class="text-primary mt-0.5 shrink-0" />
                <div class="min-w-0">
                  <a :href="pr.webUrl" target="_blank" rel="noreferrer" class="text-xs hover:text-primary transition-colors line-clamp-2">{{ pr.title }}</a>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ pr.repoFullName }}</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ pr.sourceBranch }} → {{ pr.destinationBranch }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatRelative(pr.updatedOn) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
