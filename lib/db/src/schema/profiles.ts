import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  username: text("username").unique(),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  currentCompany: text("current_company"),
  currentRole: text("current_role"),
  workStatus: text("work_status").default("employed"),
  skills: text("skills").array(),
  email: text("email"),
  websiteUrl: text("website_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
