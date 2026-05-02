import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const connectedPlatformsTable = pgTable("connected_platforms", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profilesTable.id),
  platform: text("platform").notNull(),
  platformUserId: text("platform_user_id"),
  platformUsername: text("platform_username"),
  platformDisplayName: text("platform_display_name"),
  platformAvatarUrl: text("platform_avatar_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: text("scopes").array(),
  isActive: boolean("is_active").default(true),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const insertConnectedPlatformSchema = createInsertSchema(
  connectedPlatformsTable
).omit({ id: true, connectedAt: true });

export type InsertConnectedPlatform = z.infer<
  typeof insertConnectedPlatformSchema
>;
export type ConnectedPlatform = typeof connectedPlatformsTable.$inferSelect;
