<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import {
  getProfile,
  getGetProfileQueryKey,
  listProjects,
  getListProjectsQueryKey,
  getRecentActivity,
  getGetRecentActivityQueryKey,
  listPlatforms,
  getListPlatformsQueryKey,
} from "@workspace/api-client-react";
import { formatRelative } from "@/lib/utils";
import PlatformIcon from "@/components/PlatformIcon.vue";
import { ExternalLink, MapPin, Building2, Star, GitFork, Zap } from "lucide-vue-next";

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  in_progress: "In Progress",
  open_source: "Open Source",
  archived: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  in_progress: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  open_source: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

const { data: profile } = useQuery({
  queryKey: getGetProfileQueryKey(),
  queryFn: () => getProfile(),
});
const { data: projects } = useQuery({
  queryKey: [...getListProjectsQueryKey(), "featured"],
  queryFn: () => listProjects({ featured: true }),
});
const { data: recentActivity } = useQuery({
  queryKey: getGetRecentActivityQueryKey(),
  queryFn: () => getRecentActivity(),
});
const { data: platforms } = useQuery({
  queryKey: getListPlatformsQueryKey(),
  queryFn: () => listPlatforms(),
});

const connectedPlatforms = computed(() =>
  (platforms.value ?? []).filter((p) => p.isConnected),
);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-mono">
    <header class="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-20">
      <div class="flex items-center gap-2">
        <span class="text-primary font-bold text-sm">&gt;_</span>
        <span class="text-sm font-semibold">{{ profile?.username ?? "devhub" }}</span>
      </div>
      <RouterLink
        to="/dashboard"
        class="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border hover:border-primary/40 transition-colors"
      >
        Dashboard →
      </RouterLink>
    </header>

    <div class="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <section class="space-y-6">
        <div class="flex items-start gap-4">
          <img
            v-if="profile?.avatarUrl"
            :src="profile.avatarUrl"
            :alt="profile.fullName ?? ''"
            class="w-16 h-16 rounded-full border border-border"
          />
          <div v-else class="w-16 h-16 rounded-full border border-border bg-card flex items-center justify-center text-2xl font-bold text-muted-foreground">
            {{ (profile?.fullName ?? "?")[0] }}
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{{ profile?.fullName ?? "Developer" }}</h1>
            <p class="text-muted-foreground mt-1">{{ profile?.title ?? "Software Engineer" }}</p>
            <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span v-if="profile?.location" class="flex items-center gap-1">
                <MapPin :size="11" />{{ profile.location }}
              </span>
              <span v-if="profile?.currentCompany" class="flex items-center gap-1">
                <Building2 :size="11" />{{ profile.currentCompany }}
              </span>
              <span
                v-if="profile?.workStatus"
                class="px-2 py-0.5 rounded-full border text-xs"
                :class="profile.workStatus === 'open' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'"
              >
                {{ profile.workStatus === "open" ? "Open to work" : profile.workStatus === "freelance" ? "Freelance" : "Employed" }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="profile?.bio" class="text-muted-foreground leading-relaxed max-w-2xl">
          {{ profile.bio }}
        </p>

        <div v-if="profile?.skills && profile.skills.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="skill in profile.skills"
            :key="skill"
            class="text-xs px-2 py-1 rounded border border-border bg-card text-muted-foreground font-mono"
          >
            {{ skill }}
          </span>
        </div>

        <div v-if="connectedPlatforms.length > 0" class="flex items-center gap-3">
          <div
            v-for="p in connectedPlatforms"
            :key="p.platform"
            class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <PlatformIcon :platform="p.platform" :size="14" />
            <span>{{ p.username }}</span>
          </div>
        </div>
      </section>

      <section v-if="projects && projects.length > 0" class="space-y-4">
        <h2 class="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          // featured_projects
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="project in projects"
            :key="project.id"
            class="border border-border rounded-lg p-5 bg-card hover:border-primary/30 transition-colors group"
          >
            <div class="flex items-start justify-between gap-2 mb-3">
              <h3 class="font-semibold text-sm group-hover:text-primary transition-colors">{{ project.name }}</h3>
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="text-xs px-2 py-0.5 rounded-full border"
                  :class="STATUS_COLORS[project.status] ?? STATUS_COLORS.archived"
                >
                  {{ STATUS_LABELS[project.status] ?? project.status }}
                </span>
                <a
                  v-if="project.demoUrl"
                  :href="project.demoUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink :size="12" />
                </a>
              </div>
            </div>
            <p v-if="project.description" class="text-xs text-muted-foreground mb-3 leading-relaxed">
              {{ project.description }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tech in (project.techStack ?? []).slice(0, 4)"
                  :key="tech"
                  class="text-xs text-muted-foreground font-mono"
                >{{ tech }}</span>
              </div>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span v-if="(project.stars ?? 0) > 0" class="flex items-center gap-1">
                  <Star :size="10" />{{ project.stars }}
                </span>
                <span v-if="(project.forks ?? 0) > 0" class="flex items-center gap-1">
                  <GitFork :size="10" />{{ project.forks }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="recentActivity && recentActivity.length > 0" class="space-y-4">
        <h2 class="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          // recent_activity
        </h2>
        <div class="space-y-2">
          <div
            v-for="item in recentActivity"
            :key="item.id"
            class="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0"
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
              <p v-if="item.repoName" class="text-xs text-muted-foreground mt-0.5">{{ item.repoName }}</p>
            </div>
            <span class="text-xs text-muted-foreground shrink-0 tabular-nums">{{ formatRelative(item.activityAt) }}</span>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
          // contact
        </h2>
        <div class="flex items-center gap-4">
          <a
            v-if="profile?.email"
            :href="`mailto:${profile.email}`"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Zap :size="13" /> {{ profile.email }}
          </a>
          <a
            v-if="profile?.websiteUrl"
            :href="profile.websiteUrl"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ExternalLink :size="13" /> Website
          </a>
        </div>
      </section>
    </div>
  </div>
</template>
