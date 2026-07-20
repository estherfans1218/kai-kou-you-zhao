import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../../../db";
import { caseSubmissions, communityComments, communityInteractions } from "../../../db/schema";
import { generateCaseTitle, generateHelpReplies } from "../../lib/deepseek";
import {
  deleteNetlifyCommentsForContent,
  deleteNetlifyImage,
  deleteNetlifyInteractionsForContent,
  deleteNetlifySubmission,
  isNetlifyRuntime,
  listNetlifySubmissions,
  saveNetlifySubmission,
  type NetlifySubmission,
} from "../../lib/netlify-store";

const MAX_SCENE_LENGTH = 1200;
const MAX_FIELD_LENGTH = 600;
const MAX_SOURCE_LENGTH = 8000;

const publicPostFields = {
  id: caseSubmissions.id,
  kind: caseSubmissions.kind,
  title: caseSubmissions.title,
  relation: caseSubmissions.relation,
  goal: caseSubmissions.goal,
  scene: caseSubmissions.scene,
  response: caseSubmissions.response,
  outcome: caseSubmissions.outcome,
  imageKey: caseSubmissions.imageKey,
  status: caseSubmissions.status,
  createdAt: caseSubmissions.createdAt,
};

function validVisitorId(value: string) {
  return value.length >= 16 && value.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mine = url.searchParams.get("mine") === "1";
    const visitorId = url.searchParams.get("visitorId")?.trim() ?? "";
    if (mine && !validVisitorId(visitorId)) return Response.json({ posts: [] });
    if (isNetlifyRuntime()) {
      const posts = (await listNetlifySubmissions())
        .filter((post) => post.status === "published" && (!mine || post.ownerToken === visitorId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, mine ? 60 : 40)
        .map(({ ownerToken: _ownerToken, sourceUrl: _sourceUrl, sourceText: _sourceText, ...post }) => post);
      return Response.json({ posts });
    }
    const db = await getDb();
    const rows = await db
      .select(publicPostFields)
      .from(caseSubmissions)
      .where(mine
        ? and(eq(caseSubmissions.status, "published"), eq(caseSubmissions.ownerToken, visitorId))
        : eq(caseSubmissions.status, "published"))
      .orderBy(desc(caseSubmissions.createdAt))
      .limit(mine ? 60 : 40);
    return Response.json({ posts: rows });
  } catch {
    return Response.json({ posts: [] });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      scene?: string;
      kind?: "help" | "case";
      title?: string;
      relation?: string;
      goal?: string;
      response?: string;
      outcome?: string;
      sourceUrl?: string;
      sourceText?: string;
      imageKey?: string;
      consent?: boolean;
      visitorId?: string;
    };

    const scene = payload.scene?.trim() ?? "";
    let response = payload.response?.trim() ?? "";
    const outcome = payload.outcome?.trim() ?? "";
    let title = payload.title?.trim() || (payload.kind === "case" ? "匿名分享的好案例" : "想听听大家会怎么回");
    const relation = payload.relation?.trim() || "其他";
    const goal = payload.goal?.trim() || "想听听大家怎么说";
    const sourceUrl = payload.sourceUrl?.trim() ?? "";
    const sourceText = payload.sourceText?.trim() ?? "";
    const imageKey = payload.imageKey?.trim() ?? "";
    const kind = payload.kind === "case" ? "case" : "help";
    const ownerToken = payload.visitorId?.trim() ?? "";

    if (!payload.consent) {
      return Response.json({ error: "请先确认已经隐去可识别信息" }, { status: 400 });
    }
    if (!validVisitorId(ownerToken)) {
      return Response.json({ error: "发布身份已过期，请刷新页面后重试" }, { status: 400 });
    }
    if (scene.length < 10) {
      return Response.json({ error: "请至少用 10 个字说清楚发生了什么" }, { status: 400 });
    }
    if (scene.length > MAX_SCENE_LENGTH || response.length > MAX_FIELD_LENGTH || outcome.length > MAX_FIELD_LENGTH || sourceText.length > MAX_SOURCE_LENGTH || sourceUrl.length > 1200) {
      return Response.json({ error: "内容过长，请再精简一些" }, { status: 400 });
    }

    if (kind === "help") {
      try {
        const aiReplies = await generateHelpReplies({ scene, relation, goal });
        title = payload.title?.trim() || aiReplies.title || title;
        response = JSON.stringify(aiReplies);
      } catch {
        // 发布不应因为模型短暂拥堵而失败；广场仍可接收真人回答。
      }
    } else if (!payload.title?.trim()) {
      try { title = await generateCaseTitle(scene, response); } catch { /* 保留匿名默认标题 */ }
    }

    if (isNetlifyRuntime()) {
      const submission: NetlifySubmission = {
        id: Date.now(),
        kind,
        title,
        relation,
        goal,
        scene,
        response,
        outcome,
        sourceUrl,
        sourceText,
        imageKey,
        ownerToken,
        status: "published",
        createdAt: Date.now(),
      };
      await saveNetlifySubmission(submission);
      return Response.json({ post: submission, status: "published" }, { status: 201 });
    }

    const db = await getDb();
    const [submission] = await db
      .insert(caseSubmissions)
      .values({ kind, title, relation, goal, scene, response, outcome, sourceUrl, sourceText, imageKey, ownerToken, status: "published" })
      .returning();

    return Response.json({ post: submission, status: "published" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败，请稍后再试";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json() as { id?: number; visitorId?: string };
    const id = Number(payload.id);
    const visitorId = payload.visitorId?.trim() ?? "";
    if (!Number.isInteger(id) || id <= 0 || !validVisitorId(visitorId)) {
      return Response.json({ error: "删除请求无效" }, { status: 400 });
    }

    if (isNetlifyRuntime()) {
      const ownedPost = (await listNetlifySubmissions()).find((post) => post.id === id && post.ownerToken === visitorId);
      if (!ownedPost) return Response.json({ error: "没有找到这条发布，或它不属于当前设备" }, { status: 404 });
      const contentId = `post-${id}`;
      await Promise.all([
        deleteNetlifyCommentsForContent(contentId),
        deleteNetlifyInteractionsForContent(contentId),
        deleteNetlifySubmission(id),
        ownedPost.imageKey ? deleteNetlifyImage(ownedPost.imageKey) : Promise.resolve(),
      ]);
      return Response.json({ deleted: true, id });
    }

    const db = await getDb();
    const [ownedPost] = await db
      .select({ id: caseSubmissions.id, imageKey: caseSubmissions.imageKey })
      .from(caseSubmissions)
      .where(and(eq(caseSubmissions.id, id), eq(caseSubmissions.ownerToken, visitorId)))
      .limit(1);
    if (!ownedPost) return Response.json({ error: "没有找到这条发布，或它不属于当前设备" }, { status: 404 });

    const contentId = `post-${id}`;
    await db.delete(communityComments).where(eq(communityComments.contentId, contentId));
    await db.delete(communityInteractions).where(eq(communityInteractions.contentId, contentId));
    await db.delete(caseSubmissions).where(and(eq(caseSubmissions.id, id), eq(caseSubmissions.ownerToken, visitorId)));

    if (ownedPost.imageKey) {
      try {
        const { env } = await import("cloudflare:workers");
        await (env as unknown as { MEDIA?: R2Bucket }).MEDIA?.delete(ownedPost.imageKey);
      } catch { /* 数据已经删除，不因图片清理失败回滚 */ }
    }
    return Response.json({ deleted: true, id });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除失败，请稍后再试" }, { status: 500 });
  }
}
