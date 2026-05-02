import { Router } from "express";
import { db, connectedPlatformsTable, activityFeedTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { ConnectPlatformBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
const PLATFORMS = ["github", "gitlab", "bitbucket", "slack", "zoho"] as const;

async function getPlatformStatus(platform: string) {
  const rows = await db
    .select()
    .from(connectedPlatformsTable)
    .where(
      and(
        eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
        eq(connectedPlatformsTable.platform, platform),
        eq(connectedPlatformsTable.isActive, true)
      )
    )
    .limit(1);

  const activityRows = await db
    .select({ count: count() })
    .from(activityFeedTable)
    .where(
      and(
        eq(activityFeedTable.userId, DEFAULT_USER_ID),
        eq(activityFeedTable.platform, platform)
      )
    );

  const conn = rows[0];
  const activityCount = Number(activityRows[0]?.count ?? 0);

  if (!conn) {
    return { platform, isConnected: false, activityCount };
  }

  return {
    platform: conn.platform,
    isConnected: true,
    username: conn.platformUsername,
    displayName: conn.platformDisplayName,
    avatarUrl: conn.platformAvatarUrl,
    connectedAt: conn.connectedAt,
    lastSyncedAt: conn.lastSyncedAt,
    tokenExpiresAt: conn.tokenExpiresAt,
    scopes: conn.scopes ?? [],
    activityCount,
  };
}

router.get("/platforms", async (req, res) => {
  try {
    const results = await Promise.all(PLATFORMS.map(getPlatformStatus));
    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/platforms/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    const result = await getPlatformStatus(platform);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/platforms/:platform/connect", async (req, res) => {
  try {
    const { platform } = req.params;
    const parsed = ConnectPlatformBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const data = parsed.data;

    const existing = await db
      .select()
      .from(connectedPlatformsTable)
      .where(
        and(
          eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
          eq(connectedPlatformsTable.platform, platform)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(connectedPlatformsTable)
        .set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          platformUsername: data.username ?? null,
          platformDisplayName: data.displayName ?? null,
          platformAvatarUrl: data.avatarUrl ?? null,
          scopes: data.scopes ?? [],
          tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
          isActive: true,
        })
        .where(
          and(
            eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
            eq(connectedPlatformsTable.platform, platform)
          )
        );
    } else {
      await db.insert(connectedPlatformsTable).values({
        userId: DEFAULT_USER_ID,
        platform,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        platformUsername: data.username ?? null,
        platformDisplayName: data.displayName ?? null,
        platformAvatarUrl: data.avatarUrl ?? null,
        scopes: data.scopes ?? [],
        tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
        isActive: true,
      });
    }

    const result = await getPlatformStatus(platform);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/platforms/:platform", async (req, res) => {
  try {
    const { platform } = req.params;
    await db
      .update(connectedPlatformsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
          eq(connectedPlatformsTable.platform, platform)
        )
      );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/platforms/:platform/sync", async (req, res) => {
  try {
    const { platform } = req.params;

    const rows = await db
      .select()
      .from(connectedPlatformsTable)
      .where(
        and(
          eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
          eq(connectedPlatformsTable.platform, platform),
          eq(connectedPlatformsTable.isActive, true)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Platform not connected" });
      return;
    }

    const conn = rows[0];
    let itemsSynced = 0;

    if (platform === "github" && conn.accessToken) {
      itemsSynced = await syncGitHub(conn.accessToken, conn.platformUsername);
    } else if (platform === "gitlab" && conn.accessToken) {
      itemsSynced = await syncGitLab(conn.accessToken);
    } else if (platform === "bitbucket" && conn.accessToken) {
      itemsSynced = await syncBitbucket(conn.accessToken);
    } else if (platform === "slack" && conn.accessToken) {
      itemsSynced = await syncSlack(conn.accessToken);
    }

    await db
      .update(connectedPlatformsTable)
      .set({ lastSyncedAt: new Date() })
      .where(
        and(
          eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
          eq(connectedPlatformsTable.platform, platform)
        )
      );

    res.json({ platform, itemsSynced, syncedAt: new Date() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function syncGitHub(token: string, username: string | null | undefined): Promise<number> {
  try {
    const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" };

    const uname = username ?? "me";
    const eventsRes = await fetch(`https://api.github.com/users/${uname}/events?per_page=30`, { headers });
    if (!eventsRes.ok) return 0;

    const events: any[] = await eventsRes.json();

    for (const event of events.slice(0, 30)) {
      const title = getGitHubEventTitle(event);
      await db.insert(activityFeedTable).values({
        userId: DEFAULT_USER_ID,
        platform: "github",
        activityType: event.type,
        title,
        url: event.payload?.html_url ?? `https://github.com/${event.repo?.name}`,
        repoName: event.repo?.name,
        repoUrl: `https://github.com/${event.repo?.name}`,
        activityAt: new Date(event.created_at),
        metadata: event.payload,
      }).onConflictDoNothing();
    }

    return events.length;
  } catch {
    return 0;
  }
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

async function syncGitLab(token: string): Promise<number> {
  try {
    const res = await fetch("https://gitlab.com/api/v4/events?per_page=30", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const events: any[] = await res.json();

    for (const event of events) {
      await db.insert(activityFeedTable).values({
        userId: DEFAULT_USER_ID,
        platform: "gitlab",
        activityType: event.action_name,
        title: `${event.action_name} ${event.target_type ?? ""} in ${event.project_id}`,
        activityAt: new Date(event.created_at),
        metadata: event,
      }).onConflictDoNothing();
    }
    return events.length;
  } catch {
    return 0;
  }
}

async function syncBitbucket(token: string): Promise<number> {
  try {
    const res = await fetch("https://api.bitbucket.org/2.0/user/permissions/repositories?pagelen=30", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    return 0;
  } catch {
    return 0;
  }
}

async function syncSlack(token: string): Promise<number> {
  try {
    const res = await fetch("https://slack.com/api/conversations.history?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 0;
    const data: any = await res.json();
    if (!data.ok) return 0;

    const messages = data.messages ?? [];
    for (const msg of messages) {
      await db.insert(activityFeedTable).values({
        userId: DEFAULT_USER_ID,
        platform: "slack",
        activityType: "message",
        title: msg.text?.slice(0, 100) ?? "Slack message",
        activityAt: new Date(Number(msg.ts) * 1000),
        metadata: msg,
      }).onConflictDoNothing();
    }
    return messages.length;
  } catch {
    return 0;
  }
}

export default router;
