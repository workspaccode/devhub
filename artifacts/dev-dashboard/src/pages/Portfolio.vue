<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
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
import { ExternalLink, MapPin, Building2, Star, GitFork, Mail, Moon, Sun, Menu, X } from "lucide-vue-next";

// ── Data ────────────────────────────────────────────────────────────────────
const { data: profile } = useQuery({ queryKey: getGetProfileQueryKey(), queryFn: getProfile });
const { data: projects } = useQuery({ queryKey: [...getListProjectsQueryKey(), "featured"], queryFn: () => listProjects({ featured: true }) });
const { data: recentActivity } = useQuery({ queryKey: getGetRecentActivityQueryKey(), queryFn: getRecentActivity });
const { data: platforms } = useQuery({ queryKey: getListPlatformsQueryKey(), queryFn: listPlatforms });

const connectedPlatforms = computed(() => (Array.isArray(platforms.value) ? platforms.value : []).filter((p) => p.isConnected));
const githubPlatform = computed(() => connectedPlatforms.value.find((p) => p.platform === "github"));

// ── Theme ────────────────────────────────────────────────────────────────────
const isDark = ref(true);
function toggleTheme() { isDark.value = !isDark.value; }

// ── Mobile nav ───────────────────────────────────────────────────────────────
const mobileOpen = ref(false);

// ── Active section (Intersection Observer) ───────────────────────────────────
const activeSection = ref("home");
let observer: IntersectionObserver | null = null;
onMounted(() => {
  const sections = document.querySelectorAll("section[id]");
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => { if (e.isIntersecting) activeSection.value = e.target.id; });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => observer!.observe(s));
});
onUnmounted(() => observer?.disconnect());

function scrollTo(id: string) {
  mobileOpen.value = false;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── Skills ───────────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  { label: "Mobile", skills: ["Flutter", "Dart", "BLoC", "Riverpod"] },
  { label: "IoT & Hardware", skills: ["BLE", "Modbus", "MQTT", "Python"] },
  { label: "Backend & APIs", skills: ["Firebase", "Supabase", "REST", "Node.js"] },
  { label: "UI/UX & Design", skills: ["Figma", "Responsive Design", "Animations"] },
  { label: "DevOps & Tools", skills: ["Docker", "GitHub Actions", "Git", "CI/CD"] },
];

// ── Project status ───────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  live: "Live", in_progress: "In Progress", open_source: "Open Source", archived: "Archived",
};
const STATUS_CLASS: Record<string, string> = {
  live: "status-live", in_progress: "status-wip", open_source: "status-oss", archived: "status-arc",
};

// ── Platform social info ─────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  github:    { label: "GitHub",    desc: "Open source contributions", color: "#e6edf3", icon: "github" },
  gitlab:    { label: "GitLab",   desc: "Private & work projects",   color: "#FC6D26", icon: "gitlab" },
  bitbucket: { label: "Bitbucket", desc: "Team repositories",        color: "#0052CC", icon: "bitbucket" },
  slack:     { label: "Slack",    desc: "Message me directly",       color: "#E01E5A", icon: "slack" },
};
</script>

<template>
  <div :class="['portfolio-root', isDark ? 'theme-dark' : 'theme-light']">

    <!-- ── HEADER ─────────────────────────────────────────────────────────── -->
    <header class="pf-header">
      <div class="pf-header-inner">
        <a href="#home" @click.prevent="scrollTo('home')" class="pf-logo">
          <span class="pf-logo-symbol">&lt;/&gt;</span>
          <span class="pf-logo-name">{{ profile?.username ?? "hafezcode" }}</span>
        </a>

        <nav class="pf-nav" aria-label="Main">
          <a v-for="s in ['home','position','projects','skills','contact']" :key="s"
            href="#" @click.prevent="scrollTo(s)"
            :class="['pf-nav-link', activeSection === s && 'pf-nav-link--active']">
            {{ s.charAt(0).toUpperCase() + s.slice(1) }}
          </a>
        </nav>

        <div class="pf-header-actions">
          <button class="pf-icon-btn" @click="toggleTheme" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            <Sun v-if="isDark" :size="16" />
            <Moon v-else :size="16" />
          </button>
          <button class="pf-icon-btn pf-mobile-menu-btn" @click="mobileOpen = !mobileOpen" aria-label="Toggle menu">
            <X v-if="mobileOpen" :size="16" />
            <Menu v-else :size="16" />
          </button>
        </div>
      </div>

      <!-- Mobile nav -->
      <div v-if="mobileOpen" class="pf-mobile-nav">
        <a v-for="s in ['home','position','projects','skills','contact']" :key="s"
          href="#" @click.prevent="scrollTo(s)"
          :class="['pf-mobile-nav-link', activeSection === s && 'pf-mobile-nav-link--active']">
          {{ s.charAt(0).toUpperCase() + s.slice(1) }}
        </a>
      </div>
    </header>

    <main>

      <!-- ── HERO ───────────────────────────────────────────────────────────── -->
      <section id="home" class="pf-section pf-hero-section">
        <div class="pf-container pf-hero">
          <div class="pf-avatar">
            <img v-if="profile?.avatarUrl" :src="profile.avatarUrl" :alt="profile.fullName ?? ''" width="96" height="96" loading="lazy" class="pf-avatar-img" />
            <div v-else class="pf-avatar-placeholder">
              {{ (profile?.fullName ?? "HC").split(" ").map((w:string) => w[0]).join("").slice(0,2) }}
            </div>
          </div>

          <div class="pf-hero-text">
            <p class="pf-hero-eyebrow">Hey, I'm</p>
            <h1 class="pf-hero-name">
              <span class="pf-hero-name-gradient">{{ profile?.fullName ?? "HafezCode" }}</span>
            </h1>
            <p class="pf-hero-subtitle">
              <span class="pf-typing">{{ profile?.title ?? "Senior Flutter & IoT Developer" }}</span>
            </p>
            <p class="pf-hero-bio">{{ profile?.bio ?? "Building cross-platform mobile experiences and IoT systems that connect the physical and digital worlds." }}</p>

            <div class="pf-hero-meta">
              <span v-if="profile?.location" class="pf-meta-chip">
                <MapPin :size="13" />{{ profile.location }}
              </span>
              <span v-if="profile?.currentCompany" class="pf-meta-chip">
                <Building2 :size="13" />{{ profile.currentCompany }}
              </span>
              <span class="pf-meta-chip pf-meta-chip--open" v-if="profile?.workStatus === 'open'">
                <span class="pf-pulse-dot"></span> Open to work
              </span>
              <span class="pf-meta-chip pf-meta-chip--employed" v-else-if="profile?.workStatus === 'employed'">
                <span class="pf-pulse-dot pf-pulse-dot--green"></span> Employed
              </span>
            </div>

            <div class="pf-hero-ctas">
              <a href="#projects" @click.prevent="scrollTo('projects')" class="pf-btn pf-btn--primary">View Projects</a>
              <a href="#contact" @click.prevent="scrollTo('contact')" class="pf-btn pf-btn--ghost">Contact Me</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CURRENT POSITION ───────────────────────────────────────────────── -->
      <section id="position" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// current_position</h2>
          <div class="pf-position-card">
            <div class="pf-position-glow"></div>
            <div class="pf-position-header">
              <div>
                <p class="pf-position-company">{{ profile?.currentCompany ?? "RESC Company" }}</p>
                <p class="pf-position-role">{{ profile?.currentRole ?? "Senior Flutter Developer" }}</p>
              </div>
              <span class="pf-status-badge">
                <span class="pf-pulse-dot pf-pulse-dot--green"></span>
                Currently Employed
              </span>
            </div>
            <p class="pf-position-desc">
              Developing solar inverter gateway applications, IoT control systems, and energy monitoring dashboards — connecting hardware to seamless mobile experiences.
            </p>
            <div class="pf-position-tech">
              <span v-for="t in ['Flutter','Modbus Protocol','BLE','Python','Figma']" :key="t" class="pf-tech-chip">{{ t }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SOCIAL LINKS ───────────────────────────────────────────────────── -->
      <section v-if="connectedPlatforms.length > 0" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// find_me_online</h2>
          <div class="pf-social-grid">
            <a
              v-for="p in connectedPlatforms"
              :key="p.platform"
              :href="p.platform === 'github' ? `https://github.com/${p.username}` : '#'"
              target="_blank"
              rel="noopener noreferrer"
              class="pf-social-card hover-elevate"
              :style="{ '--platform-color': PLATFORM_META[p.platform]?.color ?? '#888' }"
            >
              <div class="pf-social-card-icon">
                <PlatformIcon :platform="p.platform" :size="28" />
              </div>
              <div class="pf-social-card-body">
                <p class="pf-social-platform">{{ PLATFORM_META[p.platform]?.label ?? p.platform }}</p>
                <p class="pf-social-username">@{{ p.username }}</p>
                <p class="pf-social-desc">{{ PLATFORM_META[p.platform]?.desc ?? "View profile" }}</p>
              </div>
              <ExternalLink :size="14" class="pf-social-arrow" />
            </a>
          </div>
        </div>
      </section>

      <!-- ── PROJECTS ───────────────────────────────────────────────────────── -->
      <section id="projects" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// featured_projects</h2>
          <div class="pf-bento" v-if="projects && projects.length > 0">
            <div
              v-for="(project, i) in projects"
              :key="project.id"
              :class="['pf-project-card hover-elevate', i === 0 && 'pf-project-card--featured']"
            >
              <div class="pf-project-header">
                <h3 class="pf-project-name">{{ project.name }}</h3>
                <div class="pf-project-badges">
                  <span :class="['pf-status', STATUS_CLASS[project.status] ?? 'status-arc']">
                    {{ STATUS_LABEL[project.status] ?? project.status }}
                  </span>
                  <a v-if="project.demoUrl" :href="project.demoUrl" target="_blank" rel="noreferrer" class="pf-project-link">
                    <ExternalLink :size="13" />
                  </a>
                </div>
              </div>
              <p v-if="project.description" class="pf-project-desc">{{ project.description }}</p>
              <div class="pf-project-footer">
                <div class="pf-tech-row">
                  <span v-for="t in (project.techStack ?? []).slice(0,5)" :key="t" class="pf-tech-chip pf-tech-chip--sm">{{ t }}</span>
                </div>
                <div class="pf-project-stats">
                  <span v-if="(project.stars ?? 0) > 0"><Star :size="11" />{{ project.stars }}</span>
                  <span v-if="(project.forks ?? 0) > 0"><GitFork :size="11" />{{ project.forks }}</span>
                </div>
              </div>
            </div>

            <!-- Coming soon shimmer cards -->
            <div class="pf-project-card pf-project-card--placeholder">
              <div class="pf-shimmer pf-shimmer--title"></div>
              <div class="pf-shimmer pf-shimmer--body"></div>
              <div class="pf-shimmer pf-shimmer--tags"></div>
              <p class="pf-coming-soon">Coming Soon</p>
            </div>
          </div>

          <!-- No projects fallback -->
          <div v-else class="pf-bento">
            <div class="pf-project-card pf-project-card--featured">
              <div class="pf-project-header">
                <h3 class="pf-project-name">Solar Inverter Gateway App</h3>
                <span class="pf-status status-live">Live</span>
              </div>
              <p class="pf-project-desc">Flutter app for monitoring and controlling solar inverters via Modbus &amp; BLE.</p>
              <div class="pf-tech-row">
                <span v-for="t in ['Flutter','Modbus','BLE','Python']" :key="t" class="pf-tech-chip pf-tech-chip--sm">{{ t }}</span>
              </div>
            </div>
            <div class="pf-project-card">
              <div class="pf-project-header">
                <h3 class="pf-project-name">Energy Dashboard</h3>
                <span class="pf-status status-live">Live</span>
              </div>
              <p class="pf-project-desc">Real-time energy monitoring dashboard with charts and device control.</p>
              <div class="pf-tech-row">
                <span v-for="t in ['Flutter','Firebase','Charts','IoT']" :key="t" class="pf-tech-chip pf-tech-chip--sm">{{ t }}</span>
              </div>
            </div>
            <div class="pf-project-card pf-project-card--placeholder">
              <div class="pf-shimmer pf-shimmer--title"></div>
              <div class="pf-shimmer pf-shimmer--body"></div>
              <p class="pf-coming-soon">Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SKILLS ─────────────────────────────────────────────────────────── -->
      <section id="skills" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// tech_stack</h2>

          <!-- Use profile skills if present, otherwise fallback to static groups -->
          <template v-if="profile?.skills && profile.skills.length > 0">
            <div class="pf-skills-flex">
              <span v-for="s in profile.skills" :key="s" class="pf-skill-chip">{{ s }}</span>
            </div>
          </template>
          <template v-else>
            <div class="pf-skill-groups">
              <div v-for="g in SKILL_GROUPS" :key="g.label" class="pf-skill-group">
                <p class="pf-skill-group-label">{{ g.label }}</p>
                <div class="pf-skills-flex">
                  <span v-for="s in g.skills" :key="s" class="pf-skill-chip">{{ s }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- ── GITHUB ACTIVITY ────────────────────────────────────────────────── -->
      <section v-if="githubPlatform" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// github_activity</h2>
          <div class="pf-github-card">
            <img
              :src="`https://ghchart.rshah.org/${githubPlatform.username}`"
              :alt="`${githubPlatform.username} GitHub contribution chart`"
              loading="lazy"
              class="pf-github-chart"
            />
            <div class="pf-github-footer">
              <span class="pf-github-note">Updated daily via GitHub API</span>
              <a :href="`https://github.com/${githubPlatform.username}`" target="_blank" rel="noopener noreferrer" class="pf-btn pf-btn--ghost pf-btn--sm">
                View Full Profile <ExternalLink :size="12" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ── RECENT ACTIVITY ────────────────────────────────────────────────── -->
      <section v-if="recentActivity && recentActivity.length > 0" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// recent_activity</h2>
          <div class="pf-activity-list">
            <div v-for="item in recentActivity.slice(0, 8)" :key="item.id" class="pf-activity-item">
              <PlatformIcon :platform="item.platform" :size="14" />
              <div class="pf-activity-body">
                <a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer" class="pf-activity-title">{{ item.title }}</a>
                <span v-else class="pf-activity-title">{{ item.title }}</span>
                <span v-if="item.repoName" class="pf-activity-repo">{{ item.repoName }}</span>
              </div>
              <span class="pf-activity-time">{{ formatRelative(item.activityAt) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CONTACT ────────────────────────────────────────────────────────── -->
      <section id="contact" class="pf-section pf-reveal">
        <div class="pf-container">
          <h2 class="pf-section-label">// contact</h2>
          <div class="pf-contact-grid">
            <div class="pf-contact-card">
              <div class="pf-availability">
                <span :class="['pf-avail-badge', profile?.workStatus === 'open' ? 'pf-avail-badge--open' : 'pf-avail-badge--employed']">
                  <span class="pf-pulse-dot" :class="profile?.workStatus === 'open' ? 'pf-pulse-dot--green' : 'pf-pulse-dot--amber'"></span>
                  {{ profile?.workStatus === 'open' ? 'Available for freelance' : 'Currently employed — open to interesting projects' }}
                </span>
              </div>
              <h3 class="pf-contact-heading">Let's build something together</h3>
              <ul class="pf-services">
                <li>Flutter apps (mobile &amp; desktop)</li>
                <li>IoT &amp; BLE device integrations</li>
                <li>Solar energy dashboards</li>
                <li>API integrations &amp; backend</li>
                <li>UI/UX consulting &amp; Figma</li>
              </ul>
              <div class="pf-contact-actions">
                <a v-if="profile?.email" :href="`mailto:${profile.email}`" class="pf-btn pf-btn--primary">
                  <Mail :size="15" /> {{ profile.email }}
                </a>
                <a v-else href="mailto:hello@hafezcode.dev" class="pf-btn pf-btn--primary">
                  <Mail :size="15" /> hello@hafezcode.dev
                </a>
                <a v-if="profile?.websiteUrl" :href="profile.websiteUrl" target="_blank" rel="noreferrer" class="pf-btn pf-btn--ghost">
                  Website <ExternalLink :size="13" />
                </a>
              </div>
            </div>

            <div class="pf-social-mini">
              <a
                v-for="p in connectedPlatforms"
                :key="p.platform"
                :href="p.platform === 'github' ? `https://github.com/${p.username}` : '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="pf-social-mini-item hover-elevate"
              >
                <PlatformIcon :platform="p.platform" :size="18" />
                <span>{{ p.username }}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ── FOOTER ─────────────────────────────────────────────────────────── -->
    <footer class="pf-footer">
      <div class="pf-container pf-footer-inner">
        <p class="pf-footer-credit">Built with Flutter love ❤️ and way too much ☕</p>
        <p class="pf-footer-year">© {{ new Date().getFullYear() }} {{ profile?.fullName ?? "HafezCode" }}</p>
        <RouterLink to="/dashboard" class="pf-footer-dash">Dashboard →</RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────────────────────── */
.portfolio-root {
  --pf-bg:        #0d0d0d;
  --pf-surface:   #161616;
  --pf-border:    rgba(255,255,255,0.08);
  --pf-accent:    #00C896;
  --pf-accent-dim: rgba(0,200,150,0.12);
  --pf-text:      #f0f0f0;
  --pf-muted:     #888;
  --pf-font-display: 'Space Grotesk', 'Inter', sans-serif;
  --pf-font-body:    'Inter', sans-serif;
  --pf-font-code:    'JetBrains Mono', monospace;
  --pf-radius:    10px;
  --pf-radius-sm: 6px;
  --pf-transition: 150ms ease;
}

.theme-light {
  --pf-bg:      #f5f5f5;
  --pf-surface: #ffffff;
  --pf-border:  rgba(0,0,0,0.08);
  --pf-text:    #111;
  --pf-muted:   #666;
}

.portfolio-root {
  background: var(--pf-bg);
  color: var(--pf-text);
  font-family: var(--pf-font-body);
  min-height: 100vh;
  scroll-behavior: smooth;
}

/* ── Layout ────────────────────────────────────────────────────────────────── */
.pf-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.pf-section {
  padding: 80px 0;
}

/* ── Reveal (scroll-driven fade) ───────────────────────────────────────────── */
@supports (animation-timeline: view()) {
  .pf-reveal {
    animation: pf-fade-up linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 30%;
  }
}
@keyframes pf-fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.pf-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--pf-bg) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--pf-border);
}

.pf-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.pf-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-family: var(--pf-font-display);
  font-weight: 700;
  color: var(--pf-text);
  flex-shrink: 0;
}

.pf-logo-symbol { color: var(--pf-accent); font-size: 14px; }
.pf-logo-name   { font-size: 14px; }

.pf-nav {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.pf-nav-link {
  font-size: 13px;
  color: var(--pf-muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: var(--pf-radius-sm);
  transition: color var(--pf-transition), background var(--pf-transition);
}

.pf-nav-link:hover,
.pf-nav-link--active {
  color: var(--pf-text);
  background: var(--pf-border);
}

.pf-nav-link--active { color: var(--pf-accent); }

.pf-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pf-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--pf-radius-sm);
  border: 1px solid var(--pf-border);
  background: transparent;
  color: var(--pf-muted);
  cursor: pointer;
  transition: color var(--pf-transition), border-color var(--pf-transition);
}

.pf-icon-btn:hover { color: var(--pf-text); border-color: rgba(255,255,255,0.2); }

.pf-mobile-menu-btn { display: none; }

.pf-mobile-nav {
  display: none;
  flex-direction: column;
  padding: 12px 24px 16px;
  border-top: 1px solid var(--pf-border);
  gap: 4px;
}

.pf-mobile-nav-link {
  font-size: 15px;
  color: var(--pf-muted);
  text-decoration: none;
  padding: 10px 12px;
  border-radius: var(--pf-radius-sm);
  transition: color var(--pf-transition), background var(--pf-transition);
}

.pf-mobile-nav-link:hover,
.pf-mobile-nav-link--active { color: var(--pf-accent); background: var(--pf-accent-dim); }

@media (max-width: 768px) {
  .pf-nav { display: none; }
  .pf-mobile-menu-btn { display: flex; }
  .pf-mobile-nav { display: flex; }
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
.pf-hero-section {
  padding: 100px 0 80px;
}

.pf-hero {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.pf-avatar {
  flex-shrink: 0;
}

.pf-avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid var(--pf-accent);
  object-fit: cover;
}

.pf-avatar-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid var(--pf-accent);
  background: var(--pf-accent-dim);
  color: var(--pf-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--pf-font-display);
  font-size: 28px;
  font-weight: 700;
}

.pf-hero-text { flex: 1; min-width: 0; }

.pf-hero-eyebrow {
  font-size: 13px;
  color: var(--pf-muted);
  font-family: var(--pf-font-code);
  margin-bottom: 8px;
}

.pf-hero-name {
  font-family: var(--pf-font-display);
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.pf-hero-name-gradient {
  background: linear-gradient(135deg, var(--pf-text) 40%, var(--pf-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  /* animated gradient border effect via outline on wrapping element */
}

.pf-hero-subtitle {
  font-size: clamp(15px, 2vw, 18px);
  color: var(--pf-muted);
  margin-bottom: 16px;
  font-family: var(--pf-font-code);
}

/* typing cursor */
.pf-typing::after {
  content: "|";
  color: var(--pf-accent);
  animation: pf-blink 1s step-end infinite;
}

@keyframes pf-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.pf-hero-bio {
  font-size: 15px;
  color: var(--pf-muted);
  line-height: 1.7;
  max-width: 580px;
  margin-bottom: 20px;
}

.pf-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
}

.pf-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--pf-muted);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--pf-border);
  background: var(--pf-surface);
}

.pf-meta-chip--open     { color: #00C896; border-color: rgba(0,200,150,0.3); background: rgba(0,200,150,0.06); }
.pf-meta-chip--employed { color: #60a5fa; border-color: rgba(96,165,250,0.3); background: rgba(96,165,250,0.06); }

.pf-hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Buttons ───────────────────────────────────────────────────────────────── */
.pf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--pf-radius-sm);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--pf-transition);
  font-family: var(--pf-font-body);
}

.pf-btn--primary {
  background: var(--pf-accent);
  color: #0d0d0d;
  border-color: var(--pf-accent);
}
.pf-btn--primary:hover { opacity: 0.88; }

.pf-btn--ghost {
  background: transparent;
  color: var(--pf-text);
  border-color: var(--pf-border);
}
.pf-btn--ghost:hover { border-color: rgba(255,255,255,0.25); background: var(--pf-surface); }

.pf-btn--sm { padding: 6px 14px; font-size: 13px; }

/* ── Section label ─────────────────────────────────────────────────────────── */
.pf-section-label {
  font-family: var(--pf-font-code);
  font-size: 11px;
  color: var(--pf-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--pf-border);
  padding-bottom: 12px;
  margin-bottom: 24px;
}

/* ── Pulse dot ─────────────────────────────────────────────────────────────── */
.pf-pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pf-muted);
  animation: pf-pulse 2s ease infinite;
}

.pf-pulse-dot--green { background: #00C896; box-shadow: 0 0 0 0 rgba(0,200,150,0.5); }
.pf-pulse-dot--amber { background: #f59e0b; box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }

@keyframes pf-pulse {
  0%   { box-shadow: 0 0 0 0 currentColor; }
  70%  { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.pf-pulse-dot--green { animation: pf-pulse-green 2s ease infinite; }
@keyframes pf-pulse-green {
  0%   { box-shadow: 0 0 0 0 rgba(0,200,150,0.5); }
  70%  { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* ── Position card ─────────────────────────────────────────────────────────── */
.pf-position-card {
  position: relative;
  overflow: hidden;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  padding: 28px;
}

.pf-position-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,200,150,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.pf-position-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pf-position-company {
  font-family: var(--pf-font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--pf-text);
}

.pf-position-role {
  font-size: 14px;
  color: var(--pf-accent);
  margin-top: 2px;
}

.pf-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #00C896;
  border: 1px solid rgba(0,200,150,0.3);
  background: rgba(0,200,150,0.06);
  padding: 5px 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.pf-position-desc {
  font-size: 14px;
  color: var(--pf-muted);
  line-height: 1.7;
  margin-bottom: 20px;
}

.pf-position-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── Tech chips ────────────────────────────────────────────────────────────── */
.pf-tech-chip {
  font-family: var(--pf-font-code);
  font-size: 12px;
  color: var(--pf-accent);
  background: var(--pf-accent-dim);
  border: 1px solid rgba(0,200,150,0.2);
  padding: 4px 10px;
  border-radius: 4px;
}

.pf-tech-chip--sm {
  font-size: 11px;
  color: var(--pf-muted);
  background: transparent;
  border-color: var(--pf-border);
  padding: 2px 8px;
}

.pf-tech-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ── Social cards ──────────────────────────────────────────────────────────── */
.pf-social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.pf-social-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  text-decoration: none;
  color: var(--pf-text);
  transition: border-color var(--pf-transition), transform var(--pf-transition), box-shadow var(--pf-transition);
  position: relative;
}

.pf-social-card:hover {
  border-color: color-mix(in srgb, var(--platform-color) 40%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
}

.pf-social-card-icon { flex-shrink: 0; padding-top: 2px; }

.pf-social-platform { font-weight: 600; font-size: 14px; margin-bottom: 2px; }

.pf-social-username {
  font-family: var(--pf-font-code);
  font-size: 12px;
  color: var(--pf-accent);
  margin-bottom: 4px;
}

.pf-social-desc { font-size: 12px; color: var(--pf-muted); }

.pf-social-arrow {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--pf-muted);
  transition: color var(--pf-transition);
}

.pf-social-card:hover .pf-social-arrow { color: var(--pf-text); }

/* ── Bento grid / Projects ─────────────────────────────────────────────────── */
.pf-bento {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.pf-project-card {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color var(--pf-transition), transform var(--pf-transition), box-shadow var(--pf-transition);
}

.pf-project-card:hover {
  border-color: rgba(0,200,150,0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
}

.pf-project-card--featured { grid-column: 1 / -1; }

.pf-project-card--placeholder {
  position: relative;
  opacity: 0.5;
  pointer-events: none;
}

.pf-project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pf-project-name {
  font-family: var(--pf-font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--pf-text);
}

.pf-project-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pf-project-link {
  color: var(--pf-muted);
  transition: color var(--pf-transition);
}
.pf-project-link:hover { color: var(--pf-text); }

.pf-project-desc {
  font-size: 13px;
  color: var(--pf-muted);
  line-height: 1.65;
  flex: 1;
}

.pf-project-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.pf-project-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--pf-muted);
}

.pf-project-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Status badges ─────────────────────────────────────────────────────────── */
.pf-status {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid;
}

.status-live { color: #4ade80; background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.25); }
.status-wip  { color: #fbbf24; background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.25); }
.status-oss  { color: #60a5fa; background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.25); }
.status-arc  { color: #888;    background: rgba(136,136,136,0.08); border-color: rgba(136,136,136,0.2); }

/* ── Shimmer ───────────────────────────────────────────────────────────────── */
.pf-shimmer {
  border-radius: 4px;
  background: linear-gradient(90deg, var(--pf-border) 25%, rgba(255,255,255,0.12) 50%, var(--pf-border) 75%);
  background-size: 200% 100%;
  animation: pf-shimmer 1.8s infinite;
}

@keyframes pf-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.pf-shimmer--title { height: 18px; width: 60%; margin-bottom: 12px; }
.pf-shimmer--body  { height: 12px; width: 90%; margin-bottom: 8px; }
.pf-shimmer--tags  { height: 12px; width: 40%; }

.pf-coming-soon {
  font-family: var(--pf-font-code);
  font-size: 12px;
  color: var(--pf-muted);
  margin-top: 8px;
  text-align: center;
}

/* ── Skills ────────────────────────────────────────────────────────────────── */
.pf-skill-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pf-skill-group-label {
  font-family: var(--pf-font-code);
  font-size: 11px;
  color: var(--pf-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.pf-skills-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pf-skill-chip {
  font-size: 13px;
  color: var(--pf-text);
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  padding: 6px 14px;
  border-radius: 999px;
  font-family: var(--pf-font-code);
  transition: border-color var(--pf-transition), color var(--pf-transition);
}

.pf-skill-chip:hover {
  border-color: rgba(0,200,150,0.4);
  color: var(--pf-accent);
}

/* ── GitHub activity ───────────────────────────────────────────────────────── */
.pf-github-card {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  padding: 28px;
}

.pf-github-chart {
  width: 100%;
  border-radius: 4px;
  filter: brightness(0.9) contrast(1.1);
  margin-bottom: 16px;
}

.pf-github-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.pf-github-note {
  font-size: 12px;
  color: var(--pf-muted);
  font-family: var(--pf-font-code);
}

/* ── Activity ──────────────────────────────────────────────────────────────── */
.pf-activity-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  overflow: hidden;
}

.pf-activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--pf-border);
  transition: background var(--pf-transition);
}

.pf-activity-item:last-child { border-bottom: none; }
.pf-activity-item:hover { background: rgba(255,255,255,0.03); }

.pf-activity-body { flex: 1; min-width: 0; }

.pf-activity-title {
  font-size: 13px;
  color: var(--pf-text);
  text-decoration: none;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--pf-transition);
}

a.pf-activity-title:hover { color: var(--pf-accent); }

.pf-activity-repo {
  font-size: 11px;
  color: var(--pf-muted);
  font-family: var(--pf-font-code);
}

.pf-activity-time {
  font-size: 11px;
  color: var(--pf-muted);
  font-family: var(--pf-font-code);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Contact ───────────────────────────────────────────────────────────────── */
.pf-contact-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

.pf-contact-card {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  padding: 32px;
}

.pf-availability { margin-bottom: 20px; }

.pf-avail-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid;
}

.pf-avail-badge--open     { color: #00C896; border-color: rgba(0,200,150,0.35); background: rgba(0,200,150,0.07); }
.pf-avail-badge--employed { color: #60a5fa; border-color: rgba(96,165,250,0.35); background: rgba(96,165,250,0.07); }

.pf-contact-heading {
  font-family: var(--pf-font-display);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}

.pf-services {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pf-services li {
  font-size: 14px;
  color: var(--pf-muted);
  padding-left: 20px;
  position: relative;
}

.pf-services li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--pf-accent);
  font-size: 12px;
}

.pf-contact-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pf-social-mini {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pf-social-mini-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--pf-radius-sm);
  text-decoration: none;
  color: var(--pf-muted);
  font-size: 13px;
  font-family: var(--pf-font-code);
  transition: color var(--pf-transition), background var(--pf-transition);
}

.pf-social-mini-item:hover { color: var(--pf-text); background: var(--pf-border); }

/* ── Footer ────────────────────────────────────────────────────────────────── */
.pf-footer {
  border-top: 1px solid var(--pf-border);
  padding: 28px 0;
}

.pf-footer-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.pf-footer-credit { font-size: 13px; color: var(--pf-muted); }
.pf-footer-year   { font-size: 12px; color: var(--pf-muted); font-family: var(--pf-font-code); }

.pf-footer-dash {
  font-size: 12px;
  color: var(--pf-muted);
  text-decoration: none;
  transition: color var(--pf-transition);
}

.pf-footer-dash:hover { color: var(--pf-accent); }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pf-hero { flex-direction: column; gap: 24px; }
  .pf-hero-section { padding: 60px 0 48px; }
  .pf-bento { grid-template-columns: 1fr; }
  .pf-project-card--featured { grid-column: auto; }
  .pf-contact-grid { grid-template-columns: 1fr; }
  .pf-social-mini { display: none; }
  .pf-section { padding: 48px 0; }
}

@media (max-width: 480px) {
  .pf-container { padding: 0 16px; }
  .pf-hero-name { font-size: 28px; }
}
</style>
