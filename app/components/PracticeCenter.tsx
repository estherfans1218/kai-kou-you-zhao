"use client";

import { useState } from "react";

import { logicLessons } from "../data/logic";

type Mode = "feynman" | "story" | "roleplay";
type StoryNode = { setting: string; speaker: string; line: string; choices?: Array<{ text: string; next: string }>; ending?: { title: string; result: string; score: string } };
type SpeechEvent = { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } };
type RecognitionInstance = { lang: string; interimResults: boolean; onstart: (() => void) | null; onresult: ((event: SpeechEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void };
type RecognitionConstructor = new () => RecognitionInstance;
type Turn = { role: "opponent" | "user"; text: string };
type FeynmanFeedback = { score: number; verdict: string; strengths: string[]; missing: string[]; example: string; retryPrompt: string };
type RoleplayReview = { scores: { boundary: number; clarity: number; strategy: number }; strength: string; improve: string; betterReply: string };

const openingLine = "这个任务今晚做完，明早我要看到。别跟我说你还有别的事。";

const story: Record<string, StoryNode> = {
  start: { setting: "周五 18:27 · 办公室只剩三个人", speaker: "直属上级", line: "这个你今晚顺手做一下，明早开会要用，也没多少东西。", choices: [
    { text: "好的，我尽量今晚做完。", next: "overload" },
    { text: "我手上还有 A 和 B，您希望我先暂停哪一个？", next: "priority" },
    { text: "为什么每次都临下班才说？我不做。", next: "conflict" },
  ] },
  priority: { setting: "18:29 · 对方停了一下", speaker: "直属上级", line: "都挺重要的。年轻人有点担当，别什么都算得那么清楚。", choices: [
    { text: "那我先做临时任务，A、B 顺延，稍后同步新的时间。", next: "clearEnd" },
    { text: "行吧，那我都做。", next: "overload" },
  ] },
  conflict: { setting: "18:28 · 气氛突然变硬", speaker: "直属上级", line: "你这是什么态度？工作安排还需要跟你商量吗？", choices: [
    { text: "我不是拒绝安排。我需要确认优先级，才能保证最重要的内容按时交付。", next: "repairEnd" },
    { text: "反正我下班了，明天再说。", next: "hardEnd" },
  ] },
  overload: { setting: "23:46 · 电脑屏幕还亮着", speaker: "系统旁白", line: "临时任务完成了，A 却没有按计划交付。第二天，没人记得优先级从未被确认。", ending: { title: "结局：责任留在了你身上", result: "下一次先确认暂停哪一个，不要让“都重要”自动变成“都由你兜底”。", score: "边界 35 · 清晰 52" } },
  clearEnd: { setting: "18:34 · 新安排已同步", speaker: "系统旁白", line: "临时工作完成，A、B 的延期也有明确记录。", ending: { title: "结局：接住任务，没有默默背下", result: "你同时说清任务、代价和记录，责任变得可以确认。", score: "边界 88 · 清晰 94" } },
  repairEnd: { setting: "18:33 · 对话回到工作", speaker: "系统旁白", line: "上级让你暂停 A。你把新安排发进项目群，冲突没有继续升级。", ending: { title: "结局：把失控的开场拉了回来", result: "表达失手不代表整局失败，重新说目标和优先级可以修复对话。", score: "边界 77 · 修复 91" } },
  hardEnd: { setting: "第二天 09:10 · 会议开始", speaker: "系统旁白", line: "任务无人接手，讨论焦点变成了你是否配合。", ending: { title: "结局：守住时间，丢了叙事", result: "可以拒绝，但最好同时说清可交付时间和交接方案。", score: "边界 90 · 策略 43" } },
};

export function PracticeCenter() {
  const [mode, setMode] = useState<Mode>("feynman");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<FeynmanFeedback | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "loading">("idle");
  const [feedbackError, setFeedbackError] = useState("");
  const [nodeId, setNodeId] = useState("start");
  const [storyRound, setStoryRound] = useState(1);
  const [turns, setTurns] = useState<Turn[]>([{ role: "opponent", text: openingLine }]);
  const [reply, setReply] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [roleplayStatus, setRoleplayStatus] = useState<"idle" | "replying" | "reviewing">("idle");
  const [roleplayError, setRoleplayError] = useState("");
  const [review, setReview] = useState<RoleplayReview | null>(null);
  const lesson = logicLessons[lessonIndex];
  const userTurnCount = turns.filter((turn) => turn.role === "user").length;

  function chooseLesson(index: number) {
    setLessonIndex(index);
    setHidden(false);
    setExplanation("");
    setFeedback(null);
    setFeedbackError("");
  }

  async function getFeynmanFeedback() {
    setFeedbackError("");
    if (explanation.trim().length < 20) {
      setFeedbackError("先用自己的话多讲一点，至少 20 个字，AI 才能判断你哪里真的懂了。");
      return;
    }
    setFeedbackStatus("loading");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feynman", title: lesson.title, concept: lesson.concept, prompt: lesson.prompt, checks: lesson.checks, explanation }),
      });
      const data = await response.json() as { feedback?: FeynmanFeedback; error?: string };
      if (!response.ok || !data.feedback) throw new Error(data.error ?? "AI 反馈失败");
      setFeedback(data.feedback);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "AI 暂时没有回应，请再试一次");
    } finally {
      setFeedbackStatus("idle");
    }
  }

  async function sendReply() {
    const text = reply.trim();
    if (!text || roleplayStatus !== "idle") return;
    const nextTurns: Turn[] = [...turns, { role: "user", text }];
    setTurns(nextTurns);
    setReply("");
    setReview(null);
    setRoleplayError("");
    setRoleplayStatus("replying");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "roleplay", turns: nextTurns }),
      });
      const data = await response.json() as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "对方暂时没有回应");
      setTurns((current) => [...current, { role: "opponent", text: data.reply as string }]);
    } catch (error) {
      setRoleplayError(error instanceof Error ? error.message : "AI 暂时没有回应，请再试一次");
    } finally {
      setRoleplayStatus("idle");
    }
  }

  async function finishRoleplay() {
    setRoleplayError("");
    setRoleplayStatus("reviewing");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "roleplay-review", turns }),
      });
      const data = await response.json() as { review?: RoleplayReview; error?: string };
      if (!response.ok || !data.review) throw new Error(data.error ?? "复盘失败");
      setReview(data.review);
    } catch (error) {
      setRoleplayError(error instanceof Error ? error.message : "AI 暂时无法复盘，请稍后再试");
    } finally {
      setRoleplayStatus("idle");
    }
  }

  function resetRoleplay() {
    setTurns([{ role: "opponent", text: openingLine }]);
    setReply("");
    setReview(null);
    setRoleplayError("");
  }

  function startVoice() {
    setVoiceError("");
    const speechWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("当前浏览器不支持语音转文字，可以先用键盘输入。");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) transcript += event.results[index]?.[0]?.transcript ?? "";
      setReply(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setVoiceError("没有听清，再说一次或改用文字输入。"); };
    recognition.start();
  }

  return (
    <div className="page inner-page practice-page">
      <div className="practice-heading"><span className="eyebrow">表达练习场</span><span className="step-counter">学会 ≠ 会用</span></div>
      <h1>把看懂的一招，<br />练成自己的话。</h1>
      <div className="practice-mode-tabs three-modes">
        {([["feynman", "费曼复述", "AI 查漏"], ["story", "分支剧情", "做选择"], ["roleplay", "自由对练", "现场接话"]] as const).map(([id, title, hint]) => <button key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}><strong>{title}</strong><small>{hint}</small></button>)}
      </div>

      {mode === "feynman" && <section className="feynman-practice">
        <div className="method-label">参考《简单的逻辑学》的基础思想 · 全部例题为原创整理</div>
        <div className="lesson-library">{logicLessons.map((item, index) => <button key={item.id} className={lessonIndex === index ? "active" : ""} onClick={() => chooseLesson(index)}>{String(index + 1).padStart(2, "0")} {item.title}</button>)}</div>
        {!hidden ? <div className="feynman-source"><span>逻辑训练 {String(lessonIndex + 1).padStart(2, "0")}</span><h2>{lesson.title}</h2><p>{lesson.concept}</p><div className="logic-example"><small>放进真实对话</small>{lesson.example}</div><button className="primary-action" onClick={() => setHidden(true)}>我看懂了，隐藏解释 <span>↗</span></button></div>
          : <div className="feynman-recall"><span>现在讲给完全不了解的人听</span><h2>{lesson.prompt}</h2><textarea value={explanation} onChange={(event) => { setExplanation(event.target.value); setFeedback(null); }} placeholder="不要背原话，用你自己的例子和语言……" />
            {!feedback && <div className="feynman-check"><strong>AI 会从这些角度听</strong>{lesson.checks.map((check) => <span key={check}>□ {check}</span>)}</div>}
            {feedbackError && <p className="practice-error">{feedbackError}</p>}
            {!feedback ? <button className="ai-feedback-action" onClick={getFeynmanFeedback} disabled={feedbackStatus === "loading"}>{feedbackStatus === "loading" ? "AI 正在听你怎么讲…" : "交给 AI 查漏"}<span>✦</span></button>
              : <div className="ai-feedback-card"><div className="feedback-score"><strong>{Math.max(0, Math.min(100, Math.round(feedback.score)))}</strong><span>理解度</span></div><div className="feedback-verdict"><small>AI 反馈</small><b>{feedback.verdict}</b></div><div className="feedback-columns"><div><strong>已经讲清</strong>{feedback.strengths.map((item) => <p key={item}>✓ {item}</p>)}</div><div><strong>还可以补上</strong>{feedback.missing.map((item) => <p key={item}>→ {item}</p>)}</div></div><div className="feedback-example"><small>换个例子试试</small>{feedback.example}</div><div className="feedback-question"><small>再讲一遍时，回答这个问题</small>{feedback.retryPrompt}</div><button onClick={() => setFeedback(null)}>修改复述，再让 AI 听一次</button></div>}
            <div className="recall-actions"><button onClick={() => setHidden(false)}>回看解释</button><button onClick={() => chooseLesson((lessonIndex + 1) % logicLessons.length)}>下一题</button></div>
          </div>}
      </section>}

      {mode === "story" && <section className="choice-practice story-practice"><div className="story-game-head"><div><span>分支剧情 · 职场篇</span><strong>下班前 3 分钟</strong></div><small>第 {storyRound} 回合</small></div><div className="story-scene" aria-live="polite"><div className="office-window"><i /><i /><i /></div><span>{story[nodeId].setting}</span><div className="scene-speaker">{story[nodeId].speaker}</div><p>{story[nodeId].line}</p></div>{story[nodeId].choices && <><p className="practice-question">轮到你了。怎么接？</p><div className="practice-options">{story[nodeId].choices?.map((choice, index) => <button key={choice.text} className="practice-option" onClick={() => { setNodeId(choice.next); setStoryRound((round) => round + 1); }}><span>{String.fromCharCode(65 + index)}</span>{choice.text}</button>)}</div></>}{story[nodeId].ending && <div className="story-ending"><span>{story[nodeId].ending?.score}</span><h2>{story[nodeId].ending?.title}</h2><p>{story[nodeId].ending?.result}</p><button onClick={() => { setNodeId("start"); setStoryRound(1); }}>换个选择，再走一次 ↻</button></div>}</section>}

      {mode === "roleplay" && <section className="ai-roleplay">
        <div className="roleplay-scene-head"><div className="stage-avatar">上级</div><div><span>DeepSeek 实时扮演 · 强势上级</span><strong>临时加活压力测试</strong></div><small>第 {userTurnCount + 1} 回合</small></div>
        <div className="roleplay-chat" aria-live="polite">{turns.map((turn, index) => <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "role-turn user" : "role-turn opponent"}><span>{turn.role === "user" ? "你" : "对方"}</span><p>{turn.text}</p></div>)}{roleplayStatus === "replying" && <div className="role-turn opponent typing"><span>对方</span><p><i /><i /><i /></p></div>}</div>
        {!review && <><div className="roleplay-compose"><textarea value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void sendReply(); }} placeholder="现场组织语言回应，也可以点击“声”说出来……" /><button className={listening ? "voice-send listening" : "voice-send"} onClick={startVoice} type="button" aria-label="语音输入">声</button><button className="text-send" onClick={sendReply} disabled={!reply.trim() || roleplayStatus !== "idle"}>发送</button></div><p className="roleplay-note">语音只在浏览器中转成文字；对方的每一轮追问由 AI 根据完整对话实时生成。</p></>}
        {(roleplayError || voiceError) && <p className="roleplay-error">{roleplayError || voiceError}</p>}
        {userTurnCount >= 2 && !review && <button className="finish-roleplay" onClick={finishRoleplay} disabled={roleplayStatus !== "idle"}>{roleplayStatus === "reviewing" ? "AI 正在复盘整局…" : "结束这局，让 AI 复盘"}<span>↗</span></button>}
        {review && <div className="roleplay-review ai-review"><div className="review-scores"><span><b>{review.scores.boundary}</b>边界</span><span><b>{review.scores.clarity}</b>清晰</span><span><b>{review.scores.strategy}</b>策略</span></div><div><strong>你已经做得好的</strong><p>{review.strength}</p></div><div><strong>下一次最值得改的</strong><p>{review.improve}</p></div><blockquote><small>更稳的一种说法</small>{review.betterReply}</blockquote><button onClick={resetRoleplay}>重开一局，再练一次 ↻</button></div>}
      </section>}
    </div>
  );
}
