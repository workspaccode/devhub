<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { listSlackWorkspaces, listSlackChannels, getSlackActivity } from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative } from "@/lib/utils";
import { Hash, Lock, Users } from "lucide-vue-next";

const { data: workspaces } = useQuery({
  queryKey: ["/api/slack/workspaces"],
  queryFn: () => listSlackWorkspaces(),
});
const { data: channels, isLoading } = useQuery({
  queryKey: ["/api/slack/channels"],
  queryFn: () => listSlackChannels(),
});
const { data: activity } = useQuery({
  queryKey: ["/api/slack/activity"],
  queryFn: () => getSlackActivity({}),
});

const memberChannels = computed(() => (channels.value ?? []).filter((c) => c.isMember));
const otherChannels = computed(() => (channels.value ?? []).filter((c) => !c.isMember));
const sortedChannels = computed(() => [...memberChannels.value, ...otherChannels.value]);
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 max-w-5xl">
      <div v-for="ws in workspaces" :key="ws.id" class="border border-border rounded-lg bg-card px-5 py-4 flex items-center gap-4">
        <img v-if="ws.iconUrl" :src="ws.iconUrl" :alt="ws.name" class="w-10 h-10 rounded" />
        <div>
          <div class="font-semibold">{{ ws.name }}</div>
          <div class="text-xs text-muted-foreground font-mono">{{ ws.domain }}.slack.com</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-1 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <span class="text-sm font-mono font-medium">Channels</span>
            <span class="text-xs text-muted-foreground">{{ channels?.length ?? 0 }}</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-if="isLoading" class="p-6 text-center text-muted-foreground text-sm">Loading...</div>
            <div v-else-if="!channels?.length" class="p-6 text-center text-muted-foreground text-sm">
              Connect Slack to see channels.
            </div>
            <div
              v-else
              v-for="ch in sortedChannels"
              :key="ch.id"
              class="px-4 py-2.5 hover:bg-card/50 transition-colors"
              :class="!ch.isMember ? 'opacity-50' : ''"
            >
              <div class="flex items-center gap-1.5">
                <Lock v-if="ch.isPrivate" :size="11" class="text-muted-foreground" />
                <Hash v-else :size="11" class="text-muted-foreground" />
                <span class="text-sm">{{ ch.name }}</span>
                <span v-if="ch.isMember" class="text-xs text-emerald-400 ml-auto">joined</span>
              </div>
              <p v-if="ch.memberCount" class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Users :size="9" />{{ ch.memberCount }} members
              </p>
              <p v-if="ch.topic" class="text-xs text-muted-foreground mt-0.5 truncate">{{ ch.topic }}</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 border border-border rounded-lg bg-card">
          <div class="px-4 py-3 border-b border-border">
            <span class="text-sm font-mono font-medium">Recent Messages</span>
          </div>
          <div class="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            <div v-if="!activity?.length" class="p-8 text-center text-muted-foreground text-sm">No recent messages</div>
            <div v-else v-for="msg in activity" :key="msg.id" class="px-4 py-3 hover:bg-card/50 transition-colors">
              <div class="flex items-start gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm line-clamp-2">{{ msg.title }}</p>
                  <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span v-if="msg.repoName" class="font-mono">{{ msg.repoName }}</span>
                    <span>{{ formatRelative(msg.activityAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
