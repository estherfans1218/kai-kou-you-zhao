"use client";

import { useState, type FormEvent } from "react";

type Kind = "help" | "case";
type CaseMode = "personal" | "link";
type ParsedCase = { title: string; scene: string; response: string; outcome: string; relation: string };

export function PublishCenter({ onPublished }: { onPublished: () => void }) {
  const [kind, setKind] = useState<Kind>("help");
  const [caseMode, setCaseMode] = useState<CaseMode>("personal");
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
  const [parseStatus, setParseStatus] = useState<"idle" | "parsing" | "done">("idle");
  const [error, setError] = useState("");
  const [parseError, setParseError] = useState("");

  function chooseKind(next: Kind) {
    setKind(next);
    setError("");
    setGoal(next === "case" ? "分享一个好回答" : "想知道怎么回应");
  }

  function chooseImage(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  async function parseCase() {
    setParseError("");
    if (!sourceUrl.trim() && sourceText.trim().length < 30) {
      setParseError("请粘贴案例链接，或至少补充 30 个字的文案/关键对话。公开链接读不到时，文字越完整越容易还原。");
      return;
    }
    setParseStatus("parsing");
    try {
      const result = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse-case", sourceUrl, sourceText }),
      });
      const data = await result.json() as { parsed?: ParsedCase; error?: string };
      if (!result.ok || !data.parsed) throw new Error(data.error ?? "解析失败");
      setTitle(data.parsed.title ?? "");
      setScene(data.parsed.scene ?? "");
      setResponse(data.parsed.response ?? "");
      setOutcome(data.parsed.outcome ?? "");
      setRelation(data.parsed.relation || "其他");
      setParseStatus("done");
    } catch (parseFailure) {
      setParseStatus("idle");
      setParseError(parseFailure instanceof Error ? parseFailure.message : "解析失败，请粘贴文案后再试");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (scene.trim().length < 10) {
      setError(kind === "case" && caseMode === "link" ? "请先完成 AI 解析并检查案例草稿。" : "请至少用 10 个字说清楚发生了什么。");
      return;
    }
    if (!consent) {
      setError("发布前请确认已经隐去姓名、账号、公司和联系方式等可识别信息。");
      return;
    }
    setStatus("sending");
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

  const imageInput = (
    <label className="image-upload"><span>补充图片 <small>可选</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} /><div>{preview ? <img src={preview} alt="待上传图片预览" /> : <><b>＋ 上传截图或现场图片</b><small>支持 JPG、PNG、WebP，最大 5MB</small></>}</div></label>
  );

  return (
    <div className="page inner-page publish-page">
      <span className="eyebrow">发布到真实局</span>
      <h1>把这一局说出来，<br />让答案长出来。</h1>
      <div className="publish-kind">
        <button type="button" className={kind === "help" ? "active" : ""} onClick={() => chooseKind("help")}><span>？</span><strong>我要求助</strong><small>卡在一句话，听听 AI 和大家怎么接</small></button>
        <button type="button" className={kind === "case" ? "active" : ""} onClick={() => chooseKind("case")}><span>✦</span><strong>我有好案例</strong><small>自己经历的，或刷到的精彩表达</small></button>
      </div>

      {status === "sent" ? (
        <section className="publish-success"><span>✓</span><h2>已经发布到真实局</h2><p>{kind === "help" ? "AI 已先帮你整理三种语气的回答，其他人也可以继续补充。" : "案例已匿名整理，其他人现在可以开口、收招和留言。"}</p><button className="primary-action" onClick={onPublished}>去真实局看看 <b>↗</b></button></section>
      ) : (
        <form className="publish-form" onSubmit={submit} noValidate>
          {kind === "help" ? <>
            <div className="form-tip"><b>不用想标题。</b> 把现场说清楚，发布后 AI 会先给出温和、坚定、直接三种回答。</div>
            <label><span>发生了什么</span><textarea maxLength={1200} value={scene} onChange={(event) => setScene(event.target.value)} placeholder="例如：我在水果店买的榴莲回家发现熟过头，店家拒绝处理，还说不满意就报警……" /></label>
            <div className="publish-row">
              <label><span>对方是谁</span><select value={relation} onChange={(event) => setRelation(event.target.value)}>{["同事", "上级", "家人", "朋友", "商家", "陌生人", "其他"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>你希望</span><select value={goal} onChange={(event) => setGoal(event.target.value)}>{["想知道怎么回应", "拒绝但不撕破脸", "维护自己的权益", "让关系继续"].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            {imageInput}
          </> : <>
            <div className="case-source-tabs" aria-label="案例提交方式">
              <button type="button" className={caseMode === "personal" ? "active" : ""} onClick={() => { setCaseMode("personal"); setError(""); }}>自己讲一个</button>
              <button type="button" className={caseMode === "link" ? "active" : ""} onClick={() => { setCaseMode("link"); setError(""); }}>粘贴链接解析</button>
            </div>

            {caseMode === "link" && <section className="link-parser">
              <div className="ai-label"><span>AI</span><div><strong>把链接整理成案例草稿</strong><small>链接读不到时，粘贴文案或关键对话即可</small></div></div>
              <label><span>公开链接</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="小红书、抖音、知乎或微博链接" /></label>
              <label><span>文案 / 字幕 / 关键对话 <small>推荐填写</small></span><textarea maxLength={7000} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="平台限制读取时，把文案、字幕或你记下的关键对话粘贴到这里……" /></label>
              {imageInput}
              {parseError && <p className="form-error">{parseError}</p>}
              <button type="button" className="parse-action" onClick={parseCase} disabled={parseStatus === "parsing"}>{parseStatus === "parsing" ? "AI 正在拆出关键对话…" : parseStatus === "done" ? "重新解析草稿" : "AI 解析成案例草稿"}<span>✦</span></button>
            </section>}

            {(caseMode === "personal" || parseStatus === "done") && <section className={parseStatus === "done" ? "case-draft parsed" : "case-draft"}>
              {parseStatus === "done" && <div className="draft-ready"><b>AI 草稿已生成</b><span>下面内容都可以修改，确认无误再发布。</span></div>}
              <label><span>发生了什么</span><textarea maxLength={1200} value={scene} onChange={(event) => setScene(event.target.value)} placeholder="交代背景、对方说了什么，以及当时为什么难处理……" /></label>
              <label><span>当时是怎么回应的</span><textarea maxLength={600} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="保留最精彩的有来有回；不知道可以留空。" /></label>
              <label><span>后来发生了什么</span><textarea maxLength={600} value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="回答有没有起作用？不知道可以留空。" /></label>
              <div className="publish-row">
                <label><span>对方是谁</span><select value={relation} onChange={(event) => setRelation(event.target.value)}>{["同事", "上级", "家人", "朋友", "商家", "陌生人", "其他"].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>标题 <small>可选</small></span><input maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="留空由系统生成" /></label>
              </div>
              {caseMode === "personal" && imageInput}
            </section>}
          </>}

          <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />我已隐去姓名、账号、公司、群名和联系方式等可识别信息。</label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" disabled={status === "sending"}>{status === "sending" ? (kind === "help" ? "AI 正在先想三种回答…" : "正在发布…") : kind === "help" ? "发布求助，让 AI 先回答" : "发布好案例"}<span>↗</span></button>
        </form>
      )}
    </div>
  );
}
