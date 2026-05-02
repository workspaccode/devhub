import { Router } from "express";
import { db, connectedPlatformsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

async function getGitLabToken(): Promise<string | null> {
  const rows = await db
    .select()
    .from(connectedPlatformsTable)
    .where(
      and(
        eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
        eq(connectedPlatformsTable.platform, "gitlab"),
        eq(connectedPlatformsTable.isActive, true)
      )
    )
    .limit(1);
  return rows[0]?.accessToken ?? null;
}

router.get("/gitlab/projects", async (req, res) => {
  try {
    const token = await getGitLabToken();
    if (!token) { res.json([]); return; }

    const membership = req.query.membership !== "false";
    const glRes = await fetch(
      `https://gitlab.com/api/v4/projects?membership=${membership}&per_page=50&order_by=last_activity_at`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!glRes.ok) { res.json([]); return; }

    const projects: any[] = await glRes.json();
    res.json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        nameWithNamespace: p.name_with_namespace,
        description: p.description,
        webUrl: p.web_url,
        stars: p.star_count,
        forks: p.forks_count,
        openIssuesCount: p.open_issues_count,
        visibility: p.visibility,
        language: p.predominant_language ?? null,
        lastActivityAt: p.last_activity_at,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gitlab/merge-requests", async (req, res) => {
  try {
    const token = await getGitLabToken();
    if (!token) { res.json([]); return; }

    const { state = "opened", scope = "assigned_to_me" } = req.query;
    const glRes = await fetch(
      `https://gitlab.com/api/v4/merge_requests?state=${state}&scope=${scope}&per_page=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!glRes.ok) { res.json([]); return; }

    const mrs: any[] = await glRes.json();
    res.json(
      mrs.map((mr) => ({
        id: mr.id,
        iid: mr.iid,
        title: mr.title,
        description: mr.description,
        state: mr.state,
        webUrl: mr.web_url,
        projectName: mr.references?.full?.split("!")[0] ?? String(mr.project_id),
        author: mr.author?.username,
        assignees: (mr.assignees ?? []).map((a: any) => a.username),
        labels: mr.labels ?? [],
        createdAt: mr.created_at,
        updatedAt: mr.updated_at,
        sourceBranch: mr.source_branch,
        targetBranch: mr.target_branch,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/gitlab/activity", async (req, res) => {
  try {
    const token = await getGitLabToken();
    if (!token) { res.json([]); return; }

    const glRes = await fetch(
      "https://gitlab.com/api/v4/events?per_page=30",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!glRes.ok) { res.json([]); return; }

    const events: any[] = await glRes.json();
    res.json(
      events.map((e) => ({
        id: String(e.id),
        platform: "gitlab",
        type: e.action_name,
        title: `${e.action_name} ${e.target_type ?? ""} ${e.target_title ?? ""}`.trim(),
        url: e.target_iid ? `https://gitlab.com/${e.author?.username}` : undefined,
        activityAt: e.created_at,
        metadata: e,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
