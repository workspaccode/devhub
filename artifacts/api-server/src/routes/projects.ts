import { Router } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateProjectBody } from "@workspace/api-zod";

const router = Router();
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

router.get("/projects", async (req, res) => {
  try {
    const { featured } = req.query;
    const conditions = [eq(projectsTable.userId, DEFAULT_USER_ID)];

    if (featured === "true") conditions.push(eq(projectsTable.isFeatured, true));

    const rows = await db
      .select()
      .from(projectsTable)
      .where(and(...conditions))
      .orderBy(projectsTable.sortOrder, projectsTable.createdAt);

    res.json(rows.map(mapProject));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const parsed = CreateProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const data = parsed.data;
    let stars = 0, forks = 0, language: string | null = null;

    if (data.githubRepo) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${data.githubRepo}`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (ghRes.ok) {
          const repo: any = await ghRes.json();
          stars = repo.stargazers_count ?? 0;
          forks = repo.forks_count ?? 0;
          language = repo.language ?? null;
        }
      } catch {}
    }

    const [row] = await db
      .insert(projectsTable)
      .values({
        userId: DEFAULT_USER_ID,
        name: data.name,
        description: data.description ?? null,
        techStack: data.techStack ?? [],
        status: data.status,
        githubRepo: data.githubRepo ?? null,
        demoUrl: data.demoUrl ?? null,
        coverImage: data.coverImage ?? null,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
        stars,
        forks,
        language,
      })
      .returning();

    res.status(201).json(mapProject(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, req.params.id), eq(projectsTable.userId, DEFAULT_USER_ID)))
      .limit(1);

    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapProject(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const parsed = CreateProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const data = parsed.data;
    let stars: number | undefined, forks: number | undefined, language: string | null | undefined;

    if (data.githubRepo) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${data.githubRepo}`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (ghRes.ok) {
          const repo: any = await ghRes.json();
          stars = repo.stargazers_count;
          forks = repo.forks_count;
          language = repo.language ?? null;
        }
      } catch {}
    }

    const [row] = await db
      .update(projectsTable)
      .set({
        name: data.name,
        description: data.description ?? null,
        techStack: data.techStack ?? [],
        status: data.status,
        githubRepo: data.githubRepo ?? null,
        demoUrl: data.demoUrl ?? null,
        coverImage: data.coverImage ?? null,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
        ...(stars !== undefined && { stars }),
        ...(forks !== undefined && { forks }),
        ...(language !== undefined && { language }),
      })
      .where(and(eq(projectsTable.id, req.params.id), eq(projectsTable.userId, DEFAULT_USER_ID)))
      .returning();

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapProject(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await db.delete(projectsTable).where(
      and(eq(projectsTable.id, req.params.id), eq(projectsTable.userId, DEFAULT_USER_ID))
    );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function mapProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    techStack: p.techStack ?? [],
    status: p.status,
    githubRepo: p.githubRepo,
    demoUrl: p.demoUrl,
    coverImage: p.coverImage,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    stars: p.stars,
    forks: p.forks,
    language: p.language,
    createdAt: p.createdAt,
  };
}

export default router;
