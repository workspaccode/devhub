<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { listActivity } from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, PLATFORM_LABELS, cn } from "@/lib/utils";
import PlatformIcon from "@/components/PlatformIcon.vue";
import { ExternalLink } from "lucide-vue-next";

const PLATFORM_TABS = [
  { value: "all", label: "All" },
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "bitbucket", label: "Bitbucket" },
  { value: "slack", label: "Slack" },
] as const;

const platform = ref<string>("all");

const { data: activity, isLoading } = useQuery({
  queryKey: computed(() => ["/api/activity", platform.value]),
  queryFn: () =>
    listActivity({
      platform: platform.value === "all" ? undefined : (platform.value as any),
      limit: 100,
    }),
  staleTime: 30_000,
});
</script>

<template>
  <DashboardLayout>
    <div class="space-y-5 max-w-4xl">
      <div class="flex gap-1 border-b border-border">
        <button
          v-for="tab in PLATFORM_TABS"
          :key="tab.value"
          @click="platform = tab.value"
          :class="
            cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors border-b-2 -mb-px',
              platform === tab.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          "
        >
          <PlatformIcon v-if="tab.value !== 'all'" :platform="tab.value" :size="12" />
          {{ tab.label }}
        </button>
        <span class="ml-auto text-xs text-muted-foreground self-center pr-1">
          {{ activity?.length ?? 0 }} events
        </span>
      </div>

      <div v-if="isLoading" class="text-center text-muted-foreground text-sm py-12">Loading activity...</div>
      <div
        v-else-if="!activity?.length"
        class="border border-border rounded-lg bg-card p-12 text-center text-muted-foreground text-sm"
      >
        No activity. Connect a platform and sync.
      </div>
      <div v-else class="border border-border rounded-lg bg-card divide-y divide-border/50 overflow-hidden">
        <div
          v-for="item in activity"
          :key="item.id"
          class="flex items-start gap-3 px-4 py-3 hover:bg-card/50 transition-colors group"
        >
          <div class="mt-0.5 shrink-0">
            <PlatformIcon :platform="item.platform" :size="14" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm">
              <a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer" class="hover:text-primary transition-colors">
                {{ item.title }}
              </a>
              <span v-else>{{ item.title }}</span>
            </p>
            <div class="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span class="font-mono">{{ PLATFORM_LABELS[item.platform] ?? item.platform }}</span>
              <span v-if="item.repoName">{{ item.repoName }}</span>
              <span>{{ formatRelative(item.activityAt) }}</span>
            </div>
          </div>
          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
            class="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
          >
            <ExternalLink :size="12" />
          </a>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
