"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { storyCases, type RealStory } from "../data/stories";

type SubmissionPost = {
  id: number;
  kind: "help" | "case";
  title: string;
  relation: string;
  goal: string;
  scene: string;
  response: string;
  outcome: string;
  imageKey: string;
  createdAt: string | number;
};

type Comment = { id: number | string; contentId: string; body: string; createdAt?: string | number };
type Filter = "all" | "help" | "solved" | "case";
type Tone = "gentle" | "firm" | "direct";

const toneLabels: Record<Tone, string> = { gentle: "温和", firm: "坚定", direct: "直接" };

export function RealPlaza({ onPublish }: { onPublish: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [submissions, setSubmissions] = useState<SubmissionPost[]>([]);
  const [visitorId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = window.localStorage.getItem("speak-power-visitor-id");
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem("speak-power-visitor-id", created);
    return created;
  });
  const [counts, setCounts] = useState<Record<string, { like: number; save: number }>>({});
  const [mine, setMine] = useState<Record<string, { like: boolean; save: boolean }>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [tones, setTones] = useState<Record<string, Tone>>({});

  useEffect(() => {
    fetch("/api/submissions").then((response) => response.json()).then((data: { posts?: SubmissionPost[] }) => setSubmissions(data.posts ?? [])).catch(() => setSubmissions([]));
  }, []);

  useEffect(() => {
    if (!visitorId) return;
    refreshCommunity(visitorId);
  }, [visitorId]);

  async function refreshCommunity(id = visitorId) {
    try {
      const response = await fetch(`/api/community?visitorId=${encodeURIComponent(id)}`);
      const data = await response.json() as {
        counts?: Array<{ contentId: string; kind: "like" | "save"; count: number }>;
        mine?: Array<{ contentId: string; kind: "like" | "save" }>;
        comments?: Comment[];
      };
      const nextCounts: Record<string, { like: number; save: number }> = {};
      for (const item of data.counts ?? []) {
        nextCounts[item.contentId] ??= { like: 0, save: 0 };
        nextCounts[item.contentId][item.kind] = Number(item.count);
      }
      const nextMine: Record<string, { like: boolean; save: boolean }> = {};
      for (const item of data.mine ?? []) {
        nextMine[item.contentId] ??= { like: false, save: false };
        nextMine[item.contentId][item.kind] = true;
      }
      const nextComments: Record<string, Comment[]> = {};
      for (const item of data.comments ?? []) {
        nextComments[item.contentId] ??= [];
        nextComments[item.contentId].push(item);
      }
      setCounts(nextCounts);
      setMine(nextMine);
      setComments(nextComments);
    } catch {
      // The seeded plaza remains usable if the community service is unavailable.
    }
  }

  async function toggleInteraction(contentId: string, action: "toggle-like" | "toggle-save") {
    if (!visitorId) return;
    const kind = action === "toggle-like" ? "like" : "save";
    const wasActive = mine[contentId]?.[kind] ?? false;
    setMine((current) => ({ ...current, [contentId]: { like: current[contentId]?.like ?? false, save: current[contentId]?.save ?? false, [kind]: !wasActive } }));
    setCounts((current) => ({ ...current, [contentId]: { like: Math.max(0, (current[contentId]?.like ?? 0) + (kind === "like" ? (wasActive ? -1 : 1) : 0)), save: Math.max(0, (current[contentId]?.save ?? 0) + (kind === "save" ? (wasActive ? -1 : 1) : 0)) } }));
    try {
      await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, contentId, visitorId }) });
    } catch {
      await refreshCommunity();
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, contentId: string) {
    event.preventDefault();
    const body = commentDraft.trim();
    if (body.length < 2 || !visitorId) return;
    const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", contentId, visitorId, body }) });
    if (response.ok) {
      const data = await response.json() as { comment: Comment };
      setComments((current) => ({ ...current, [contentId]: [data.comment, ...(current[contentId] ?? [])] }));
      setCommentDraft("");
    }
  }

  const items = useMemo(() => {
    const seeded = storyCases.map((story) => ({ type: story.kind, id: story.id, story }));
    const posted = submissions.map((post) => ({ type: post.kind, id: `post-${post.id}`, post }));
    return [...posted, ...seeded].filter((item) => filter === "all" || item.type === filter);
  }, [filter, submissions]);

  return (
    <section className="real-plaza">
      <div className="stories-intro">
        <span className="eyebrow">具体的局，具体地回</span>
        <h2>如果是你，这句话怎么接？</h2>
        <p>求助、已经有解的情境和真实案例都在这里。人物信息已匿名处理。</p>
      </div>

      <div className="real-filters">
        {([['all', '全部'], ['help', '求助中'], ['solved', '已有解'], ['case', '案例分享']] as const).map(([id, label]) => (
          <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      <div className="story-list">
        {items.map((item) => {
          const story = "story" in item ? item.story as RealStory : null;
          const post = "post" in item ? item.post as SubmissionPost : null;
          const contentId = item.id;
          const seedLikes = story?.seedLikes ?? 0;
          const seedComments = story?.seedComments.map((body, index) => ({ id: `seed-${index}`, contentId, body })) ?? [];
          const allComments = [...(comments[contentId] ?? []), ...seedComments];
          const tone = tones[contentId] ?? "firm";
          return (
            <article className="real-card" key={contentId}>
              <div className="story-meta">
                <span>{item.type === "help" ? "求助中" : item.type === "solved" ? "已有解" : "案例分享"}</span>
                <small>{story?.category ?? `${post?.relation} · ${post?.goal}`}</small>
              </div>
              <h3>{story?.title ?? post?.title}</h3>
              <p className="story-summary">{story?.scene ?? post?.scene}</p>
              {(story?.speakerLine || post?.response) && (
                <div className="real-quote"><span>{story ? "对方原话" : "当时这样回"}</span><p>{story?.speakerLine ?? post?.response}</p></div>
              )}
              {post?.imageKey && <img className="submission-image" src={`/api/media?key=${encodeURIComponent(post.imageKey)}`} alt="投稿者上传的情境图片" />}

              {story && (
                <div className="answer-box">
                  <div className="answer-head"><strong>可以直接这样说</strong><div>{(Object.keys(toneLabels) as Tone[]).map((key) => <button key={key} className={tone === key ? "active" : ""} onClick={() => setTones((current) => ({ ...current, [contentId]: key }))}>{toneLabels[key]}</button>)}</div></div>
                  <p>{story.responses[tone]}</p>
                  <details><summary>如果对方继续说… <b>＋</b></summary><div className="follow-up"><span>对方：{story.followUp.opponent}</span><strong>你：{story.followUp.answer}</strong></div></details>
                  <div className="real-outcome"><span>后来</span>{story.outcome}</div>
                  <small className="origin-label">{story.origin}</small>
                </div>
              )}

              {post?.kind === "case" && post.outcome && <div className="real-outcome"><span>后来</span>{post.outcome}</div>}
              {post?.kind === "help" && <button className="answer-call" onClick={() => setOpenComments(contentId)}>帮她想一句 →</button>}

              <div className="community-bar">
                <button className={mine[contentId]?.like ? "mouth-action active" : "mouth-action"} onClick={() => toggleInteraction(contentId, "toggle-like")} aria-label="开口点赞"><i className="mouth-icon" /><span>{seedLikes + (counts[contentId]?.like ?? 0)}</span></button>
                <button className={mine[contentId]?.save ? "move-save active" : "move-save"} onClick={() => toggleInteraction(contentId, "toggle-save")} aria-label="收入招式"><i className="move-icon">招</i><span>{mine[contentId]?.save ? "已收招" : "收招"}</span></button>
                <button className="comment-action" onClick={() => setOpenComments(openComments === contentId ? null : contentId)}><i>···</i><span>{allComments.length} 条</span></button>
              </div>

              {openComments === contentId && (
                <div className="comment-drawer">
                  <form onSubmit={(event) => submitComment(event, contentId)}><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={240} placeholder={item.type === "help" ? "写下你会怎么回答…" : "说说你的看法…"} /><button disabled={commentDraft.trim().length < 2}>发布</button></form>
                  <div className="comment-list">{allComments.length ? allComments.map((comment) => <p key={comment.id}><span>匿名同路人</span>{comment.body}</p>) : <small>还没有人开口，你可以做第一个。</small>}</div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button className="submit-story-trigger" onClick={onPublish}><span>＋</span><div><strong>发布一个真实的局</strong><small>可以求助，也可以分享你收藏的好案例</small></div></button>
    </section>
  );
}
