import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db";
import { caseSubmissions } from "../../../db/schema";
import { generateCaseTitle, generateHelpReplies } from "../../lib/deepseek";

const MAX_SCENE_LENGTH = 1200;
const MAX_FIELD_LENGTH = 600;
const MAX_SOURCE_LENGTH = 8000;

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(caseSubmissions)
      .where(eq(caseSubmissions.status, "published"))
      .orderBy(desc(caseSubmissions.createdAt))
      .limit(40);
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

    if (!payload.consent) {
      return Response.json({ error: "请先确认已经隐去可识别信息" }, { status: 400 });
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

    const db = getDb();
    const [submission] = await db
      .insert(caseSubmissions)
      .values({ kind, title, relation, goal, scene, response, outcome, sourceUrl, sourceText, imageKey, status: "published" })
      .returning();

    return Response.json({ post: submission, status: "published" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败，请稍后再试";
    return Response.json({ error: message }, { status: 500 });
  }
}
