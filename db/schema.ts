import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const caseSubmissions = sqliteTable("case_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scene: text("scene").notNull(),
  response: text("response").notNull().default(""),
  outcome: text("outcome").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
