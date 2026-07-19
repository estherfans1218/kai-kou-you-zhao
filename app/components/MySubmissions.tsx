"use client";

import { useEffect, useState } from "react";

import { getVisitorId } from "../lib/visitor";

type MyPost = {
  id: number;
  kind: "help" | "case";
  title: string;
  scene: string;
  createdAt: string | number;
};

export function MySubmissions({ onView }: { onView: () => void }) {
  const [visitorId] = useState(getVisitorId);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visitorId) return;
    fetch(`/api/submissions?mine=1&visitorId=${encodeURIComponent(visitorId)}`)
      .then((response) => response.json())
      .then((data: { posts?: MyPost[] }) => setPosts(data.posts ?? []))
      .catch(() => setError("暂时没能读取发布记录"))
      .finally(() => setStatus("ready"));
  }, [visitorId]);

  async function removePost(post: MyPost) {
    if (!window.confirm(`确定删除“${post.title}”吗？删除后广场中的内容和评论都会消失，不能恢复。`)) return;
    setDeletingId(post.id);
    setError("");
    try {
      const response = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, visitorId }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除失败");
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败，请稍后再试");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="my-published">
      <div className="my-section-head"><div><span>我的发布</span><small>只显示这台设备发布的内容</small></div>{posts.length > 0 && <b>{posts.length} 条</b>}</div>
      {status === "loading" ? <div className="my-post-loading">正在翻找你的记录…</div> : posts.length ? (
        <div className="my-post-list">
          {posts.map((post) => <article key={post.id}>
            <button className="my-post-main" onClick={onView}><span>{post.kind === "help" ? "求助" : "案例"}</span><strong>{post.title}</strong><p>{post.scene}</p><small>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</small></button>
            <button className="delete-post" onClick={() => removePost(post)} disabled={deletingId === post.id}>{deletingId === post.id ? "删除中…" : "删除"}</button>
          </article>)}
        </div>
      ) : <div className="my-post-empty"><strong>还没有发布记录</strong><p>从这个版本开始，你发布的求助和案例都会保存在这里，也可以随时删除。</p></div>}
      {error && <p className="my-post-error">{error}</p>}
    </section>
  );
}
