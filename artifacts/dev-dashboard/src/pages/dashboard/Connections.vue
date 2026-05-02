<script setup lang="ts">
import { ref } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import {
  listPlatforms,
  getListPlatformsQueryKey,
  connectPlatform,
  disconnectPlatform,
  syncPlatform,
} from "@workspace/api-client-react";
import DashboardLayout from "@/components/DashboardLayout.vue";
import { formatRelative, formatDate, PLATFORM_LABELS } from "@/lib/utils";
import PlatformIcon from "@/components/PlatformIcon.vue";
import { RefreshCw, Unplug, AlertTriangle, CheckCircle2, Circle } from "lucide-vue-next";

const PLATFORM_DOCS: Record<string, { desc: string; oauthHint: string }> = {
  github: {
    desc: "Connect to GitHub to view repos, issues, pull requests, and contribution activity.",
    oauthHint: "You'll need a GitHub Personal Access Token with scopes: repo, read:user, read:org",
  },
  gitlab: {
    desc: "Connect to GitLab to view projects, merge requests, and pipeline activity.",
    oauthHint: "You'll need a GitLab Personal Access Token with scopes: api, read_user",
  },
  bitbucket: {
    desc: "Connect to Bitbucket to view repositories and pull requests.",
    oauthHint: "You'll need a Bitbucket App Password with repository and pullrequest permissions",
  },
  slack: {
    desc: "Connect to Slack to view channels and recent workspace activity.",
    oauthHint: "You'll need a Slack User OAuth Token (xoxp-...)",
  },
  zoho: {
    desc: "Connect Zoho Mail to view recent company emails.",
    oauthHint: "You'll need a Zoho Mail OAuth access token",
  },
};

const qc = useQueryClient();
const syncing = ref<string | null>(null);
const connectingPlatform = ref<string | null>(null);
const modalToken = ref("");
const modalUsername = ref("");
const modalLoading = ref(false);
const modalError = ref("");

const { data: platforms } = useQuery({
  queryKey: getListPlatformsQueryKey(),
  queryFn: () => listPlatforms(),
});

async function handleSync(platform: string) {
  syncing.value = platform;
  try {
    await syncPlatform(platform as any);
    await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
  } finally {
    syncing.value = null;
  }
}

async function handleDisconnect(platform: string) {
  await disconnectPlatform(platform as any);
  await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
}

function openConnect(platform: string) {
  connectingPlatform.value = platform;
  modalToken.value = "";
  modalUsername.value = "";
  modalError.value = "";
}

function closeModal() {
  connectingPlatform.value = null;
  modalToken.value = "";
  modalUsername.value = "";
  modalError.value = "";
}

async function handleConnect() {
  if (!modalToken.value.trim()) {
    modalError.value = "Token is required";
    return;
  }
  modalLoading.value = true;
  modalError.value = "";
  try {
    await connectPlatform(connectingPlatform.value as any, {
      accessToken: modalToken.value.trim(),
      username: modalUsername.value.trim() || undefined,
    });
    await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
    closeModal();
  } catch (e: any) {
    modalError.value = e.message ?? "Failed to connect";
  } finally {
    modalLoading.value = false;
  }
}

function isExpiring(p: any) {
  return p.tokenExpiresAt && new Date(p.tokenExpiresAt).getTime() - Date.now() < 7 * 86400000;
}
</script>

<template>
  <DashboardLayout>
    <Teleport to="body">
      <div
        v-if="connectingPlatform"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click="closeModal"
      >
        <div
          class="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center gap-2 mb-4">
            <PlatformIcon :platform="connectingPlatform" :size="18" />
            <h2 class="text-base font-semibold">
              Connect {{ PLATFORM_LABELS[connectingPlatform] ?? connectingPlatform }}
            </h2>
          </div>
          <template v-if="PLATFORM_DOCS[connectingPlatform]">
            <p class="text-sm text-muted-foreground mb-3">{{ PLATFORM_DOCS[connectingPlatform].desc }}</p>
            <div class="bg-background rounded border border-border p-3 mb-4">
              <p class="text-xs text-muted-foreground font-mono">{{ PLATFORM_DOCS[connectingPlatform].oauthHint }}</p>
            </div>
          </template>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Username (optional)</label>
              <input
                v-model="modalUsername"
                placeholder="your-username"
                class="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground block mb-1">Access Token *</label>
              <input
                v-model="modalToken"
                type="password"
                placeholder="paste your token here..."
                class="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <p v-if="modalError" class="text-xs text-red-400">{{ modalError }}</p>
          </div>
          <div class="flex gap-2 mt-5">
            <button @click="closeModal" class="flex-1 px-4 py-2 rounded border border-border text-sm hover:bg-card/50 transition-colors">
              Cancel
            </button>
            <button
              @click="handleConnect"
              :disabled="modalLoading"
              class="flex-1 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ modalLoading ? "Connecting..." : "Connect" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="space-y-4 max-w-3xl">
      <p class="text-sm text-muted-foreground">
        Connect your development platforms to pull live activity into your dashboard.
        Tokens are stored server-side only and never exposed to the browser.
      </p>

      <div class="space-y-3">
        <div
          v-for="p in platforms"
          :key="p.platform"
          class="border rounded-xl bg-card overflow-hidden"
          :class="isExpiring(p) ? 'border-amber-500/40' : 'border-border'"
        >
          <div v-if="isExpiring(p)" class="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <AlertTriangle :size="12" class="text-amber-400" />
            <span class="text-xs text-amber-400">Token expires {{ formatDate(p.tokenExpiresAt) }}</span>
          </div>
          <div class="px-5 py-4 flex items-start gap-4">
            <div class="mt-0.5">
              <PlatformIcon :platform="p.platform" :size="22" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-sm">{{ PLATFORM_LABELS[p.platform] ?? p.platform }}</span>
                <span v-if="p.isConnected" class="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 :size="11" /> Connected
                </span>
                <span v-else class="flex items-center gap-1 text-xs text-muted-foreground">
                  <Circle :size="11" /> Not connected
                </span>
              </div>
              <p v-if="p.isConnected && p.username" class="text-xs text-muted-foreground mb-1 font-mono">{{ p.username }}</p>
              <p v-if="p.isConnected && p.lastSyncedAt" class="text-xs text-muted-foreground">
                Last synced {{ formatRelative(p.lastSyncedAt) }}
              </p>
              <p v-if="p.isConnected && (p.activityCount ?? 0) > 0" class="text-xs text-muted-foreground">
                {{ p.activityCount }} activity items
              </p>
              <div v-if="p.scopes && p.scopes.length > 0" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="s in p.scopes"
                  :key="s"
                  class="text-xs px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground font-mono"
                >{{ s }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <template v-if="p.isConnected">
                <button
                  @click="handleSync(p.platform)"
                  :disabled="syncing === p.platform"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs hover:bg-card/50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw :size="11" :class="syncing === p.platform ? 'animate-spin' : ''" />
                  Sync
                </button>
                <button
                  @click="handleDisconnect(p.platform)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded border border-destructive/30 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Unplug :size="11" /> Disconnect
                </button>
              </template>
              <button
                v-else
                @click="openConnect(p.platform)"
                class="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
