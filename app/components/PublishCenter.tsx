"use client";

import { useState, type FormEvent } from "react";

type Kind = "help" | "case";

export function PublishCenter({ onPublished }: { onPublished: () => void }) {
  const [kind, setKind] = useState<Kind>("help");
  const [title, setTitle] = useState("");
  const [scene, setScene] = useState("");
  const [relation, setRelation] = useState("同事");
  const [goal, setGoal] = useState("想知道怎么回应");
  const [response, setResponse] = useState("");
  const [outcome, setOutcome] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      let imageKey = "";
      if (image) {
        const formData = new FormData();
        formData.append("image", image);
        const upload = await fetch("/api/media", { method: "POST", body: formData });
        const uploaded = await upload.json() as { key?: string; error?: string };
        if (!upload.ok || !uploaded.key) throw new Error(uploaded.error ?? "图片上传失败");
        imageKey = uploaded.key;
      }
      const result = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, scene, relation, goal, response, outcome, sourceUrl, sourceText, imageKey, consent }),
      });
      const data = await result.json() as { error?: string };
      if (!result.ok) throw new Error(data.error ?? "发布失败");
      setStatus("sent");
    } catch (submitError) {
      setStatus("idle");
      setError(submitError instanceof Error ? submitError.message : "发布失败，请稍后再试");
    }
  }

  return (
    <div className="page inner-page publish-page">
      <span className="eyebrow">发布到真实局</span>
      <h1>把你的这一局，<br />交给大家一起想。</h1>
      <div className="publish-kind">
        <button className={kind === "help" ? "active" : ""} onClick={() => setKind("help")}><span>？</span><strong>我要求助</strong><small>遇到了事，不知道怎么回</small></button>
        <button className={kind === "case" ? "active" : ""} onClick={() => setKind("case")}><span>✦</span><strong>我有好案例</strong><small>亲历或刷到的精彩表达</small></button>
      </div>

      {status === "sent" ? (
        <section className="publish-success"><span>✓</span><h2>已经发布到真实局</h2><p>我们会继续检查隐私信息。其他人现在可以点赞、收招和留言。</p><button className="primary-action" onClick={onPublished}>去真实局看看 <b>↗</b></button></section>
      ) : (
        <form className="publish-form" onSubmit={submit}>
          <label><span>标题</span><input required maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "help" ? "一句话说清你卡住的地方" : "这个案例精彩在哪里"} /></label>
          <label><span>发生了什么</span><textarea required minLength={20} maxLength={1200} value={scene} onChange={(event) => setScene(event.target.value)} placeholder="请隐去真实姓名、公司、群名和联系方式……" /></label>
          <div className="publish-row">
            <label><span>对方是谁</span><select value={relation} onChange={(event) => setRelation(event.target.value)}>{["同事", "上级", "家人", "朋友", "商家", "陌生人", "其他"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>你希望</span><select value={goal} onChange={(event) => setGoal(event.target.value)}>{["想知道怎么回应", "拒绝但不撕破脸", "维护自己的权益", "让关系继续", "分享一个好回答"].map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>

          <label className="image-upload"><span>补充图片</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (preview) URL.revokeObjectURL(preview); setImage(file); setPreview(file ? URL.createObjectURL(file) : ""); }} /><div>{preview ? <img src={preview} alt="待上传图片预览" /> : <><b>＋ 上传截图或现场图片</b><small>支持 JPG、PNG、WebP，最大 5MB</small></>}</div></label>

          {kind === "case" && <>
            <label><span>当时是怎么回应的</span><textarea maxLength={600} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="尽量保留有来有回的对话……" /></label>
            <label><span>后来发生了什么</span><textarea maxLength={600} value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="这个回答有没有起作用？关系或事情后来怎样了？" /></label>
            <label><span>原链接（仅后台核验，不在广场展示）</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="小红书、抖音、知乎、微博或其他公开链接" /></label>
            <label><span>视频文案或关键对话</span><textarea maxLength={1200} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="平台链接无法自动读取时，可以粘贴字幕、文案或关键对话。" /></label>
          </>}

          <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />我已隐去可识别信息，并确认有权提交这些内容；公开案例将被匿名整理。</label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" disabled={status === "sending" || !consent || scene.trim().length < 20 || !title.trim()}>{status === "sending" ? "正在发布…" : kind === "help" ? "发布求助" : "发布好案例"}<span>↗</span></button>
        </form>
      )}
    </div>
  );
}
