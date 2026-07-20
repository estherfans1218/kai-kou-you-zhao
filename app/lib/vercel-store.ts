import { del, get, list, put } from "@vercel/blob";

export type VercelSubmission = {
  id: number;
  kind: "help" | "case";
  title: string;
  relation: string;
  goal: string;
  scene: string;
  response: string;
  outcome: string;
  sourceUrl: string;
  sourceText: string;
  imageKey: string;
  ownerToken: string;
  status: string;
  createdAt: number;
};

export type VercelComment = {
  id: string;
  contentId: string;
  visitorId: string;
  body: string;
  createdAt: number;
};

export type VercelInteraction = {
  contentId: string;
  visitorId: string;
  kind: "like" | "save";
  createdAt: number;
};

export const isVercelRuntime = () => process.env.VERCEL === "1";

function ensureBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("公开版存储尚未配置，请稍后再试");
  }
}

async function listJSON<T>(prefix: string) {
  ensureBlobToken();
  const { blobs } = await list({ prefix });
  const entries = await Promise.all(blobs.map(async (blob) => {
    const response = await get(blob.pathname, { access: "private", useCache: false });
    if (!response || response.statusCode !== 200 || !response.stream) return null;
    return new Response(response.stream).json() as Promise<T>;
  }));
  return entries.filter(Boolean) as T[];
}

async function removeByPrefix(prefix: string) {
  ensureBlobToken();
  const { blobs } = await list({ prefix });
  if (blobs.length) await del(blobs.map((blob) => blob.url));
}

function submissionPath(id: number) { return `community/submissions/${id}.json`; }
function interactionPath(contentId: string, visitorId: string, kind: "like" | "save") {
  return `community/interactions/${encodeURIComponent(contentId)}/${encodeURIComponent(visitorId)}/${kind}.json`;
}
function commentPath(contentId: string, id: string) { return `community/comments/${encodeURIComponent(contentId)}/${id}.json`; }

export async function listVercelSubmissions() {
  return listJSON<VercelSubmission>("community/submissions/");
}

export async function saveVercelSubmission(post: VercelSubmission) {
  ensureBlobToken();
  await put(submissionPath(post.id), JSON.stringify(post), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function deleteVercelSubmission(id: number) {
  await removeByPrefix(submissionPath(id));
}

export async function listVercelInteractions() {
  return listJSON<VercelInteraction>("community/interactions/");
}

export async function getVercelInteraction(contentId: string, visitorId: string, kind: "like" | "save") {
  const items = await listJSON<VercelInteraction>(interactionPath(contentId, visitorId, kind));
  return items[0] ?? null;
}

export async function saveVercelInteraction(value: VercelInteraction) {
  ensureBlobToken();
  await put(interactionPath(value.contentId, value.visitorId, value.kind), JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function deleteVercelInteraction(contentId: string, visitorId: string, kind: "like" | "save") {
  await removeByPrefix(interactionPath(contentId, visitorId, kind));
}

export async function deleteVercelInteractionsForContent(contentId: string) {
  await removeByPrefix(`community/interactions/${encodeURIComponent(contentId)}/`);
}

export async function listVercelComments() {
  return listJSON<VercelComment>("community/comments/");
}

export async function saveVercelComment(comment: VercelComment) {
  ensureBlobToken();
  await put(commentPath(comment.contentId, comment.id), JSON.stringify(comment), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function deleteVercelCommentsForContent(contentId: string) {
  await removeByPrefix(`community/comments/${encodeURIComponent(contentId)}/`);
}

export async function saveVercelImage(key: string, file: File) {
  ensureBlobToken();
  await put(key, file, { access: "private", addRandomSuffix: false, contentType: file.type });
}

export async function getVercelImage(key: string) {
  ensureBlobToken();
  return get(key, { access: "private", useCache: false });
}

export async function deleteVercelImage(key: string) {
  await removeByPrefix(key);
}
