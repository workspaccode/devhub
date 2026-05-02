import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const activityFeedTable = pgTable("activity_feed", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profilesTable.id),
  platform: text("platform").notNull(),
  activityType: text("activity_type"),
  title: text("title"),
  description: text("description"),
  url: text("url"),
  repoName: text("repo_name"),
  repoUrl: text("repo_url"),
  metadata: jsonb("metadata"),
  activityAt: timestamp("activity_at"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityFeedTable).omit({
  id: true,
  syncedAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityFeedTable.$inferSelect;
