"use client";

import { useEffect, useMemo, useState } from "react";

type Category = "推荐" | "职场" | "家庭" | "社交" | "边界";

type CaseCard = {
  id: string;
  category: Exclude<Category, "推荐">;
  relation: string;
  risk: "低风险" | "需判断" | "先保安全";
  quote: string;
  situation: string;
  move: string;
  response: string;
  reason: string;
  accent: "violet" | "coral" | "mint" | "yellow";
};

const cases: CaseCard[] = [
  {
    id: "case-01",
    category: "职场",
    relation: "平级同事",
    risk: "低风险",
    quote: "这个方案是不是有点想当然了？能力不够就别硬撑。",
    situation: "对方用笼统评价，当众否定你的专业能力。",
    move: "要求具体化",
    response: "具体是哪一部分让你觉得想当然？我们可以直接看数据。",
    reason: "不接情绪，把举证责任推回对方。",
    accent: "violet",
  },
  {
    id: "case-02",
    category: "家庭",
    relation: "长辈",
    risk: "需判断",
    quote: "女孩子别那么拼，找个好人嫁了才是正经事。",
    situation: "关心被包装成对你人生选择的否定。",
    move: "接住关心，再划界",
    response: "我知道你是关心我，但什么生活适合我，我想自己决定。",
    reason: "承认善意，不等于交出决定权。",
    accent: "coral",
  },
  {
    id: "case-03",
    category: "社交",
    relation: "朋友",
    risk: "低风险",
    quote: "开个玩笑而已，你怎么这么敏感？",
    situation: "对方把越界说成玩笑，再把责任推给你。",
    move: "命名感受",
    response: "好不好笑可以有分歧，但我已经说了这让我不舒服。",
    reason: "不争论动机，只确认你的真实感受。",
    accent: "yellow",
  },
  {
    id: "case-04",
    category: "边界",
    relation: "群聊成员",
    risk: "需判断",
    quote: "你不回复，那我们就当你默认同意了。",
    situation: "对方用时间压力，替你做出决定。",
    move: "拒绝被代答",
    response: "没有回复不代表同意。这件事我需要确认后再给答复。",
    reason: "拿回解释权，也为自己争取判断时间。",
    accent: "mint",
  },
  {
    id: "case-05",
    category: "职场",
    relation: "直属上级",
    risk: "需判断",
    quote: "这个任务你顺手做一下，也花不了多少时间。",
    situation: "额外工作被说得很轻，原有优先级却没有调整。",
    move: "确认优先级",
    response: "可以，我手上还有 A 和 B，您希望我先暂停哪一个？",
    reason: "不直接对抗，把取舍变成明确的工作决策。",
    accent: "violet",
  },
  {
    id: "case-06",
    category: "家庭",
    relation: "家人",
    risk: "低风险",
    quote: "我们还不都是为了你好，你怎么一点都不领情？",
    situation: "关心与服从被绑定在了一起。",
    move: "分开感谢与决定",
    response: "我知道你们担心我，也感谢你们，但最后的决定还是要由我承担。",
    reason: "感谢关系里的付出，同时保留选择权。",
    accent: "coral",
  },
  {
    id: "case-07",
    category: "边界",
    relation: "陌生人",
    risk: "先保安全",
    quote: "美女，笑一个嘛，别这么不给面子。",
    situation: "陌生人用起哄逼迫你配合互动。",
    move: "短句离场",
    response: "不需要。请让开。",
    reason: "危险不明时不解释，优先缩短接触时间。",
    accent: "mint",
  },
  {
    id: "case-08",
    category: "社交",
    relation: "饭局熟人",
    risk: "需判断",
    quote: "大家都喝了，你不喝是不是看不起我们？",
    situation: "个人选择被偷换成对关系的态度。",
    move: "拒绝错误前提",
    response: "我今天不喝酒，但不影响我认真和大家吃这顿饭。",
    reason: "拒绝被二选一，重新定义你的参与方式。",
    accent: "yellow",
  },
];

const categories: Category[] = ["推荐", "职场", "家庭", "社交", "边界"];
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [relationship, setRelationship] = useState("同事");
  const [goal, setGoal] = useState("清楚表达");
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [practiceChoice, setPracticeChoice] = useState<number | null>(null);

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
                  onClick={() => {
                    setCategory(item);
                    setExpanded(null);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="case-feed">
              {visibleCases.map((item, index) => (
                <div key={item.id}>
                  <article className={`case-card accent-${item.accent} ${expanded === item.id ? "is-open" : ""}`}>
                    <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="card-meta">
                      <span className="scene-tag">{item.category} · {item.relation}</span>
                      <span className={`risk-tag risk-${item.risk}`}>{item.risk}</span>
                    </div>

                    <div className="quote-wrap">
                      <span className="quote-mark">“</span>
                      <blockquote>{item.quote}</blockquote>
                    </div>

                    {expanded !== item.id ? (
                      <div className="card-prompt">
                        <span>如果是你，会怎么回？</span>
                        <button
                          className="reveal-button"
                          aria-expanded="false"
                          onClick={() => setExpanded(item.id)}
                        >
                          看看怎么拆 <b>↗</b>
                        </button>
                      </div>
                    ) : (
                      <div className="answer-panel">
                        <button className="collapse-button" onClick={() => setExpanded(null)} aria-label="收起解析">收起 −</button>
                        <div className="situation-line">
                          <small>这是什么局</small>
                          <p>{item.situation}</p>
                        </div>
                        <div className="move-chip">推荐招式 · {item.move}</div>
                        <p className="response-line">{item.response}</p>
                        <div className="reason-line">
                          <span>为什么有效</span>
                          <p>{item.reason}</p>
                        </div>
                        <div className="answer-actions">
                          <button
                            className={saved.includes(item.id) ? "save-button saved" : "save-button"}
                            onClick={() => toggleSave(item.id)}
                          >
                            {saved.includes(item.id) ? "已收入招式簿 ✓" : "收入招式簿"}
                          </button>
                          <button className="practice-link" onClick={() => navigate("practice")}>练一遍 →</button>
                        </div>
                      </div>
                    )}
                  </article>

                  {index === 2 && category === "推荐" && (
                    <button className="challenge-card" onClick={() => navigate("practice")}>
                      <span className="challenge-kicker">刷了三局，换你出招</span>
                      <strong>1 分钟回应挑战</strong>
                      <span className="challenge-arrow">开始练习 ↗</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

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
                  <button key={item.id} onClick={() => { navigate("plaza"); setCategory(item.category); setExpanded(item.id); }}>
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
