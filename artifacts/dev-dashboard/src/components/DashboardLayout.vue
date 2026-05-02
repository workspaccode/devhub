<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { cn } from "@/lib/utils";
import PlatformIcon from "./PlatformIcon.vue";
import {
  LayoutDashboard,
  GitBranch,
  Activity,
  BookOpen,
  Plug,
  User,
  ChevronLeft,
  Menu,
  X,
} from "lucide-vue-next";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, platform: null },
  { href: "/dashboard/issues", label: "Issues", icon: BookOpen, platform: null },
  { href: "/dashboard/activity", label: "Activity", icon: Activity, platform: null },
  { href: "/dashboard/github", label: "GitHub", icon: null, platform: "github" },
  { href: "/dashboard/gitlab", label: "GitLab", icon: null, platform: "gitlab" },
  { href: "/dashboard/bitbucket", label: "Bitbucket", icon: null, platform: "bitbucket" },
  { href: "/dashboard/slack", label: "Slack", icon: null, platform: "slack" },
  { href: "/dashboard/projects", label: "Projects", icon: GitBranch, platform: null },
  { href: "/dashboard/connections", label: "Connections", icon: Plug, platform: null },
  { href: "/dashboard/profile", label: "Profile", icon: User, platform: null },
];

const route = useRoute();
const mobileOpen = ref(false);

function isActive(href: string) {
  return (
    route.path === href ||
    (href !== "/dashboard" && route.path.startsWith(href))
  );
}

const activeLabel = computed(() => {
  const active = navItems.find(
    (n) =>
      n.href === route.path ||
      (n.href !== "/dashboard" && route.path.startsWith(n.href)),
  );
  return active?.label ?? "Dashboard";
});
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <aside
      :class="
        cn(
          'fixed inset-y-0 left-0 z-50 w-56 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )
      "
    >
      <div class="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <div class="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
          <span class="text-xs font-bold text-primary font-mono">&gt;_</span>
        </div>
        <span class="font-semibold text-sm font-mono tracking-tight">DevHub</span>
      </div>

      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <RouterLink
          to="/"
          class="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors mb-2"
        >
          <ChevronLeft :size="12" />
          <span>Public Portfolio</span>
        </RouterLink>

        <div class="h-px bg-sidebar-border my-2" />

        <RouterLink
          v-for="item in navItems"
          :key="item.href"
          :to="item.href"
          @click="mobileOpen = false"
          :class="
            cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
            )
          "
        >
          <PlatformIcon v-if="item.platform" :platform="item.platform" :size="14" />
          <component v-else-if="item.icon" :is="item.icon" :size="14" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-3 border-t border-sidebar-border">
        <div class="text-xs text-muted-foreground font-mono">dashboard v1</div>
      </div>
    </aside>

    <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/60 md:hidden" @click="mobileOpen = false" />

    <div class="flex-1 md:ml-56 flex flex-col min-h-screen">
      <header class="h-14 border-b border-border flex items-center px-4 gap-3 sticky top-0 bg-background/80 backdrop-blur z-30">
        <button class="md:hidden" @click="mobileOpen = !mobileOpen">
          <X v-if="mobileOpen" :size="18" />
          <Menu v-else :size="18" />
        </button>
        <span class="text-sm text-muted-foreground font-mono">{{ activeLabel }}</span>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
