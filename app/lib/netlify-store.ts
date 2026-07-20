import { getStore } from "@netlify/blobs";

export type NetlifySubmission = {
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

export type NetlifyComment = {
  id: string;
  contentId: string;
  visitorId: string;
  body: string;
  createdAt: number;
};

export type NetlifyInteraction = {
  contentId: string;
  visitorId: string;
  kind: "like" | "save";
  createdAt: number;
};

export const isNetlifyRuntime = () => process.env.NETLIFY === "true";

async function listJSON<T>(storeName: string, prefix?: string) {
  const store = getStore(storeName);
  const { blobs } = await store.list(prefix ? { prefix } : undefined);
  const values = await Promise.all(blobs.map((item) => store.get(item.key, { type: "json" }) as Promise<T | null>));
  return values.filter((item) => item !== null) as T[];
}

export async function listNetlifySubmissions() {
  return listJSON<NetlifySubmission>("speak-power-submissions");
}

export async function saveNetlifySubmission(post: NetlifySubmission) {
  await getStore("speak-power-submissions").setJSON(String(post.id), post);
}

export async function deleteNetlifySubmission(id: number) {
  await getStore("speak-power-submissions").delete(String(id));
}

export async function listNetlifyInteractions() {
  return listJSON<NetlifyInteraction>("speak-power-interactions");
}

export async function getNetlifyInteraction(contentId: string, visitorId: string, kind: "like" | "save") {
  const key = `${encodeURIComponent(contentId)}/${encodeURIComponent(visitorId)}/${kind}`;
  return getStore("speak-power-interactions").get(key, { type: "json" }) as Promise<NetlifyInteraction | null>;
}

export async function saveNetlifyInteraction(value: NetlifyInteraction) {
  const key = `${encodeURIComponent(value.contentId)}/${encodeURIComponent(value.visitorId)}/${value.kind}`;
  await getStore("speak-power-interactions").setJSON(key, value);
}

export async function deleteNetlifyInteraction(contentId: string, visitorId: string, kind: "like" | "save") {
  const key = `${encodeURIComponent(contentId)}/${encodeURIComponent(visitorId)}/${kind}`;
  await getStore("speak-power-interactions").delete(key);
}

export async function deleteNetlifyInteractionsForContent(contentId: string) {
  const store = getStore("speak-power-interactions");
  const { blobs } = await store.list({ prefix: `${encodeURIComponent(contentId)}/` });
  await Promise.all(blobs.map((item) => store.delete(item.key)));
}

export async function listNetlifyComments() {
  return listJSON<NetlifyComment>("speak-power-comments");
}

export async function saveNetlifyComment(comment: NetlifyComment) {
  const key = `${encodeURIComponent(comment.contentId)}/${comment.id}`;
  await getStore("speak-power-comments").setJSON(key, comment);
}

export async function deleteNetlifyCommentsForContent(contentId: string) {
  const store = getStore("speak-power-comments");
  const { blobs } = await store.list({ prefix: `${encodeURIComponent(contentId)}/` });
  await Promise.all(blobs.map((item) => store.delete(item.key)));
}

export async function saveNetlifyImage(key: string, file: File) {
  await getStore("speak-power-media").set(key, file, { metadata: { contentType: file.type } });
}

export async function getNetlifyImage(key: string) {
  return getStore("speak-power-media").getWithMetadata(key, { type: "blob" });
}

export async function deleteNetlifyImage(key: string) {
  await getStore("speak-power-media").delete(key);
}
