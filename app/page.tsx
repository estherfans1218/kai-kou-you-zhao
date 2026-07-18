"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cases, categories, type CaseCard, type Category } from "./data/cases";

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

            {activeCase && (
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

            <section className="preview-strip">
              <span className="preview-badge">概念预览</span>
              <h2>这里以后，也会有她们的招</h2>
              <p>匿名分享亲历情境，共同拆解更好的表达方式。</p>
              <button disabled>共建广场 · 即将开放</button>
            </section>
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
              <span className="eyebrow">1 分钟回应挑战</span>
              <span className="step-counter">01 / 03</span>
            </div>
            <h1>领导临下班，<br />又塞来一项任务。</h1>
            <div className="scene-bubble">
              “这个你今晚顺手做一下，明早开会要用，也没多少东西。”
            </div>
            <p className="practice-question">你最想怎么回？</p>
            <div className="practice-options">
              {[
                "好的，我尽量今晚做完。",
                "我手上还有 A 和 B，您希望我先暂停哪一个？",
                "为什么每次都临下班才说？我不做。",
              ].map((option, index) => (
                <button
                  key={option}
                  className={practiceChoice === index ? "practice-option selected" : "practice-option"}
                  onClick={() => setPracticeChoice(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>

            {practiceChoice !== null && (
              <div className={practiceChoice === 1 ? "practice-feedback good" : "practice-feedback"}>
                <strong>{practiceChoice === 1 ? "这一招很稳" : "再想一步"}</strong>
                <p>
                  {practiceChoice === 1
                    ? "你没有直接对抗，而是让任务优先级和责任变得可确认。"
                    : practiceChoice === 0
                      ? "先答应可能让额外工作继续变得理所当然，可以试着要求明确优先级。"
                      : "你的感受很真实，但直接质问可能升级冲突。先把工作取舍说清楚更安全。"}
                </p>
              </div>
            )}

            <section className="voice-preview">
              <span className="preview-badge">概念预览</span>
              <div className="voice-orb">声</div>
              <div>
                <h2>开口练，比默念更有用</h2>
                <p>未来可以用语音模拟真实对话，并获得节奏反馈。</p>
              </div>
            </section>
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
