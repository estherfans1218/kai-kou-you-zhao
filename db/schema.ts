import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const caseSubmissions = sqliteTable("case_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull().default("help"),
  title: text("title").notNull().default("匿名发布的真实情境"),
  relation: text("relation").notNull().default("其他"),
  goal: text("goal").notNull().default("想听听大家怎么说"),
  scene: text("scene").notNull(),
  response: text("response").notNull().default(""),
  outcome: text("outcome").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  sourceText: text("source_text").notNull().default(""),
  imageKey: text("image_key").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const communityInteractions = sqliteTable("community_interactions", {
  contentId: text("content_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  kind: text("kind").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [primaryKey({ columns: [table.contentId, table.visitorId, table.kind] })]);

export const communityComments = sqliteTable("community_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: text("content_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
