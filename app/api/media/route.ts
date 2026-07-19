import { env } from "cloudflare:workers";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function getBucket() {
  const bucket = (env as unknown as { MEDIA?: R2Bucket }).MEDIA;
  if (!bucket) throw new Error("图片存储暂时不可用");
  return bucket;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) return Response.json({ error: "请选择图片" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error: "仅支持 JPG、PNG、WebP 或 GIF" }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "图片请控制在 5MB 以内" }, { status: 400 });

    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const key = `community/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await getBucket().put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return Response.json({ key, url: `/api/media?key=${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "图片上传失败" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!key.startsWith("community/") || key.includes("..")) return new Response("Not found", { status: 404 });
    const object = await getBucket().get(key);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
