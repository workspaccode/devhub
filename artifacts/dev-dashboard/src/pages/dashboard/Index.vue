<script setup lang="ts">
import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import {
  getDashboardSummary,
  getGetDashboardSummaryQueryKey,
  listPlatforms,
  getListPlatformsQueryKey,
  listActivity,
  getListActivityQueryKey,
  syncPlatform,
} from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, PLATFORM_LABELS } from "@/lib/utils";
import PlatformIcon from "@/components/PlatformIcon.vue";
import { RefreshCw, AlertCircle, GitPullRequest, FolderOpen, Plug, Activity, Flame } from "lucide-vue-next";

const qc = useQueryClient();
const syncing = ref<string | null>(null);

const { data: summary } = useQuery({
  queryKey: getGetDashboardSummaryQueryKey(),
  queryFn: () => getDashboardSummary(),
});
const { data: platforms } = useQuery({
  queryKey: getListPlatformsQueryKey(),
  queryFn: () => listPlatforms(),
});
const { data: activity } = useQuery({
  queryKey: [...getListActivityQueryKey(), 20],
  queryFn: () => listActivity({ limit: 20 }),
});

async function handleSync(platform: string) {
  syncing.value = platform;
  try {
    await syncPlatform(platform as any);
    await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
    await qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    await qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
  } finally {
    syncing.value = null;
  }
}

const stats = [
  { label: "Open Issues", key: "openIssues", icon: AlertCircle },
  { label: "Open PRs", key: "openPullRequests", icon: GitPullRequest },
  { label: "Projects", key: "totalProjects", icon: FolderOpen },
  { label: "Connected", key: "connectedPlatforms", icon: Plug },
  { label: "This Week", key: "activityThisWeek", icon: Activity },
  { label: "Streak", key: "contributionStreak", icon: Flame, suffix: "d" },
];
</script>

<template>
  <DashboardLayout>
    <div class="space-y-8 max-w-5xl">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="s in stats" :key="s.label" class="border border-border rounded-lg p-4 bg-card">
          <div class="flex items-center justify-between mb-2">
            <component :is="s.icon" :size="13" class="text-muted-foreground" />
          </div>
          <div class="text-2xl font-bold font-mono">
            {{ (summary as any)?.[s.key] ?? 0 }}{{ s.suffix ?? "" }}
          </div>
          <div class="text-xs text-muted-foreground mt-1">{{ s.label }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <span class="text-sm font-medium font-mono">Activity Feed</span>
            <span class="text-xs text-muted-foreground">{{ activity?.length ?? 0 }} events</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[520px] overflow-y-auto">
            <div v-if="!activity?.length" class="p-8 text-center text-muted-foreground text-sm">
              No activity yet. Connect a platform and sync.
            </div>
            <div
              v-else
              v-for="item in activity"
              :key="item.id"
              class="flex items-start gap-3 px-4 py-3 hover:bg-card/50 transition-colors"
            >
              <div class="mt-0.5 shrink-0">
                <PlatformIcon :platform="item.platform" :size="13" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm truncate">
                  <a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer" class="hover:text-primary transition-colors">
                    {{ item.title }}
                  </a>
                  <span v-else>{{ item.title }}</span>
                </p>
                <p v-if="item.repoName" class="text-xs text-muted-foreground mt-0.5 truncate">{{ item.repoName }}</p>
              </div>
              <span class="text-xs text-muted-foreground shrink-0 tabular-nums">{{ formatRelative(item.activityAt) }}</span>
            </div>
          </div>
        </div>

        <div class="border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border">
            <span class="text-sm font-medium font-mono">Platforms</span>
          </div>
          <div class="divide-y divide-border/50">
            <div v-for="p in platforms" :key="p.platform" class="px-4 py-3 flex items-center gap-3">
              <PlatformIcon :platform="p.platform" :size="16" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ PLATFORM_LABELS[p.platform] ?? p.platform }}</span>
                  <span class="w-1.5 h-1.5 rounded-full" :class="p.isConnected ? 'bg-emerald-400' : 'bg-zinc-600'" />
                </div>
                <p v-if="p.isConnected && p.lastSyncedAt" class="text-xs text-muted-foreground">
                  {{ formatRelative(p.lastSyncedAt) }}
                </p>
                <p v-else-if="!p.isConnected" class="text-xs text-muted-foreground">Not connected</p>
              </div>
              <button
                v-if="p.isConnected"
                @click="handleSync(p.platform)"
                :disabled="syncing === p.platform"
                class="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw :size="12" :class="syncing === p.platform ? 'animate-spin' : ''" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
