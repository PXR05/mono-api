import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isOnline: integer("is_online", { mode: "boolean" }).default(false),
  role: text("role").default("User").notNull(),
  refreshToken: text("refresh_token"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const files = sqliteTable("files", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  section: text("section").notNull(),
  sectionId: text("section_id").notNull(),
  text: text("text").notNull(),
  metadata: text("metadata"),
  raw: text("raw"),
  default: text("default"),
  type: text("type").default("text/markdown"),
  public: integer("public", { mode: "boolean" }).default(false),
});

export const sections = sqliteTable("sections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  public: integer("public", { mode: "boolean" }).default(false),
});

export const backups = sqliteTable("backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  data: text("data", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const keys = sqliteTable("keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
