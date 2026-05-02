import { Router } from "express";
import { db, activityFeedTable, connectedPlatformsTable, projectsTable } from "@workspace/db";
import { eq, and, desc, count, gte, sql } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

router.get("/activity", async (req, res) => {
  try {
    const { platform = "all", limit = "50", offset = "0" } = req.query;
    const lim = Math.min(Number(limit), 200);
    const off = Number(offset);

    const conditions = [eq(activityFeedTable.userId, DEFAULT_USER_ID)];
    if (platform !== "all") {
      conditions.push(eq(activityFeedTable.platform, String(platform)));
    }

    const rows = await db
      .select()
      .from(activityFeedTable)
      .where(and(...conditions))
      .orderBy(desc(activityFeedTable.activityAt))
      .limit(lim)
      .offset(off);

    res.json(
      rows.map((a) => ({
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
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity/recent", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(activityFeedTable)
      .where(eq(activityFeedTable.userId, DEFAULT_USER_ID))
      .orderBy(desc(activityFeedTable.activityAt))
      .limit(5);

    res.json(
      rows.map((a) => ({
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
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/summary", async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [projectCount, connectedCount, activityThisWeek, recentActivity] = await Promise.all([
      db.select({ count: count() }).from(projectsTable)
        .where(eq(projectsTable.userId, DEFAULT_USER_ID)),
      db.select({ count: count() }).from(connectedPlatformsTable)
        .where(and(
          eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
          eq(connectedPlatformsTable.isActive, true)
        )),
      db.select({ count: count() }).from(activityFeedTable)
        .where(and(
          eq(activityFeedTable.userId, DEFAULT_USER_ID),
          gte(activityFeedTable.activityAt, weekAgo)
        )),
      db.select()
        .from(activityFeedTable)
        .where(eq(activityFeedTable.userId, DEFAULT_USER_ID))
        .orderBy(desc(activityFeedTable.activityAt))
        .limit(1),
    ]);

    res.json({
      totalRepos: 0,
      openIssues: 0,
      openPullRequests: 0,
      totalProjects: Number(projectCount[0]?.count ?? 0),
      connectedPlatforms: Number(connectedCount[0]?.count ?? 0),
      lastActivityAt: recentActivity[0]?.activityAt ?? null,
      activityThisWeek: Number(activityThisWeek[0]?.count ?? 0),
      contributionStreak: 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
