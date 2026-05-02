import { Router } from "express";
import { db, connectedPlatformsTable, activityFeedTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

async function getGitHubToken(): Promise<{ token: string; username: string } | null> {
  const rows = await db
    .select()
    .from(connectedPlatformsTable)
    .where(
      and(
        eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
        eq(connectedPlatformsTable.platform, "github"),
        eq(connectedPlatformsTable.isActive, true)
      )
    )
    .limit(1);

  if (!rows[0]?.accessToken) return null;
  return { token: rows[0].accessToken, username: rows[0].platformUsername ?? "" };
}

router.get("/github/repos", async (req, res) => {
  try {
    const creds = await getGitHubToken();
    if (!creds) {
      res.json([]);
      return;
    }

    const { type = "all", sort = "updated" } = req.query;
    const ghRes = await fetch(
      `https://api.github.com/user/repos?type=${type}&sort=${sort}&per_page=50`,
      { headers: { Authorization: `token ${creds.token}`, Accept: "application/vnd.github.v3+json" } }
    );

    if (!ghRes.ok) {
      res.json([]);
      return;
    }

    const repos: any[] = await ghRes.json();
    res.json(
      repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        private: r.private,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        openIssuesCount: r.open_issues_count,
        pushedAt: r.pushed_at,
        updatedAt: r.updated_at,
        topics: r.topics ?? [],
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/github/repos/:owner/:repo/issues", async (req, res) => {
  try {
    const creds = await getGitHubToken();
    if (!creds) {
      res.json([]);
      return;
    }

    const { owner, repo } = req.params;
    const { state = "open", labels, assignee } = req.query;

    let url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=50`;
    if (labels) url += `&labels=${labels}`;
    if (assignee) url += `&assignee=${assignee}`;

    const ghRes = await fetch(url, {
      headers: { Authorization: `token ${creds.token}`, Accept: "application/vnd.github.v3+json" },
    });

    if (!ghRes.ok) {
      res.json([]);
      return;
    }

    const issues: any[] = await ghRes.json();
    res.json(mapIssues(issues, `${owner}/${repo}`));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/github/issues", async (req, res) => {
  try {
    const creds = await getGitHubToken();
    if (!creds) {
      res.json([]);
      return;
    }

    const { state = "open", filter = "assigned" } = req.query;
    const ghRes = await fetch(
      `https://api.github.com/issues?state=${state}&filter=${filter}&per_page=50`,
      { headers: { Authorization: `token ${creds.token}`, Accept: "application/vnd.github.v3+json" } }
    );

    if (!ghRes.ok) {
      res.json([]);
      return;
    }

    const issues: any[] = await ghRes.json();
    res.json(mapIssues(issues));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function mapIssues(issues: any[], defaultRepo?: string) {
  return issues.map((i) => ({
    id: i.id,
    number: i.number,
    title: i.title,
    body: i.body,
    state: i.state,
    url: i.html_url,
    repoName: i.repository?.name ?? defaultRepo?.split("/")[1],
    repoFullName: i.repository?.full_name ?? defaultRepo,
    labels: (i.labels ?? []).map((l: any) => ({ name: l.name, color: l.color, description: l.description })),
    assignees: (i.assignees ?? []).map((a: any) => a.login),
    author: i.user?.login,
    authorAvatarUrl: i.user?.avatar_url,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
    closedAt: i.closed_at,
    commentsCount: i.comments,
    isPullRequest: !!i.pull_request,
  }));
}

router.get("/github/activity", async (req, res) => {
  try {
    const creds = await getGitHubToken();
    if (!creds) {
      res.json([]);
      return;
    }

    const limit = Number(req.query.limit) || 30;
    const ghRes = await fetch(
      `https://api.github.com/users/${creds.username}/events?per_page=${Math.min(limit, 100)}`,
      { headers: { Authorization: `token ${creds.token}`, Accept: "application/vnd.github.v3+json" } }
    );

    if (!ghRes.ok) {
      // Fallback to cached
      const cached = await db
        .select()
        .from(activityFeedTable)
        .where(and(eq(activityFeedTable.userId, DEFAULT_USER_ID), eq(activityFeedTable.platform, "github")))
        .orderBy(desc(activityFeedTable.activityAt))
        .limit(limit);
      res.json(cached.map(mapDbActivity));
      return;
    }

    const events: any[] = await ghRes.json();
    res.json(
      events.map((e) => ({
        id: e.id,
        platform: "github",
        type: e.type,
        title: getGitHubEventTitle(e),
        url: `https://github.com/${e.repo?.name}`,
        repoName: e.repo?.name,
        repoUrl: `https://github.com/${e.repo?.name}`,
        activityAt: e.created_at,
        metadata: e.payload,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/github/contributions", async (req, res) => {
  try {
    const creds = await getGitHubToken();
    const username = creds?.username ?? "ghost";

    const contribRes = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
    );

    if (!contribRes.ok) {
      res.json({ username, totalContributions: 0, weeks: [] });
      return;
    }

    const data: any = await contribRes.json();
    res.json({
      username: data.total ? username : username,
      totalContributions: data.total?.lastYear ?? data.total ?? 0,
      weeks: (data.contributions ?? []).reduce((acc: any[], day: any, i: number) => {
        const weekIndex = Math.floor(i / 7);
        if (!acc[weekIndex]) acc[weekIndex] = { days: [] };
        acc[weekIndex].days.push({
          date: day.date,
          count: day.count,
          level: day.level,
        });
        return acc;
      }, []),
    });
  } catch (err) {
    req.log.error(err);
    res.json({ username: "unknown", totalContributions: 0, weeks: [] });
  }
});

function mapDbActivity(a: any) {
  return {
    id: a.id,
    platform: a.platform,
    type: a.activityType,
    title: a.title,
    description: a.description,
    url: a.url,
    repoName: a.repoName,
    repoUrl: a.repoUrl,
    activityAt: a.activityAt,
    metadata: a.metadata,
  };
}

function getGitHubEventTitle(event: any): string {
  switch (event.type) {
    case "PushEvent": return `Pushed ${event.payload?.commits?.length ?? 1} commit(s) to ${event.repo?.name}`;
    case "PullRequestEvent": return `${event.payload?.action} PR: ${event.payload?.pull_request?.title ?? event.repo?.name}`;
    case "IssuesEvent": return `${event.payload?.action} issue: ${event.payload?.issue?.title ?? event.repo?.name}`;
    case "CreateEvent": return `Created ${event.payload?.ref_type} ${event.payload?.ref ?? ""} in ${event.repo?.name}`;
    case "WatchEvent": return `Starred ${event.repo?.name}`;
    case "ForkEvent": return `Forked ${event.repo?.name}`;
    case "IssueCommentEvent": return `Commented on issue in ${event.repo?.name}`;
    default: return `${event.type} on ${event.repo?.name}`;
  }
}

export default router;
