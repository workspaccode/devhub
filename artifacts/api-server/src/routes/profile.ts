import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

router.get("/profile", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, DEFAULT_PROFILE_ID))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const p = rows[0];
    res.json({
      id: p.id,
      fullName: p.fullName,
      username: p.username,
      title: p.title,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      location: p.location,
      currentCompany: p.currentCompany,
      currentRole: p.currentRole,
      workStatus: p.workStatus,
      skills: p.skills ?? [],
      email: p.email,
      websiteUrl: p.websiteUrl,
      updatedAt: p.updatedAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const data = parsed.data;
    const existing = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, DEFAULT_PROFILE_ID))
      .limit(1);

    let row;
    if (existing.length === 0) {
      const [created] = await db
        .insert(profilesTable)
        .values({
          id: DEFAULT_PROFILE_ID,
          fullName: data.fullName ?? "Developer",
          ...data,
          updatedAt: new Date(),
        })
        .returning();
      row = created;
    } else {
      const [updated] = await db
        .update(profilesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(profilesTable.id, DEFAULT_PROFILE_ID))
        .returning();
      row = updated;
    }

    res.json({
      id: row.id,
      fullName: row.fullName,
      username: row.username,
      title: row.title,
      bio: row.bio,
      avatarUrl: row.avatarUrl,
      location: row.location,
      currentCompany: row.currentCompany,
      currentRole: row.currentRole,
      workStatus: row.workStatus,
      skills: row.skills ?? [],
      email: row.email,
      websiteUrl: row.websiteUrl,
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
