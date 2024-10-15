// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  pgTable, integer, text
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `t3gallery_${name}`);

export const images = createTable(
  "image",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    url: varchar("url", { length: 1024 }).notNull(),
    originalImageId: varchar("originalImageId", { length: 256 }), //.notNull(),
    userId: varchar("userId", { length: 256 }),//.notNull(),
    design: varchar("design", { length: 50 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt"),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);


export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  rating: integer('rating').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})