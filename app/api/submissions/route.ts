import { getDb } from "../../../db";
import { caseSubmissions } from "../../../db/schema";

const MAX_SCENE_LENGTH = 1200;
const MAX_FIELD_LENGTH = 600;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      scene?: string;
      response?: string;
      outcome?: string;
      consent?: boolean;
    };

    const scene = payload.scene?.trim() ?? "";
    const response = payload.response?.trim() ?? "";
    const outcome = payload.outcome?.trim() ?? "";

    if (!payload.consent) {
      return Response.json({ error: "请先确认已经隐去可识别信息" }, { status: 400 });
    }
    if (scene.length < 20) {
      return Response.json({ error: "请至少用 20 个字说清楚发生了什么" }, { status: 400 });
    }
    if (scene.length > MAX_SCENE_LENGTH || response.length > MAX_FIELD_LENGTH || outcome.length > MAX_FIELD_LENGTH) {
      return Response.json({ error: "内容过长，请再精简一些" }, { status: 400 });
    }

    const db = getDb();
    const [submission] = await db
      .insert(caseSubmissions)
      .values({ scene, response, outcome, status: "pending" })
      .returning({ id: caseSubmissions.id });

    return Response.json({ id: submission.id, status: "pending" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "提交失败，请稍后再试";
    return Response.json({ error: message }, { status: 500 });
  }
}
