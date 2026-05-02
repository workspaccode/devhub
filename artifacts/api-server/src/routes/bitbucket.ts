import { Router } from "express";
import { db, connectedPlatformsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

async function getBitbucketToken(): Promise<string | null> {
  const rows = await db
    .select()
    .from(connectedPlatformsTable)
    .where(
      and(
        eq(connectedPlatformsTable.userId, DEFAULT_USER_ID),
        eq(connectedPlatformsTable.platform, "bitbucket"),
        eq(connectedPlatformsTable.isActive, true)
      )
    )
    .limit(1);
  return rows[0]?.accessToken ?? null;
}

router.get("/bitbucket/repos", async (req, res) => {
  try {
    const token = await getBitbucketToken();
    if (!token) { res.json([]); return; }

    const bbRes = await fetch(
      "https://api.bitbucket.org/2.0/repositories?role=member&pagelen=50",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!bbRes.ok) { res.json([]); return; }

    const data: any = await bbRes.json();
    const repos = data.values ?? [];

    res.json(
      repos.map((r: any) => ({
        uuid: r.uuid,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        webUrl: r.links?.html?.href,
        isPrivate: r.is_private,
        language: r.language || null,
        size: r.size,
        updatedOn: r.updated_on,
        mainBranch: r.mainbranch?.name ?? "main",
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bitbucket/pull-requests", async (req, res) => {
  try {
    const token = await getBitbucketToken();
    if (!token) { res.json([]); return; }

    const { state = "OPEN", role = "author" } = req.query;
    const bbRes = await fetch(
      `https://api.bitbucket.org/2.0/pullrequests?state=${state}&role=${role}&pagelen=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!bbRes.ok) { res.json([]); return; }

    const data: any = await bbRes.json();
    const prs = data.values ?? [];

    res.json(
      prs.map((pr: any) => ({
        id: pr.id,
        title: pr.title,
        description: pr.description,
        state: pr.state,
        webUrl: pr.links?.html?.href,
        repoFullName: pr.destination?.repository?.full_name,
        author: pr.author?.display_name,
        reviewers: (pr.reviewers ?? []).map((r: any) => r.display_name),
        sourceBranch: pr.source?.branch?.name,
        destinationBranch: pr.destination?.branch?.name,
        createdOn: pr.created_on,
        updatedOn: pr.updated_on,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bitbucket/activity", async (req, res) => {
  try {
    const token = await getBitbucketToken();
    if (!token) { res.json([]); return; }

    // Bitbucket doesn't have a single activity feed — return empty
    res.json([]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
