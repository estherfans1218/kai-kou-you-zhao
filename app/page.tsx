"use client";

import { useMemo, useRef, useState } from "react";

import { PracticeCenter } from "./components/PracticeCenter";
import { PublishCenter } from "./components/PublishCenter";
import { RealPlaza } from "./components/RealPlaza";
import { MySubmissions } from "./components/MySubmissions";
import { moves, moveCategories, type MoveCard, type MoveCategory } from "./data/moves";

const navItems = [
  { id: "plaza", label: "广场", icon: "✦" },
  { id: "ask", label: "发布", icon: "+" },
  { id: "practice", label: "练习", icon: "◇" },
  { id: "mine", label: "我的", icon: "○" },
] as const;

type NavId = (typeof navItems)[number]["id"];

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavId>("plaza");
  const [category, setCategory] = useState<MoveCategory>("全部");
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(window.localStorage.getItem("speak-power-saved") ?? "[]") as string[];
      return stored.filter((id) => moves.some((move) => move.id === id));
    }
    catch { return []; }
  });
  const [plazaView, setPlazaView] = useState<"moves" | "stories">("moves");
  const touchStartY = useRef<number | null>(null);

  const visibleMoves = useMemo(
    () =>
      category === "全部"
        ? moves
        : moves.filter((item) => item.category === category),
    [category],
  );

  const activeMove = visibleMoves[Math.min(activeCaseIndex, visibleMoves.length - 1)];
  const activeBranch = selectedBranch === null ? null : activeMove?.branches[selectedBranch];
  const savedMoves = moves.filter((item) => saved.includes(item.id));

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

  function switchCategory(nextCategory: MoveCategory) {
    setCategory(nextCategory);
    setActiveCaseIndex(0);
    setDialogueStep(0);
    setSelectedBranch(null);
  }

  function moveCase(direction: 1 | -1) {
    setActiveCaseIndex((current) => {
      const next = (current + direction + visibleMoves.length) % visibleMoves.length;
      return next;
    });
    setDialogueStep(0);
    setSelectedBranch(null);
  }

  function openSavedMove(item: MoveCard) {
    const categoryMoves = moves.filter((entry) => entry.category === item.category);
    switchCategory(item.category);
    setActiveCaseIndex(Math.max(0, categoryMoves.findIndex((entry) => entry.id === item.id)));
    setDialogueStep(1);
    navigate("plaza");
  }

  function openMoveFromStory(moveId: string) {
    const item = moves.find((entry) => entry.id === moveId);
    if (!item) return;
    const categoryMoves = moves.filter((entry) => entry.category === item.category);
    setPlazaView("moves");
    setCategory(item.category);
    setActiveCaseIndex(Math.max(0, categoryMoves.findIndex((entry) => entry.id === item.id)));
    setDialogueStep(1);
    setSelectedBranch(null);
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
                <h1>今天，想练<br />哪一种招？</h1>
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
                <strong>真实局</strong><span>看具体回答</span>
              </button>
            </div>

            {plazaView === "moves" && (
              <div className="category-row" aria-label="场景分类">
                {moveCategories.map((item) => (
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

            {plazaView === "moves" && activeMove && (
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
                  <span className="content-type">四路连续招 · 3 回合</span>
                  <span>{String(activeCaseIndex + 1).padStart(2, "0")} / {String(visibleMoves.length).padStart(2, "0")}</span>
                </div>

                <article key={activeMove.id} className={`dialogue-card move-dialogue-card accent-${activeMove.accent}`}>
                  <div className="card-meta">
                    <span className="scene-tag">第 {activeMove.number} 招 · {activeMove.name}</span>
                    <span className="risk-tag">{activeMove.risk}</span>
                  </div>

                  <div className="dialogue-scroll" aria-live="polite">
                    <div className="move-intro-line">
                      <span>{activeMove.category}</span>
                      <strong>{activeMove.short}</strong>
                      <small>{activeMove.opening.scene} · {activeMove.opening.relation}</small>
                    </div>
                    <div className="chat-row opponent-row">
                      <span className="speaker">对方</span>
                      <p>{activeMove.opening.opponent}</p>
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
                          <p>{activeMove.opening.response}</p>
                        </div>
                        <small className="coach-note">第 1 回合 · {activeMove.opening.note}</small>
                      </div>
                    )}

                    {dialogueStep === 1 && selectedBranch === null && (
                      <div className="branch-picker turn-in">
                        <span>对方接下来可能怎么走？</span>
                        <div>{activeMove.branches.map((branch, index) => (
                          <button key={branch.label} onClick={() => { setSelectedBranch(index); setDialogueStep(2); }}>
                            <small>路径 {index + 1}</small><strong>{branch.label}</strong>
                          </button>
                        ))}</div>
                      </div>
                    )}

                    {activeBranch && dialogueStep >= 2 && (
                      <div className="turn-pair turn-in">
                        <div className="round-divider"><span>第 2 回合 · {activeBranch.label}</span></div>
                        <div className="chat-row opponent-row">
                          <span className="speaker">对方继续</span>
                          <p>{activeBranch.opponent}</p>
                        </div>
                        <div className="chat-row self-row">
                          <span className="speaker">你可以说</span>
                          <p>{activeBranch.response}</p>
                        </div>
                        <small className="coach-note">教练提示 · {activeBranch.note}</small>
                      </div>
                    )}

                    {activeBranch && dialogueStep >= 3 && (
                      <div className="turn-pair turn-in">
                        <div className="round-divider"><span>第 3 回合 · 收束</span></div>
                        <div className="chat-row opponent-row">
                          <span className="speaker">对方再说</span>
                          <p>{activeBranch.closing.opponent}</p>
                        </div>
                        <div className="chat-row self-row">
                          <span className="speaker">你可以说</span>
                          <p>{activeBranch.closing.response}</p>
                        </div>
                        <small className="coach-note">收束提示 · {activeBranch.closing.note}</small>
                      </div>
                    )}

                    {dialogueStep === 3 && (
                      <div className="move-learning turn-in">
                        <div className="round-summary">
                          <span>这一招的骨架</span>
                          <strong>{activeMove.formula}</strong>
                          <p>{activeMove.goal}</p>
                        </div>
                        <details className="method-evidence">
                          <summary>查看方法依据与风险边界 <b>＋</b></summary>
                          <div><span>识别信号</span><p>{activeMove.pattern}</p></div>
                          <div><span>底层依据</span>{activeMove.theory.map((item) => <p key={item}>· {item}</p>)}</div>
                          <div><span>权力关系</span><p>{activeMove.power}</p></div>
                          <div className="risk-boundary"><span>什么时候不要硬用</span><p>{activeMove.riskBoundary}</p></div>
                        </details>
                      </div>
                    )}
                  </div>

                  <div className="dialogue-actions">
                    {dialogueStep === 0 ? (
                      <button className="round-action" onClick={() => setDialogueStep(1)}>
                        看第一招 <b>↗</b>
                      </button>
                    ) : dialogueStep === 1 && selectedBranch === null ? (
                      <div className="branch-action-hint">选择一种对方反应，继续拆招</div>
                    ) : dialogueStep === 2 ? (
                      <button className="round-action continue" onClick={() => setDialogueStep(3)}>
                        对方还没停… <b>看第 3 回合</b>
                      </button>
                    ) : (
                      <div className="move-final-actions">
                        <button className="branch-retry" onClick={() => { setSelectedBranch(null); setDialogueStep(1); }}>↻ 换一种对方反应</button>
                        <div className="completed-actions">
                          <button
                            className={saved.includes(activeMove.id) ? "save-button saved" : "save-button"}
                            onClick={() => toggleSave(activeMove.id)}
                          >
                            {saved.includes(activeMove.id) ? "已收入招式簿 ✓" : "收入招式簿"}
                          </button>
                          <button className="practice-link" onClick={() => navigate("practice")}>换我练一遍 →</button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>

                <div className="deck-controls">
                  <button onClick={() => moveCase(-1)} aria-label="上一局">←</button>
                  <span><i /> 上滑或点击，换一局 <i /></span>
                  <button onClick={() => moveCase(1)} aria-label="下一局">→</button>
                </div>

                {category === "全部" && activeCaseIndex === 2 && (
                  <button className="mini-challenge" onClick={() => navigate("practice")}>
                    <span>已经拆了三招</span>
                    <strong>换你出招 · 1 分钟挑战 ↗</strong>
                  </button>
                )}
              </section>
            )}

            {plazaView === "stories" && <RealPlaza onPublish={() => navigate("ask")} onOpenMove={openMoveFromStory} />}
          </div>
        )}

        {activeNav === "ask" && <PublishCenter onPublished={() => { setPlazaView("stories"); navigate("plaza"); }} />}

        {activeNav === "practice" && <PracticeCenter />}

        {activeNav === "mine" && (
          <div className="page inner-page mine-page">
            <span className="eyebrow">我的招式簿</span>
            <h1>慢慢练成，<br />自己的说法。</h1>
            <div className="progress-board">
              <div><strong>{saved.length}</strong><span>已收招式</span></div>
              <div><strong>3</strong><span>完成练习</span></div>
              <div><strong>8</strong><span>核心招式</span></div>
            </div>

            <h2 className="section-title">最近收下的招</h2>
            {savedMoves.length ? (
              <div className="saved-list">
                {savedMoves.map((item) => (
                  <button key={item.id} onClick={() => openSavedMove(item)}>
                    <span>{item.number} · {item.name}</span>
                    <p>{item.formula}</p>
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

            <MySubmissions onView={() => { setPlazaView("stories"); navigate("plaza"); }} />

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

    </main>
  );
}
