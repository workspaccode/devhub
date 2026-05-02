import { Router } from "express";
import { db, connectedPlatformsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

async function getSlackToken(): Promise<string | null> {
  const rows = await db
    .select()
    .from(connectedPlatformsTable)
    .where(
      and(
        eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
        eq(connectedPlatformsTable.platform, "slack"),
        eq(connectedPlatformsTable.isActive, true)
      )
    )
    .limit(1);
  return rows[0]?.accessToken ?? null;
}

async function slackApi(path: string, token: string) {
  const res = await fetch(`https://slack.com/api/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<any>;
}

router.get("/slack/workspaces", async (req, res) => {
  try {
    const token = await getSlackToken();
    if (!token) { res.json([]); return; }

    const data = await slackApi("team.info", token);
    if (!data.ok) { res.json([]); return; }

    res.json([{
      id: data.team?.id,
      name: data.team?.name,
      domain: data.team?.domain,
      iconUrl: data.team?.icon?.image_88,
      memberCount: null,
    }]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/slack/channels", async (req, res) => {
  try {
    const token = await getSlackToken();
    if (!token) { res.json([]); return; }

    const data = await slackApi("conversations.list?types=public_channel,private_channel&limit=100&exclude_archived=true", token);
    if (!data.ok) { res.json([]); return; }

    const channels = data.channels ?? [];
    res.json(
      channels.map((c: any) => ({
        id: c.id,
        name: c.name,
        topic: c.topic?.value ?? null,
        memberCount: c.num_members,
        isPrivate: c.is_private,
        isMember: c.is_member,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/slack/activity", async (req, res) => {
  try {
    const token = await getSlackToken();
    if (!token) { res.json([]); return; }

    const limit = Number(req.query.limit) || 20;

    const channelsData = await slackApi("conversations.list?types=public_channel&limit=5&exclude_archived=true", token);
    if (!channelsData.ok) { res.json([]); return; }

    const firstChannel = channelsData.channels?.find((c: any) => c.is_member);
    if (!firstChannel) { res.json([]); return; }

    const historyData = await slackApi(
      `conversations.history?channel=${firstChannel.id}&limit=${limit}`,
      token
    );

    if (!historyData.ok) { res.json([]); return; }

    const messages = historyData.messages ?? [];
    res.json(
      messages.map((m: any) => ({
        id: m.ts,
        platform: "slack",
        type: "message",
        title: m.text?.slice(0, 120) ?? "Message",
        description: m.text,
        url: null,
        repoName: `#${firstChannel.name}`,
        activityAt: new Date(Number(m.ts) * 1000),
        metadata: { channel: firstChannel.name, channelId: firstChannel.id },
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
