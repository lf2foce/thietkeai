import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userPlanEnum = pgEnum("user_plan", ["free", "premium"]);
export const generationModeEnum = pgEnum("generation_mode", ["standard", "style-ref"]);
export const generationStatusEnum = pgEnum("generation_status", ["succeeded", "failed"]);
export const costTypeEnum = pgEnum("cost_type", ["quota", "admin"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 256 }).primaryKey(), // Clerk userId
  email: varchar("email", { length: 256 }),
  role: userRoleEnum("role").default("user").notNull(),
  plan: userPlanEnum("plan").default("free").notNull(),
  quotaUsed: integer("quota_used").default(0).notNull(),
  quotaResetAt: timestamp("quota_reset_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  mode: generationModeEnum("mode").notNull(),
  roomType: varchar("room_type", { length: 50 }),
  theme: varchar("theme", { length: 50 }),
  status: generationStatusEnum("status").notNull(),
  costType: costTypeEnum("cost_type").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  userIdx: index("generations_user_idx").on(t.userId),
  createdAtIdx: index("generations_created_at_idx").on(t.createdAt),
}));

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }),
  url: varchar("url", { length: 1024 }).notNull(),
  originalImageId: varchar("original_image_id", { length: 256 }),
  generationId: integer("generation_id"),
  userId: varchar("user_id", { length: 256 }),
  design: varchar("design", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at"),
}, (t) => ({
  userIdx: index("images_user_idx").on(t.userId),
}));

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  userEmail: varchar("user_email", { length: 256 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  rating: integer("rating").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
