import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", component: () => import("@/pages/Portfolio.vue") },
  { path: "/dashboard", component: () => import("@/pages/dashboard/Index.vue") },
  { path: "/dashboard/issues", component: () => import("@/pages/dashboard/Issues.vue") },
  { path: "/dashboard/activity", component: () => import("@/pages/dashboard/Activity.vue") },
  { path: "/dashboard/github", component: () => import("@/pages/dashboard/GitHub.vue") },
  { path: "/dashboard/gitlab", component: () => import("@/pages/dashboard/GitLab.vue") },
  { path: "/dashboard/bitbucket", component: () => import("@/pages/dashboard/Bitbucket.vue") },
  { path: "/dashboard/slack", component: () => import("@/pages/dashboard/Slack.vue") },
  { path: "/dashboard/connections", component: () => import("@/pages/dashboard/Connections.vue") },
  { path: "/dashboard/projects", component: () => import("@/pages/dashboard/Projects.vue") },
  { path: "/dashboard/profile", component: () => import("@/pages/dashboard/Profile.vue") },
  { path: "/:pathMatch(.*)*", component: () => import("@/pages/NotFound.vue") },
];

export default routes;
