"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { cases, categories, type CaseCard, type Category } from "./data/cases";
import { storyCases } from "./data/stories";

type SpeechResultEvent = Event & {
  results: {
    length: number;
    [index: number]: { [index: number]: { transcript: string } };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const navItems = [
  { id: "plaza", label: "广场", icon: "✦" },
  { id: "ask", label: "求助", icon: "+" },
  { id: "practice", label: "练习", icon: "◇" },
  { id: "mine", label: "我的", icon: "○" },
] as const;

type NavId = (typeof navItems)[number]["id"];

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavId>("plaza");
  const [category, setCategory] = useState<Category>("推荐");
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [relationship, setRelationship] = useState("同事");
  const [goal, setGoal] = useState("清楚表达");
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [practiceChoice, setPracticeChoice] = useState<number | null>(null);
  const [plazaView, setPlazaView] = useState<"moves" | "stories">("moves");
  const [showSubmission, setShowSubmission] = useState(false);
  const [submissionScene, setSubmissionScene] = useState("");
  const [submissionResponse, setSubmissionResponse] = useState("");
  const [submissionOutcome, setSubmissionOutcome] = useState("");
  const [submissionConsent, setSubmissionConsent] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [submissionError, setSubmissionError] = useState("");
  const [practiceMode, setPracticeMode] = useState<"feynman" | "choice" | "roleplay" | "voice">("feynman");
  const [feynmanHidden, setFeynmanHidden] = useState(false);
  const [feynmanText, setFeynmanText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "done" | "unsupported">("idle");
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("speak-power-saved");
    if (stored) setSaved(JSON.parse(stored));
  }, []);

  const visibleCases = useMemo(
    () =>
      category === "推荐"
        ? cases
        : cases.filter((item) => item.category === category),
    [category],
  );

  const activeCase = visibleCases[Math.min(activeCaseIndex, visibleCases.length - 1)];
  const totalDialogueSteps = 1 + (activeCase?.rounds?.length ?? 0);

  const savedCases = cases.filter((item) => saved.includes(item.id));

  function toggleSave(id: string) {
    setSaved((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      window.localStorage.setItem("speak-power-saved", JSON.stringify(next));
      return next;
    });
  }

  function navigate(id: NavId) {
    setActiveNav(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchCategory(nextCategory: Category) {
    setCategory(nextCategory);
    setActiveCaseIndex(0);
    setDialogueStep(0);
  }

  function moveCase(direction: 1 | -1) {
    setActiveCaseIndex((current) => {
      const next = (current + direction + visibleCases.length) % visibleCases.length;
      return next;
    });
    setDialogueStep(0);
  }

  function openSavedCase(item: CaseCard) {
    const categoryCases = cases.filter((entry) => entry.category === item.category);
    switchCategory(item.category);
    setActiveCaseIndex(Math.max(0, categoryCases.findIndex((entry) => entry.id === item.id)));
    setDialogueStep(1);
    navigate("plaza");
  }

  async function submitStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionStatus("sending");
    setSubmissionError("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: submissionScene,
          response: submissionResponse,
          outcome: submissionOutcome,
          consent: submissionConsent,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "提交失败，请稍后再试");
      setSubmissionStatus("sent");
    } catch (error) {
      setSubmissionStatus("idle");
      setSubmissionError(error instanceof Error ? error.message : "提交失败，请稍后再试");
    }
  }

  function startVoicePractice() {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus("unsupported");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? "";
      }
      setVoiceTranscript(transcript);
    };
    recognition.onerror = () => setVoiceStatus("idle");
    recognition.onend = () => setVoiceStatus((status) => status === "unsupported" ? status : "done");
    setVoiceTranscript("");
    setVoiceStatus("listening");
    recognition.start();
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="phone-stage">
        <header className="topbar">
          <button className="brand" onClick={() => navigate("plaza")}>
            <span className="brand-mark">开</span>
            <span>
              <strong>开口有招</strong>
              <small>看一局，学一招</small>
            </span>
          </button>
          <button className="progress-pill" onClick={() => navigate("mine")}>
            <span>今日</span>
            <strong>{Math.min(saved.length, 9)} 招</strong>
          </button>
        </header>

        {activeNav === "plaza" && (
          <div className="page plaza-page">
            <div className="page-intro">
              <div>
                <span className="eyebrow">招式广场</span>
                <h1>今天，想看<br />哪一种局？</h1>
              </div>
              <div className="intro-stamp" aria-hidden="true">
                <span>03</span>
                <small>分钟<br />带走一招</small>
              </div>
            </div>

            <div className="plaza-tabs" aria-label="广场内容类型">
              <button className={plazaView === "moves" ? "active" : ""} onClick={() => setPlazaView("moves")}>
                <strong>拆招</strong><span>学策略</span>
              </button>
              <button className={plazaView === "stories" ? "active" : ""} onClick={() => setPlazaView("stories")}>
                <strong>案例复盘</strong><span>看真实经过</span>
              </button>
            </div>

            {plazaView === "moves" && (
              <div className="category-row" aria-label="场景分类">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? "category active" : "category"}
                    onClick={() => switchCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {plazaView === "moves" && activeCase && (
              <section
                className="deck-viewer"
                onTouchStart={(event) => {
                  touchStartY.current = event.changedTouches[0]?.clientY ?? null;
                }}
                onTouchEnd={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest(".dialogue-scroll") || touchStartY.current === null) return;
                  const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
                  const distance = touchStartY.current - endY;
                  if (Math.abs(distance) > 65) moveCase(distance > 0 ? 1 : -1);
                  touchStartY.current = null;
                }}
              >
                <div className="deck-status">
                  <span className="content-type">
                    {activeCase.rounds?.length ? `连续局 · ${totalDialogueSteps} 回合` : "单招局"}
                  </span>
                  <span>{String(activeCaseIndex + 1).padStart(2, "0")} / {String(visibleCases.length).padStart(2, "0")}</span>
                </div>

                <article key={activeCase.id} className={`dialogue-card accent-${activeCase.accent}`}>
                  <div className="card-meta">
                    <span className="scene-tag">{activeCase.category} · {activeCase.relation}</span>
                    <span className="risk-tag">{activeCase.risk}</span>
                  </div>

                  <div className="dialogue-scroll" aria-live="polite">
                    <div className="chat-row opponent-row">
                      <span className="speaker">对方</span>
                      <p>{activeCase.quote}</p>
                    </div>

                    {dialogueStep === 0 && (
                      <div className="thinking-prompt">
                        <span>先别急着看答案</span>
                        <strong>如果是你，这一刻会怎么回？</strong>
                      </div>
                    )}

                    {dialogueStep >= 1 && (
                      <div className="turn-pair turn-in">
                        <div className="chat-row self-row">
                          <span className="speaker">你可以说</span>
                          <p>{activeCase.response}</p>
                        </div>
                        <small className="coach-note">招式 · {activeCase.move}</small>
                      </div>
                    )}

                    {activeCase.rounds?.slice(0, Math.max(0, dialogueStep - 1)).map((turn, index) => (
                      <div className="turn-pair turn-in" key={`${activeCase.id}-round-${index}`}>
                        <div className="round-divider"><span>第 {index + 2} 回合</span></div>
                        <div className="chat-row opponent-row">
                          <span className="speaker">对方继续</span>
                          <p>{turn.opponent}</p>
                        </div>
                        <div className="chat-row self-row">
                          <span className="speaker">你可以说</span>
                          <p>{turn.response}</p>
                        </div>
                        <small className="coach-note">教练提示 · {turn.note}</small>
                      </div>
                    ))}

                    {dialogueStep === totalDialogueSteps && (
                      <div className="round-summary turn-in">
                        <span>整局拆解</span>
                        <strong>{activeCase.move}</strong>
                        <p>{activeCase.situation}{activeCase.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="dialogue-actions">
                    {dialogueStep === 0 ? (
                      <button className="round-action" onClick={() => setDialogueStep(1)}>
                        看第一招 <b>↗</b>
                      </button>
                    ) : dialogueStep < totalDialogueSteps ? (
                      <button className="round-action continue" onClick={() => setDialogueStep((step) => step + 1)}>
                        对方又说了… <b>继续第 {dialogueStep + 1} 回合</b>
                      </button>
                    ) : (
                      <div className="completed-actions">
                        <button
                          className={saved.includes(activeCase.id) ? "save-button saved" : "save-button"}
                          onClick={() => toggleSave(activeCase.id)}
                        >
                          {saved.includes(activeCase.id) ? "已收入招式簿 ✓" : "收入招式簿"}
                        </button>
                        <button className="practice-link" onClick={() => navigate("practice")}>换我练一遍 →</button>
                      </div>
                    )}
                  </div>
                </article>

                <div className="deck-controls">
                  <button onClick={() => moveCase(-1)} aria-label="上一局">←</button>
                  <span><i /> 上滑或点击，换一局 <i /></span>
                  <button onClick={() => moveCase(1)} aria-label="下一局">→</button>
                </div>

                {category === "推荐" && activeCaseIndex === 2 && (
                  <button className="mini-challenge" onClick={() => navigate("practice")}>
                    <span>已经看了三局</span>
                    <strong>换你出招 · 1 分钟挑战 ↗</strong>
                  </button>
                )}
              </section>
            )}

            {plazaView === "stories" && (
              <section className="stories-panel">
                <div className="stories-intro">
                  <span className="eyebrow">不是爽文，是复盘</span>
                  <h2>真实情境里，事情后来怎么样了？</h2>
                  <p>看经过、转折和结果，也允许“当时没说好”。公开内容均经过匿名和复合整理。</p>
                </div>

                <div className="story-list">
                  {storyCases.map((story) => (
                    <article className="story-card" key={story.id}>
                      <div className="story-meta"><span>{story.category}</span><small>{story.sourceLabel}</small></div>
                      <h3>{story.title}</h3>
                      <p className="story-summary">{story.summary}</p>
                      <details>
                        <summary>展开完整复盘 <b>＋</b></summary>
                        <div className="story-detail">
                          <span>关键转折</span><p>{story.turningPoint}</p>
                          <span>结果怎么看</span><p>{story.outcome}</p>
                          <strong>{story.lesson}</strong>
                        </div>
                      </details>
                    </article>
                  ))}
                </div>

                <button className="submit-story-trigger" onClick={() => setShowSubmission((open) => !open)}>
                  <span>＋</span>
                  <div><strong>匿名分享一个亲历情境</strong><small>提交后进入待整理箱，不会直接公开</small></div>
                </button>

                {showSubmission && (
                  <form className="submission-form" onSubmit={submitStory}>
                    {submissionStatus === "sent" ? (
                      <div className="submission-success">
                        <span>✓</span><strong>已经收到</strong>
                        <p>内容进入待整理箱，匿名化和结构检查后才能出现在案例复盘中。</p>
                      </div>
                    ) : (
                      <>
                        <label>发生了什么？<textarea required minLength={20} maxLength={1200} value={submissionScene} onChange={(event) => setSubmissionScene(event.target.value)} placeholder="请隐去姓名、公司、门店地址等信息……" /></label>
                        <label>你当时怎么回应的？<textarea maxLength={600} value={submissionResponse} onChange={(event) => setSubmissionResponse(event.target.value)} placeholder="没来得及回应也可以如实写" /></label>
                        <label>后来怎么样了？<textarea maxLength={600} value={submissionOutcome} onChange={(event) => setSubmissionOutcome(event.target.value)} placeholder="事情的结果、你的感受或复盘" /></label>
                        <label className="consent-row"><input type="checkbox" checked={submissionConsent} onChange={(event) => setSubmissionConsent(event.target.checked)} />我已隐去可识别信息，并同意以匿名复合案例方式整理</label>
                        {submissionError && <p className="form-error">{submissionError}</p>}
                        <button className="primary-action" disabled={submissionStatus === "sending" || !submissionConsent || submissionScene.trim().length < 20}>
                          {submissionStatus === "sending" ? "正在提交…" : "提交到待整理箱"}<span>↗</span>
                        </button>
                      </>
                    )}
                  </form>
                )}
              </section>
            )}
          </div>
        )}

        {activeNav === "ask" && (
          <div className="page inner-page">
            <span className="eyebrow">帮我拆局</span>
            <h1>把刚才没说出口的，<br />先写在这里。</h1>
            <p className="privacy-note">请隐去真实姓名、公司和联系方式。第一版不会保存你的输入。</p>

            <label className="input-card">
              <span>发生了什么？</span>
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setShowDemoResult(false);
                }}
                maxLength={180}
                placeholder="例如：同事在会上说我的方案太想当然……"
              />
              <small>{input.length}/180</small>
            </label>

            <ChoiceGroup
              title="对方是谁"
              values={["同事", "上级", "家人", "朋友", "陌生人"]}
              selected={relationship}
              onSelect={setRelationship}
            />
            <ChoiceGroup
              title="我想要"
              values={["清楚表达", "拒绝要求", "设立边界", "保持关系"]}
              selected={goal}
              onSelect={setGoal}
            />

            <button
              className="primary-action"
              disabled={!input.trim()}
              onClick={() => setShowDemoResult(true)}
            >
              帮我拆局 <span>↗</span>
            </button>

            {showDemoResult && (
              <section className="demo-result">
                <div className="demo-head">
                  <span>界面演示</span>
                  <small>AI 策略引擎将在下一阶段接入</small>
                </div>
                <p className="demo-analysis">这是一个需要在“{relationship}关系”里“{goal}”的情境。</p>
                <div className="move-chip">推荐路径 · 先澄清，再表达边界</div>
                <p className="response-line">“我想先确认一下，你具体指的是哪件事？我们把事实说清楚，再讨论下一步。”</p>
                <div className="reason-line">
                  <span>为什么有效</span>
                  <p>先减慢节奏，不在压力下接受对方给出的结论。</p>
                </div>
              </section>
            )}
          </div>
        )}

        {activeNav === "practice" && (
          <div className="page inner-page practice-page">
            <div className="practice-heading">
              <span className="eyebrow">表达练习场</span>
              <span className="step-counter">学会 ≠ 会用</span>
            </div>
            <h1>把看懂的一招，<br />练成自己的话。</h1>

            <div className="practice-mode-tabs">
              {[
                ["feynman", "费曼复述", "讲明白"],
                ["choice", "选择挑战", "做判断"],
                ["roleplay", "自由对练", "接回合"],
                ["voice", "开口练", "说出来"],
              ].map(([id, title, hint]) => (
                <button key={id} className={practiceMode === id ? "active" : ""} onClick={() => setPracticeMode(id as typeof practiceMode)}>
                  <strong>{title}</strong><small>{hint}</small>
                </button>
              ))}
            </div>

            {practiceMode === "feynman" && (
              <section className="feynman-practice">
                <div className="method-label">费曼学习法 · 看懂 → 隐藏 → 讲给别人听 → 查漏</div>
                {!feynmanHidden ? (
                  <div className="feynman-source">
                    <span>今天要讲明白的一招</span>
                    <h2>为什么“要求具体化”能应对模糊否定？</h2>
                    <p>当对方只说“你不专业”“想得太简单”，你不需要证明自己没有问题。请对方指出具体环节和依据，才能把人身评价重新变成可讨论的事实。</p>
                    <button className="primary-action" onClick={() => setFeynmanHidden(true)}>我看懂了，隐藏答案 <span>↗</span></button>
                  </div>
                ) : (
                  <div className="feynman-recall">
                    <span>现在请用自己的话讲给一个朋友听</span>
                    <h2>它解决了什么？为什么有效？什么时候不适合用？</h2>
                    <textarea value={feynmanText} onChange={(event) => setFeynmanText(event.target.value)} placeholder="不要背原话，像解释给完全不了解的人一样……" />
                    {feynmanText.length >= 30 && (
                      <div className="feynman-check">
                        <strong>自查三个点</strong>
                        <span>□ 有没有说清对方用了什么方式？</span>
                        <span>□ 有没有讲明这招如何改变局面？</span>
                        <span>□ 有没有提到权力差异和使用风险？</span>
                      </div>
                    )}
                    <div className="recall-actions">
                      <button onClick={() => setFeynmanHidden(false)}>回看参考</button>
                      <button onClick={() => { setFeynmanText(""); setFeynmanHidden(false); }}>换一招</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {practiceMode === "choice" && (
              <section className="choice-practice">
                <div className="scene-bubble">“这个你今晚顺手做一下，明早开会要用，也没多少东西。”</div>
                <p className="practice-question">你最想怎么回？</p>
                <div className="practice-options">
                  {["好的，我尽量今晚做完。", "我手上还有 A 和 B，您希望我先暂停哪一个？", "为什么每次都临下班才说？我不做。"].map((option, index) => (
                    <button key={option} className={practiceChoice === index ? "practice-option selected" : "practice-option"} onClick={() => setPracticeChoice(index)}>
                      <span>{String.fromCharCode(65 + index)}</span>{option}
                    </button>
                  ))}
                </div>
                {practiceChoice !== null && (
                  <div className={practiceChoice === 1 ? "practice-feedback good" : "practice-feedback"}>
                    <strong>{practiceChoice === 1 ? "这一招很稳" : "再想一步"}</strong>
                    <p>{practiceChoice === 1 ? "你让任务优先级和责任变得可确认。" : practiceChoice === 0 ? "先答应可能让额外工作继续变得理所当然。" : "感受真实，但直接质问可能升级冲突。先把工作取舍说清楚更安全。"}</p>
                  </div>
                )}
              </section>
            )}

            {practiceMode === "roleplay" && (
              <section className="roleplay-preview">
                <span className="preview-badge">AI 接入下一步</span>
                <div className="roleplay-lines"><p>对方：你是不是对我的安排有意见？</p><p>你：输入自己的回应后，对方会继续追问。</p></div>
                <h2>自由回答，对方根据你的话继续出招</h2>
                <p>结束后从目标、边界、关系成本和表达清晰度四个维度复盘。</p>
                <button disabled>动态对练 · 即将接入</button>
              </section>
            )}

            {practiceMode === "voice" && (
              <section className="voice-practice">
                <div className="voice-scenario">“我只是把你的私聊截图发群里，又没说你坏话，至于吗？”</div>
                <div className={voiceStatus === "listening" ? "voice-orb listening" : "voice-orb"}>声</div>
                <h2>{voiceStatus === "listening" ? "正在听你说…" : "不开麦克风权限，也能使用其他练习"}</h2>
                <p>语音只用于浏览器实时转写，本版不上传或保存音频。</p>
                <button className="primary-action" onClick={startVoicePractice} disabled={voiceStatus === "listening"}>
                  {voiceStatus === "listening" ? "请直接说出回应" : "开始开口练"}<span>↗</span>
                </button>
                {voiceStatus === "unsupported" && <div className="practice-feedback">当前浏览器不支持实时语音识别，请使用最新版 Chrome 或 Edge，或改用费曼复述。</div>}
                {voiceTranscript && <div className="voice-transcript"><span>你刚才说</span><p>{voiceTranscript}</p><small>再读一遍：有没有明确提出“撤回”和“以后先征得同意”？</small></div>}
              </section>
            )}
          </div>
        )}

        {activeNav === "mine" && (
          <div className="page inner-page mine-page">
            <span className="eyebrow">我的招式簿</span>
            <h1>慢慢练成，<br />自己的说法。</h1>
            <div className="progress-board">
              <div><strong>{saved.length}</strong><span>已收招式</span></div>
              <div><strong>{practiceChoice === null ? 0 : 1}</strong><span>完成练习</span></div>
              <div><strong>6</strong><span>可学框架</span></div>
            </div>

            <h2 className="section-title">最近收下的招</h2>
            {savedCases.length ? (
              <div className="saved-list">
                {savedCases.map((item) => (
                  <button key={item.id} onClick={() => openSavedCase(item)}>
                    <span>{item.move}</span>
                    <p>{item.response}</p>
                    <b>↗</b>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>还没有收下任何招</span>
                <p>去广场拆开一张情境卡，把有用的表达放进这里。</p>
                <button onClick={() => navigate("plaza")}>去看一局</button>
              </div>
            )}

            <section className="preview-grid">
              <div>
                <span className="preview-badge">概念预览</span>
                <strong>情境复盘</strong>
                <p>记录用了哪一招，以及后来发生了什么。</p>
              </div>
              <div>
                <span className="preview-badge">概念预览</span>
                <strong>我的表达风格</strong>
                <p>从练习中长出更像你自己的语言。</p>
              </div>
            </section>
          </div>
        )}

        <nav className="bottom-nav" aria-label="主要导航">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${activeNav === item.id ? "active" : ""} ${item.id === "ask" ? "ask-nav" : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={activeNav === item.id ? "page" : undefined}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
      </section>

      <aside className="desktop-note">
        <span className="eyebrow">开口有招 · MVP</span>
        <h2>不是替你说，<br />是陪你练成自己的说法。</h2>
        <p>每次三分钟：看一局、拆一招、练一遍。少刷一点情绪，多带走一种能力。</p>
        <div className="desktop-legend">
          <span><i className="dot violet" /> 真实可体验</span>
          <span><i className="dot coral" /> 概念预览</span>
        </div>
      </aside>
    </main>
  );
}

function ChoiceGroup({
  title,
  values,
  selected,
  onSelect,
}: {
  title: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset className="choice-group">
      <legend>{title}</legend>
      <div>
        {values.map((value) => (
          <button
            type="button"
            key={value}
            className={selected === value ? "selected" : ""}
            onClick={() => onSelect(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
