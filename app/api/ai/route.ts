import { askDeepSeek } from "../../lib/deepseek";

type Turn = { role: "opponent" | "user"; text: string };

const MAX_TEXT = 5000;
const PUBLIC_CASE_HOSTS = [
  "xiaohongshu.com", "xhslink.com", "douyin.com", "iesdouyin.com",
  "zhihu.com", "weibo.com", "weibo.cn",
];

function clean(value: unknown, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAllowedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PUBLIC_CASE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&quot;/gi, "\"")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

async function readPublicPage(sourceUrl: string) {
  let current = new URL(sourceUrl);
  for (let redirects = 0; redirects < 4; redirects += 1) {
    if (!isAllowedUrl(current.toString())) throw new Error("目前只支持小红书、抖音、知乎和微博公开链接");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KaiKouYouZhao/1.0)" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        current = new URL(location, current);
        continue;
      }
      if (!response.ok) break;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) break;
      return htmlToText((await response.text()).slice(0, 250000));
    } finally {
      clearTimeout(timer);
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = clean(payload.action, 40);

    if (action === "feynman") {
      const title = clean(payload.title, 80);
      const concept = clean(payload.concept, 1800);
      const prompt = clean(payload.prompt, 600);
      const checks = Array.isArray(payload.checks) ? payload.checks.map((item) => clean(item, 120)).filter(Boolean).slice(0, 6) : [];
      const explanation = clean(payload.explanation, 2400);
      if (explanation.length < 20) return Response.json({ error: "至少用 20 个字讲讲你的理解" }, { status: 400 });
      const feedback = await askDeepSeek<{
        score: number; verdict: string; strengths: string[]; missing: string[]; example: string; retryPrompt: string;
      }>([
        { role: "system", content: `你是费曼学习法教练。依据给定知识点检查学习者是否真正理解，不用“绝对正确/错误”打击用户。重点评估：核心概念、推理是否完整、表达是否清楚、能否迁移到新例子。只输出 JSON：{"score":0到100整数,"verdict":"一句具体评价","strengths":["最多2点"],"missing":["最多3个尚未说清的点"],"example":"一个更贴近日常的新例子","retryPrompt":"一个能帮助用户补全理解的追问"}。不要照抄参考答案。` },
        { role: "user", content: `知识点：${title}\n参考解释：${concept}\n题目：${prompt}\n检查维度：${checks.join("；")}\n学习者复述：${explanation}` },
      ], 760);
      return Response.json({ feedback });
    }

    if (action === "roleplay") {
      const rawTurns = Array.isArray(payload.turns) ? payload.turns : [];
      const turns = rawTurns.slice(-10).map((turn) => {
        const item = turn as Partial<Turn>;
        return { role: item.role === "user" ? "user" as const : "opponent" as const, text: clean(item.text, 500) };
      }).filter((turn) => turn.text);
      if (!turns.length) return Response.json({ error: "对话内容为空" }, { status: 400 });
      const conversation = turns.map((turn) => `${turn.role === "user" ? "练习者" : "强势上级"}：${turn.text}`).join("\n");
      const result = await askDeepSeek<{ reply: string }>([
        { role: "system", content: `你正在中文表达训练中扮演一位强势但现实的直属上级。场景是临下班要求员工今晚完成临时任务。根据练习者的回应自然追问，每轮只说1到3句，保持压力但不要辱骂、歧视、威胁或说教，也不要替用户总结。若练习者说清优先级、时间或替代方案，可以逐渐松动并提出具体条件。只输出 JSON：{"reply":"角色下一轮台词"}。` },
        { role: "user", content: conversation },
      ], 320);
      return Response.json({ reply: clean(result.reply, 500) });
    }

    if (action === "roleplay-review") {
      const rawTurns = Array.isArray(payload.turns) ? payload.turns : [];
      const conversation = rawTurns.slice(-14).map((turn) => {
        const item = turn as Partial<Turn>;
        return `${item.role === "user" ? "练习者" : "对方"}：${clean(item.text, 500)}`;
      }).join("\n");
      const review = await askDeepSeek<{
        scores: { boundary: number; clarity: number; strategy: number };
        strength: string; improve: string; betterReply: string;
      }>([
        { role: "system", content: `你是表达训练教练，请复盘一段压力对话。只评价表达策略，不诊断人格。只输出 JSON：{"scores":{"boundary":0到100,"clarity":0到100,"strategy":0到100},"strength":"做得最好的一点","improve":"下一次最值得改的一点","betterReply":"基于用户原意、可直接说出口的改写"}。反馈要具体、短、可行动。` },
        { role: "user", content: conversation },
      ], 520);
      return Response.json({ review });
    }

    if (action === "parse-case") {
      const sourceUrl = clean(payload.sourceUrl, 1000);
      const sourceText = clean(payload.sourceText, 7000);
      if (sourceUrl && !isAllowedUrl(sourceUrl)) return Response.json({ error: "目前只支持小红书、抖音、知乎和微博的 HTTPS 链接" }, { status: 400 });
      let pageText = "";
      if (sourceUrl) {
        try { pageText = await readPublicPage(sourceUrl); } catch { pageText = ""; }
      }
      const material = [sourceText, pageText].filter(Boolean).join("\n\n").slice(0, 12000);
      if (material.length < 30) return Response.json({ error: "平台没有返回可读取文字。请粘贴文案、关键对话，或上传截图后补充几句说明。" }, { status: 422 });
      const parsed = await askDeepSeek<{ title: string; scene: string; response: string; outcome: string; relation: string }>([
        { role: "system", content: `你是匿名案例编辑。把素材整理成可供表达学习的真实案例，不能编造素材中没有的结果或对话；隐去姓名、账号、公司、门店和联系方式。只输出 JSON：{"title":"18字内标题","scene":"100到400字，交代背景和冲突","response":"保留最关键的有来有回答复，未知则为空","outcome":"素材明确提到的结果，未知则为空","relation":"同事/上级/家人/朋友/商家/陌生人/其他之一"}。` },
        { role: "user", content: material },
      ], 900);
      return Response.json({ parsed });
    }

    return Response.json({ error: "未知的 AI 操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 暂时不可用，请稍后再试";
    return Response.json({ error: message }, { status: 500 });
  }
}
