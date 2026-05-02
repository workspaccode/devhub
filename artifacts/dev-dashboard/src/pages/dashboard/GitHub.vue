<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import {
  listGithubRepos,
  getGithubActivity,
  getGithubContributions,
} from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative } from "@/lib/utils";
import { Star, GitFork, AlertCircle, ExternalLink, Lock } from "lucide-vue-next";

const { data: repos, isLoading: reposLoading } = useQuery({
  queryKey: ["/api/github/repos"],
  queryFn: () => listGithubRepos({}),
});
const { data: activity } = useQuery({
  queryKey: ["/api/github/activity"],
  queryFn: () => getGithubActivity({}),
});
const { data: contributions } = useQuery({
  queryKey: ["/api/github/contributions"],
  queryFn: () => getGithubContributions(),
});

const sortedRepos = computed(() =>
  [...(repos.value ?? [])].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0)),
);

const LEVELS = ["bg-zinc-800", "bg-emerald-900", "bg-emerald-700", "bg-emerald-500", "bg-emerald-400"];
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 max-w-5xl">
      <div v-if="contributions && contributions.weeks.length > 0" class="border border-border rounded-lg bg-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-mono font-medium">Contributions</h2>
          <span class="text-xs text-muted-foreground">{{ contributions.totalContributions }} total</span>
        </div>
        <div class="overflow-x-auto">
          <div class="flex gap-1 min-w-max">
            <div
              v-for="(week, wi) in contributions.weeks.slice(-52)"
              :key="wi"
              class="flex flex-col gap-1"
            >
              <div
                v-for="(day, di) in week.days"
                :key="di"
                class="w-3 h-3 rounded-sm cursor-default transition-opacity hover:opacity-70"
                :class="LEVELS[day.level ?? 0]"
                :title="`${day.date}: ${day.count} contributions`"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <span class="text-sm font-mono font-medium">Repositories</span>
            <span class="text-xs text-muted-foreground">{{ repos?.length ?? 0 }}</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
            <div v-if="reposLoading" class="p-8 text-center text-muted-foreground text-sm">Loading repos...</div>
            <div v-else-if="!sortedRepos.length" class="p-8 text-center text-muted-foreground text-sm">
              Connect GitHub to see your repositories.
            </div>
            <div
              v-else
              v-for="repo in sortedRepos"
              :key="repo.id"
              class="px-4 py-3 hover:bg-card/50 transition-colors"
            >
              <div class="flex items-start gap-2 justify-between">
                <div class="flex items-center gap-1.5 min-w-0">
                  <Lock v-if="repo.private" :size="11" class="text-amber-400 shrink-0" />
                  <a :href="repo.url" target="_blank" rel="noreferrer" class="text-sm font-medium hover:text-primary transition-colors truncate">
                    {{ repo.name }}
                  </a>
                </div>
                <div class="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span v-if="(repo.stars ?? 0) > 0" class="flex items-center gap-0.5"><Star :size="10" />{{ repo.stars }}</span>
                  <span v-if="(repo.forks ?? 0) > 0" class="flex items-center gap-0.5"><GitFork :size="10" />{{ repo.forks }}</span>
                  <span v-if="(repo.openIssuesCount ?? 0) > 0" class="flex items-center gap-0.5 text-emerald-400">
                    <AlertCircle :size="10" />{{ repo.openIssuesCount }}
                  </span>
                </div>
              </div>
              <p v-if="repo.description" class="text-xs text-muted-foreground mt-0.5 truncate">{{ repo.description }}</p>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span v-if="repo.language" class="font-mono">{{ repo.language }}</span>
                <span v-if="repo.pushedAt">{{ formatRelative(repo.pushedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border">
            <span class="text-sm font-mono font-medium">Recent Events</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
            <div v-if="!activity?.length" class="p-6 text-center text-muted-foreground text-xs">No events yet</div>
            <div
              v-else
              v-for="item in activity"
              :key="item.id"
              class="px-4 py-2.5 hover:bg-card/50 transition-colors"
            >
              <p class="text-xs truncate">
                <a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer" class="hover:text-primary">{{ item.title }}</a>
                <span v-else>{{ item.title }}</span>
              </p>
              <p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span class="font-mono">{{ (item.type ?? "").replace(/Event$/, "") }}</span>
                <span>·</span>
                <span>{{ formatRelative(item.activityAt) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
