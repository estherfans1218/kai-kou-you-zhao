import { env } from "cloudflare:workers";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export async function askDeepSeek<T>(messages: ChatMessage[], maxTokens = 900): Promise<T> {
  const apiKey = (env as unknown as { DEEPSEEK_API_KEY?: string }).DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("AI 服务尚未配置");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages,
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      max_tokens: maxTokens,
      temperature: 0.55,
      stream: false,
    }),
  });

  const data = await response.json() as DeepSeekResponse;
  if (!response.ok) throw new Error(data.error?.message || "AI 暂时没有回应");
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 返回内容为空");

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("AI 返回格式异常，请再试一次");
  }
}

export type HelpReplyPack = {
  title: string;
  gentle: string;
  firm: string;
  direct: string;
  followUp: { opponent: string; answer: string };
};

export async function generateHelpReplies(input: {
  scene: string;
  relation: string;
  goal: string;
}): Promise<HelpReplyPack> {
  return askDeepSeek<HelpReplyPack>([
    {
      role: "system",
      content: `你是中文表达训练产品“开口有招”的应对教练。你的任务不是鼓励吵架，而是给出用户当下可以直接说出口的话。\n要求：尊重事实、边界清楚、避免人身攻击和升级冲突；若涉及人身安全、违法威胁或医疗法律问题，优先建议离开现场、保留证据或求助专业机构。\n只输出 JSON：{"title":"18字内匿名标题","gentle":"温和但不讨好的回答","firm":"坚定清晰的回答","direct":"更直接但不侮辱人的回答","followUp":{"opponent":"对方最可能继续施压的一句话","answer":"用户可继续接的一句话"}}。每个回答控制在20到80字。`,
    },
    { role: "user", content: `关系：${input.relation}\n目标：${input.goal}\n情境：${input.scene}` },
  ], 760);
}

export async function generateCaseTitle(scene: string, response: string): Promise<string> {
  const result = await askDeepSeek<{ title: string }>([
    { role: "system", content: "你是匿名案例编辑。根据素材生成一个12到18字、具体但不泄露身份的中文标题，不夸张、不使用网络烂梗。只输出 JSON：{\"title\":\"标题\"}。" },
    { role: "user", content: `发生了什么：${scene}\n当时回应：${response}` },
  ], 120);
  return result.title?.trim().slice(0, 60) || "匿名分享的好案例";
}
