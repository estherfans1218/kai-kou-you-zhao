import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "../../../db";
import { communityComments, communityInteractions } from "../../../db/schema";
import {
  deleteNetlifyInteraction,
  getNetlifyInteraction,
  isNetlifyRuntime,
  listNetlifyComments,
  listNetlifyInteractions,
  saveNetlifyComment,
  saveNetlifyInteraction,
} from "../../lib/netlify-store";
import {
  deleteVercelInteraction,
  getVercelInteraction,
  isVercelRuntime,
  listVercelComments,
  listVercelInteractions,
  saveVercelComment,
  saveVercelInteraction,
} from "../../lib/vercel-store";

export async function GET(request: Request) {
  try {
    const visitorId = new URL(request.url).searchParams.get("visitorId") ?? "";
    if (isNetlifyRuntime()) {
      const interactions = await listNetlifyInteractions();
      const countMap = new Map<string, { contentId: string; kind: "like" | "save"; count: number }>();
      for (const item of interactions) {
        const key = `${item.contentId}:${item.kind}`;
        const current = countMap.get(key);
        countMap.set(key, { contentId: item.contentId, kind: item.kind, count: (current?.count ?? 0) + 1 });
      }
      const mine = interactions
        .filter((item) => item.visitorId === visitorId)
        .map(({ contentId, kind }) => ({ contentId, kind }));
      const comments = (await listNetlifyComments())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 120);
      return Response.json({ counts: [...countMap.values()], mine, comments });
    }
    if (isVercelRuntime()) {
      const interactions = await listVercelInteractions();
      const countMap = new Map<string, { contentId: string; kind: "like" | "save"; count: number }>();
      for (const item of interactions) {
        const key = `${item.contentId}:${item.kind}`;
        const current = countMap.get(key);
        countMap.set(key, { contentId: item.contentId, kind: item.kind, count: (current?.count ?? 0) + 1 });
      }
      const mine = interactions.filter((item) => item.visitorId === visitorId).map(({ contentId, kind }) => ({ contentId, kind }));
      const comments = (await listVercelComments()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 120);
      return Response.json({ counts: [...countMap.values()], mine, comments });
    }
    const db = await getDb();
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
    if (isNetlifyRuntime()) {
      if (payload.action === "comment") {
        const body = payload.body?.trim() ?? "";
        if (body.length < 2 || body.length > 240) return Response.json({ error: "评论请控制在 2—240 字" }, { status: 400 });
        const comment = { id: crypto.randomUUID(), contentId, visitorId, body, createdAt: Date.now() };
        await saveNetlifyComment(comment);
        return Response.json({ comment }, { status: 201 });
      }

      const kind = payload.action === "toggle-save" ? "save" as const : "like" as const;
      const existing = await getNetlifyInteraction(contentId, visitorId, kind);
      if (existing) {
        await deleteNetlifyInteraction(contentId, visitorId, kind);
        return Response.json({ active: false, kind });
      }
      await saveNetlifyInteraction({ contentId, visitorId, kind, createdAt: Date.now() });
      return Response.json({ active: true, kind }, { status: 201 });
    }
    if (isVercelRuntime()) {
      if (payload.action === "comment") {
        const body = payload.body?.trim() ?? "";
        if (body.length < 2 || body.length > 240) return Response.json({ error: "评论请控制在 2—240 字" }, { status: 400 });
        const comment = { id: crypto.randomUUID(), contentId, visitorId, body, createdAt: Date.now() };
        await saveVercelComment(comment);
        return Response.json({ comment }, { status: 201 });
      }
      const kind = payload.action === "toggle-save" ? "save" as const : "like" as const;
      const existing = await getVercelInteraction(contentId, visitorId, kind);
      if (existing) {
        await deleteVercelInteraction(contentId, visitorId, kind);
        return Response.json({ active: false, kind });
      }
      await saveVercelInteraction({ contentId, visitorId, kind, createdAt: Date.now() });
      return Response.json({ active: true, kind }, { status: 201 });
    }

    const db = await getDb();

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
