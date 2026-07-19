import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "../../../db";
import { communityComments, communityInteractions } from "../../../db/schema";

export async function GET(request: Request) {
  try {
    const visitorId = new URL(request.url).searchParams.get("visitorId") ?? "";
    const db = getDb();
    const counts = await db
      .select({ contentId: communityInteractions.contentId, kind: communityInteractions.kind, count: sql<number>`count(*)` })
      .from(communityInteractions)
      .groupBy(communityInteractions.contentId, communityInteractions.kind);
    const mine = visitorId
      ? await db.select({ contentId: communityInteractions.contentId, kind: communityInteractions.kind }).from(communityInteractions).where(eq(communityInteractions.visitorId, visitorId))
      : [];
    const comments = await db.select().from(communityComments).orderBy(desc(communityComments.createdAt)).limit(120);
    return Response.json({ counts, mine, comments });
  } catch {
    return Response.json({ counts: [], mine: [], comments: [] });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { action?: string; contentId?: string; visitorId?: string; body?: string };
    const contentId = payload.contentId?.trim() ?? "";
    const visitorId = payload.visitorId?.trim() ?? "";
    if (!contentId || !visitorId) return Response.json({ error: "缺少互动信息" }, { status: 400 });
    const db = getDb();

    if (payload.action === "comment") {
      const body = payload.body?.trim() ?? "";
      if (body.length < 2 || body.length > 240) return Response.json({ error: "评论请控制在 2—240 字" }, { status: 400 });
      const [comment] = await db.insert(communityComments).values({ contentId, visitorId, body }).returning();
      return Response.json({ comment }, { status: 201 });
    }

    const kind = payload.action === "toggle-save" ? "save" : "like";
    const condition = and(eq(communityInteractions.contentId, contentId), eq(communityInteractions.visitorId, visitorId), eq(communityInteractions.kind, kind));
    const existing = await db.select().from(communityInteractions).where(condition).limit(1);
    if (existing.length) {
      await db.delete(communityInteractions).where(condition);
      return Response.json({ active: false, kind });
    }
    await db.insert(communityInteractions).values({ contentId, visitorId, kind });
    return Response.json({ active: true, kind }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "操作失败" }, { status: 500 });
  }
}
