import React, { useState, useEffect, useRef } from "react";
import {
  Volume2, Star, Settings, X, Send, Sparkles, Check, RotateCcw,
  Heart, ArrowLeft, Delete, Eye, Type, Palette, Bell,
  Calculator, BookOpen, Pencil, Sprout
} from "lucide-react";

/*
  LearnBuddy — an accessible, all-subject tutor with an AI helper ("Ollie").
  Designed with three groups of learners in mind:
    • Autism      -> predictable layout, calm colors, literal language, optional pictures, sound control
    • ADHD/focus  -> one task at a time, short steps, instant gentle feedback, visible progress/streak
    • Dyslexia    -> read-aloud everywhere, generous spacing mode, off-white backgrounds, big legible text

  SCALING TO ALL SUBJECTS:
  Every subject is just a config object in SUBJECTS below. A subject declares a `mode`:
    - "math"   -> auto-generated arithmetic, number pad, and dot pictures
    - "choice" -> multiple-choice questions pulled from its `bank`
  To add a subject later (History, Geography, etc.), add one object with a question bank.
  No other code needs to change. Ollie automatically adapts to whatever subject is active.
*/

// ---------- Color themes (off-white, not pure white, reduces glare for dyslexic readers) ----------
const THEMES = {
  calm: {
    name: "Calm",
    bg: "#FBF6EC", panel: "#FFFDF8", text: "#2D3A3A", sub: "#5C6B6B",
    primary: "#3E8E7E", primarySoft: "#DCEFEA", accent: "#F2A65A",
    correct: "#3E8E7E", correctSoft: "#DDEFE9", gentle: "#E9A23B",
    border: "#E4DBC9", chipBg: "#F1EAD8",
  },
  dark: {
    name: "Soft Dark",
    bg: "#1F2630", panel: "#283039", text: "#EAF0F2", sub: "#9FB0B8",
    primary: "#69C9B5", primarySoft: "#2C3D3B", accent: "#F2A65A",
    correct: "#69C9B5", correctSoft: "#27403B", gentle: "#F2C079",
    border: "#37424D", chipBg: "#313B45",
  },
  contrast: {
    name: "High Contrast",
    bg: "#FFFFFF", panel: "#FFFFFF", text: "#000000", sub: "#1A1A1A",
    primary: "#005FCC", primarySoft: "#D9E8FF", accent: "#B33A00",
    correct: "#006B2D", correctSoft: "#D7F0DF", gentle: "#8A4B00",
    border: "#000000", chipBg: "#EFEFEF",
  },
};

// ---------- Subject configuration (add subjects here — that's the whole job) ----------
const MATH_TOPICS = [
  { id: "add", sign: "+" },
  { id: "sub", sign: "−" },
  { id: "mul", sign: "×" },
];

const SUBJECTS = [
  {
    id: "math", label: "Math", icon: Calculator, mode: "math",
    blurb: "Add, subtract, and times tables",
  },
  {
    id: "reading", label: "Reading", icon: BookOpen, mode: "choice",
    blurb: "Words and meanings",
    bank: [
      { q: "Which word means 'happy'?", options: ["Glad", "Tired", "Angry", "Cold"], answer: "Glad" },
      { q: "Which word is the opposite of 'big'?", options: ["Small", "Huge", "Tall", "Wide"], answer: "Small" },
      { passage: "The dog ran fast.", q: "What did the dog do?", options: ["Ran", "Ate", "Slept", "Sang"], answer: "Ran" },
      { passage: "Mia has a red ball.", q: "What color is the ball?", options: ["Red", "Blue", "Green", "Black"], answer: "Red" },
      { q: "Pick the word that rhymes with 'cat'.", options: ["Hat", "Dog", "Sun", "Cup"], answer: "Hat" },
      { q: "Which word means 'fast'?", options: ["Quick", "Slow", "Soft", "Late"], answer: "Quick" },
    ],
  },
  {
    id: "spelling", label: "Spelling", icon: Pencil, mode: "choice",
    blurb: "Pick the right spelling",
    bank: [
      { q: "Which is spelled correctly?", options: ["Freind", "Friend", "Frend", "Friind"], answer: "Friend" },
      { q: "Which is spelled correctly?", options: ["Becuase", "Because", "Becase", "Becouse"], answer: "Because" },
      { q: "Which is spelled correctly?", options: ["Hapy", "Happy", "Happi", "Hapyy"], answer: "Happy" },
      { q: "Which is spelled correctly?", options: ["Scool", "School", "Schol", "Skool"], answer: "School" },
      { q: "Which is spelled correctly?", options: ["Beutiful", "Beautiful", "Beutifull", "Beautifull"], answer: "Beautiful" },
      { q: "Which is spelled correctly?", options: ["Thay", "They", "Thaye", "Theigh"], answer: "They" },
    ],
  },
  {
    id: "science", label: "Science", icon: Sprout, mode: "choice",
    blurb: "Fun facts about the world",
    bank: [
      { q: "What do plants need to grow?", options: ["Sunlight", "Darkness", "Candy", "Ice"], answer: "Sunlight" },
      { q: "How many legs does a spider have?", options: ["8", "6", "4", "10"], answer: "8" },
      { q: "What do we breathe in to live?", options: ["Oxygen", "Smoke", "Sand", "Glass"], answer: "Oxygen" },
      { q: "Which one is a planet?", options: ["Mars", "Spoon", "River", "Cloud"], answer: "Mars" },
      { q: "Water freezes into what?", options: ["Ice", "Steam", "Sand", "Wood"], answer: "Ice" },
      { q: "Where do fish live?", options: ["Water", "Trees", "Sky", "Caves"], answer: "Water" },
    ],
  },
];

const LEVELS = [
  { id: "easy", label: "Easy", max: 6 },
  { id: "medium", label: "Medium", max: 10 },
  { id: "hard", label: "Hard", max: 12 },
];

function randInt(n) { return Math.floor(Math.random() * n) + 1; }

function makeMathProblem(level) {
  const max = LEVELS.find((l) => l.id === level).max;
  const topic = MATH_TOPICS[Math.floor(Math.random() * MATH_TOPICS.length)];
  let a = randInt(max), b = randInt(max);
  if (topic.id === "sub" && b > a) [a, b] = [b, a]; // keep answers non-negative
  const answer = topic.id === "add" ? a + b : topic.id === "sub" ? a - b : a * b;
  return { mode: "math", a, b, topic: topic.id, sign: topic.sign, answer, id: Math.random() };
}

function makeChoiceItem(subject, prev) {
  const bank = subject.bank;
  let idx = Math.floor(Math.random() * bank.length);
  if (bank.length > 1 && prev && bank[idx].q === prev.q) idx = (idx + 1) % bank.length;
  return { mode: "choice", subject: subject.id, id: Math.random(), ...bank[idx] };
}

function makeItem(subjectId, level, prev) {
  const subj = SUBJECTS.find((s) => s.id === subjectId);
  return subj.mode === "math" ? makeMathProblem(level) : makeChoiceItem(subj, prev);
}

export default function App() {
  // Friendly + highly legible fonts (Fredoka headings, Lexend body — Lexend is designed to
  // improve reading fluency). Robust fallbacks in case the network blocks the load.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Lexend:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  const [screen, setScreen] = useState("home"); // home | practice
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    textScale: 1, dyslexia: false, calm: false, sound: true, pictures: true, theme: "calm",
  });

  const [subject, setSubject] = useState("math");
  const [level, setLevel] = useState("easy");
  const [current, setCurrent] = useState(() => makeItem("math", "easy"));
  const [response, setResponse] = useState(""); // typed digits (math) OR selected option (choice)
  const [status, setStatus] = useState(null);   // null | 'right' | 'wrong'
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  const subjectObj = SUBJECTS.find((s) => s.id === subject);
  const t = THEMES[settings.theme];
  const baseSize = 18 * settings.textScale;
  const ls = settings.dyslexia ? "0.05em" : "0";
  const ws = settings.dyslexia ? "0.14em" : "normal";
  const lh = settings.dyslexia ? 1.85 : 1.5;
  const trans = settings.calm ? "none" : "all 0.18s ease";
  const bodyFont = '"Lexend", "Segoe UI", "Helvetica Neue", system-ui, sans-serif';
  const headFont = '"Fredoka", "Lexend", system-ui, sans-serif';

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: settings.calm ? "auto" : "smooth" });
  }, [messages, chatOpen, thinking, settings.calm]);

  // ---------- Sound + speech ----------
  function chime() {
    if (!settings.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        const start = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
        o.start(start); o.stop(start + 0.34);
      });
    } catch (e) { /* ignore */ }
  }

  function speak(text) {
    if (!settings.sound || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92; u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  }

  function readCurrentAloud() {
    if (current.mode === "math") {
      const word = current.sign === "×" ? "times" : current.sign === "−" ? "minus" : "plus";
      speak(`What is ${current.a} ${word} ${current.b}?`);
    } else {
      const intro = current.passage ? current.passage + ". " : "";
      speak(`${intro}${current.q} Your choices are: ${current.options.join(", ")}.`);
    }
  }

  // ---------- Practice flow ----------
  function startPractice() {
    setCurrent(makeItem(subject, level));
    setResponse(""); setStatus(null); setScreen("practice");
  }

  function pressKey(k) {
    if (status === "right") return;
    setStatus(null);
    if (k === "back") setResponse((p) => p.slice(0, -1));
    else if (k === "clear") setResponse("");
    else if (response.length < 4) setResponse((p) => p + k);
  }

  function selectOption(opt) {
    if (status === "right") return;
    setStatus(null);
    setResponse(opt);
  }

  function check() {
    if (response === "") return;
    const ok = current.mode === "math"
      ? parseInt(response, 10) === current.answer
      : response === current.answer;
    if (ok) {
      setStatus("right"); setStars((s) => s + 1); setStreak((s) => s + 1);
      chime(); if (settings.sound) speak("Great job!");
    } else {
      setStatus("wrong"); setStreak(0);
    }
  }

  function nextItem() {
    setCurrent(makeItem(subject, level, current));
    setResponse(""); setStatus(null);
  }

  // ---------- AI helper (Ollie) ----------
  function ollieSystemPrompt() {
    const rules = [
      "You are Ollie, a warm, patient learning helper for children who learn differently,",
      "including kids with autism, ADHD, and dyslexia.",
      "RULES:",
      "- Use very short, simple sentences. One idea per sentence.",
      "- Be kind and encouraging. Celebrate effort, not just correct answers.",
      "- NEVER just give the final answer. Give ONE small hint at a time, then ask a gentle guiding question.",
      "- Use concrete, everyday examples a child can picture.",
      "- Be literal and clear. Avoid idioms, sarcasm, and figurative language.",
      "- If the child seems stuck or upset, slow down and reassure them first.",
      "- Keep every reply to 1 to 3 short sentences.",
    ];
    let ctx;
    if (current.mode === "math") {
      ctx = `Right now the child is working on this math problem: ${current.a} ${current.sign} ${current.b}.`;
    } else {
      const intro = current.passage ? `They first read: "${current.passage}". ` : "";
      ctx = `${intro}The child is working on this ${subjectObj.label} question: "${current.q}". ` +
        `The choices are: ${current.options.join(", ")}. Do not say which choice is correct — help them figure it out.`;
    }
    return [...rules, ctx].join(" ");
  }

  async function sendToOllie(text) {
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    const next = [...messages, { role: "user", text }];
    setMessages(next); setChatInput(""); setThinking(true);
    try {
      // Calls our own backend (api/chat.js), which holds the secret API key.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: ollieSystemPrompt(),
          messages: [...history, { role: "user", content: text }],
        }),
      });
      const data = await res.json();
      const reply = (data.content || [])
        .map((c) => (c.type === "text" ? c.text : "")).filter(Boolean).join("\n").trim();
      setMessages([...next, { role: "assistant", text: reply || "Let's try together. What part feels tricky?" }]);
    } catch (e) {
      setMessages([...next, {
        role: "assistant",
        text: "I'm having a little trouble connecting right now. Take a breath and try again in a moment. You've got this!",
      }]);
    } finally {
      setThinking(false);
    }
  }

  function openChat() {
    setChatOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: "assistant", text: "Hi, I'm Ollie! I can help with any subject. What would you like help with?" }]);
    }
  }

  // ---------- Shared styles ----------
  const card = (extra = {}) => ({
    background: t.panel, border: `2px solid ${t.border}`, borderRadius: 20,
    padding: 18, transition: trans, ...extra,
  });
  const btn = (bg, fg, extra = {}) => ({
    background: bg, color: fg, border: `2px solid ${t.border === "#000000" ? "#000" : "transparent"}`,
    borderRadius: 16, padding: "14px 20px", font: `600 ${baseSize}px ${bodyFont}`,
    cursor: "pointer", transition: trans, ...extra,
  });

  // ---------- Dot pictures for math (concrete representation of small numbers) ----------
  function Dots() {
    if (!settings.pictures || current.mode !== "math") return null;
    const small = current.a <= 12 && current.b <= 12 && (current.topic !== "mul" || current.a * current.b <= 30);
    if (!small) return null;
    const Dot = ({ color, dim }) => (
      <span style={{ width: 16, height: 16, borderRadius: "50%", background: color, display: "inline-block", opacity: dim ? 0.25 : 1, margin: 2 }} />
    );
    if (current.topic === "mul") {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 10 }}>
          {Array.from({ length: current.a }).map((_, g) => (
            <div key={g} style={{ background: t.primarySoft, borderRadius: 12, padding: 6, display: "flex" }}>
              {Array.from({ length: current.b }).map((_, i) => <Dot key={i} color={t.primary} />)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 10 }}>
        {Array.from({ length: current.a }).map((_, i) => <Dot key={"a" + i} color={t.primary} />)}
        {current.topic === "add"
          ? Array.from({ length: current.b }).map((_, i) => <Dot key={"b" + i} color={t.accent} />)
          : Array.from({ length: current.b }).map((_, i) => <Dot key={"x" + i} color={t.primary} dim />)}
      </div>
    );
  }

  // ---------- Root ----------
  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: bodyFont,
      fontSize: baseSize, lineHeight: lh, letterSpacing: ls, wordSpacing: ws, transition: trans }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 16px 120px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {screen === "practice" && (
              <button aria-label="Back" onClick={() => setScreen("home")} style={btn(t.chipBg, t.text, { padding: 10, borderRadius: 12 })}>
                <ArrowLeft size={22} />
              </button>
            )}
            <span style={{ fontFamily: headFont, fontWeight: 700, fontSize: baseSize * 1.35 }}>
              Learn<span style={{ color: t.primary }}>Buddy</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...card({ padding: "8px 12px", borderRadius: 14 }), display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={20} fill={t.accent} color={t.accent} />
              <b style={{ fontFamily: headFont }}>{stars}</b>
            </div>
            <button aria-label="Settings" onClick={() => setSettingsOpen(true)} style={btn(t.chipBg, t.text, { padding: 10, borderRadius: 12 })}>
              <Settings size={22} />
            </button>
          </div>
        </div>

        {/* HOME */}
        {screen === "home" && (
          <div>
            <div style={card({ marginBottom: 18, textAlign: "center" })}>
              <div style={{ fontFamily: headFont, fontSize: baseSize * 1.4, fontWeight: 700 }}>Hi there! 👋</div>
              <p style={{ color: t.sub, margin: "8px 0 0" }}>
                Pick a subject. We go one step at a time. Ollie is here if you need help.
              </p>
            </div>

            <div style={{ fontFamily: headFont, fontWeight: 600, margin: "4px 4px 10px" }}>Choose a subject</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              {SUBJECTS.map((s) => {
                const Icon = s.icon; const active = subject === s.id;
                return (
                  <button key={s.id} onClick={() => setSubject(s.id)}
                    style={card({
                      display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", textAlign: "left",
                      borderColor: active ? t.primary : t.border, background: active ? t.primarySoft : t.panel,
                    })}>
                    <span style={{ background: t.primary, color: "#fff", borderRadius: 14, padding: 10, display: "inline-flex", width: "fit-content" }}>
                      <Icon size={26} />
                    </span>
                    <span style={{ fontFamily: headFont, fontWeight: 600, fontSize: baseSize * 1.05 }}>{s.label}</span>
                    <span style={{ color: t.sub, fontSize: baseSize * 0.8 }}>{s.blurb}</span>
                  </button>
                );
              })}
            </div>

            {/* Level chips only matter for math */}
            {subjectObj.mode === "math" && (
              <>
                <div style={{ fontFamily: headFont, fontWeight: 600, margin: "4px 4px 10px" }}>Choose a level</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                  {LEVELS.map((l) => (
                    <button key={l.id} onClick={() => setLevel(l.id)}
                      style={btn(level === l.id ? t.primary : t.chipBg, level === l.id ? "#fff" : t.text, { flex: 1 })}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button onClick={startPractice}
              style={btn(t.accent, "#fff", {
                width: "100%", fontFamily: headFont, fontSize: baseSize * 1.15, padding: "18px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: subjectObj.mode === "math" ? 0 : 4,
              })}>
              <Sparkles size={24} /> Start
            </button>
          </div>
        )}

        {/* PRACTICE */}
        {screen === "practice" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.sub, marginBottom: 12, justifyContent: "center" }}>
              <Heart size={18} color={t.accent} fill={streak > 0 ? t.accent : "none"} />
              {streak > 0 ? `${streak} in a row! Keep going.` : "Take your time."}
            </div>

            <div style={card({ textAlign: "center", marginBottom: 16 })}>
              <button onClick={readCurrentAloud} aria-label="Read it aloud"
                style={btn(t.chipBg, t.text, {
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
                  borderRadius: 12, marginBottom: 12, font: `500 ${baseSize * 0.85}px ${bodyFont}`,
                })}>
                <Volume2 size={18} /> Read it to me
              </button>

              {current.mode === "math" ? (
                <>
                  <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: baseSize * 2.6, letterSpacing: "0.03em" }}>
                    {current.a} <span style={{ color: t.primary }}>{current.sign}</span> {current.b}
                  </div>
                  <Dots />
                  <div style={{
                    marginTop: 16, minHeight: baseSize * 2.4, borderRadius: 14,
                    border: `2px dashed ${status === "wrong" ? t.gentle : t.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: headFont, fontSize: baseSize * 1.8, fontWeight: 700,
                    background: status === "right" ? t.correctSoft : t.bg, transition: trans,
                  }}>
                    {response === "" ? <span style={{ color: t.sub, fontSize: baseSize }}>your answer</span> : response}
                  </div>
                </>
              ) : (
                <>
                  {current.passage && (
                    <div style={{ background: t.primarySoft, borderRadius: 14, padding: "12px 16px", marginBottom: 12, fontFamily: headFont, fontSize: baseSize * 1.05 }}>
                      “{current.passage}”
                    </div>
                  )}
                  <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: baseSize * 1.25, marginBottom: 14 }}>
                    {current.q}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    {current.options.map((opt) => {
                      const selected = response === opt;
                      const isAnswer = opt === current.answer;
                      let bg = t.panel, bc = t.border;
                      if (selected) { bg = t.primarySoft; bc = t.primary; }
                      if (status === "right" && isAnswer) { bg = t.correctSoft; bc = t.correct; }
                      if (status === "wrong" && selected) { bc = t.gentle; }
                      return (
                        <button key={opt} onClick={() => selectOption(opt)}
                          style={{
                            background: bg, color: t.text, border: `2px solid ${bc}`, borderRadius: 14,
                            padding: "16px", font: `600 ${baseSize * 1.05}px ${bodyFont}`, cursor: "pointer",
                            transition: trans, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                          }}>
                          {(status === "right" && isAnswer) && <Check size={22} color={t.correct} />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {status === "right" && (
                <div style={{ marginTop: 14, color: t.correct, fontFamily: headFont, fontWeight: 600 }}>
                  ⭐ Yes! That's right. Well done!
                </div>
              )}
              {status === "wrong" && (
                <div style={{ marginTop: 14, color: t.gentle, fontWeight: 500 }}>
                  Not quite — that's okay! Try again, or ask Ollie for a hint. 💛
                </div>
              )}
            </div>

            {/* Number pad (math only) */}
            {current.mode === "math" && status !== "right" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                {["1","2","3","4","5","6","7","8","9"].map((k) => (
                  <button key={k} onClick={() => pressKey(k)}
                    style={btn(t.panel, t.text, { fontFamily: headFont, fontSize: baseSize * 1.4, padding: "16px", border: `2px solid ${t.border}` })}>
                    {k}
                  </button>
                ))}
                <button onClick={() => pressKey("clear")} style={btn(t.chipBg, t.text, { padding: "16px" })}>
                  <RotateCcw size={22} style={{ verticalAlign: "middle" }} />
                </button>
                <button onClick={() => pressKey("0")}
                  style={btn(t.panel, t.text, { fontFamily: headFont, fontSize: baseSize * 1.4, padding: "16px", border: `2px solid ${t.border}` })}>
                  0
                </button>
                <button onClick={() => pressKey("back")} style={btn(t.chipBg, t.text, { padding: "16px" })}>
                  <Delete size={22} style={{ verticalAlign: "middle" }} />
                </button>
              </div>
            )}

            {status === "right" ? (
              <button onClick={nextItem}
                style={btn(t.primary, "#fff", { width: "100%", fontFamily: headFont, fontSize: baseSize * 1.1, padding: 18, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" })}>
                Next one <Sparkles size={22} />
              </button>
            ) : (
              <button onClick={check}
                style={btn(t.accent, "#fff", { width: "100%", fontFamily: headFont, fontSize: baseSize * 1.1, padding: 18, opacity: response === "" ? 0.55 : 1 })}>
                Check my answer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating "Ask Ollie" button */}
      {!chatOpen && (
        <button onClick={openChat}
          style={{
            position: "fixed", right: 18, bottom: 22, background: t.primary, color: "#fff", border: "none",
            borderRadius: 30, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center",
            gap: 10, font: `600 ${baseSize}px ${headFont}`, boxShadow: "0 8px 24px rgba(0,0,0,0.22)", transition: trans,
          }}>
          <Sparkles size={22} /> Ask Ollie
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
          onClick={() => setChatOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: t.panel, width: "100%", maxWidth: 560, height: "78vh", borderTopLeftRadius: 24,
            borderTopRightRadius: 24, display: "flex", flexDirection: "column", border: `2px solid ${t.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderBottom: `2px solid ${t.border}` }}>
              <span style={{ background: t.primary, color: "#fff", borderRadius: 12, padding: 8, display: "flex" }}>
                <Sparkles size={22} />
              </span>
              <div>
                <div style={{ fontFamily: headFont, fontWeight: 700 }}>Ollie</div>
                <div style={{ color: t.sub, fontSize: baseSize * 0.75 }}>Your learning helper</div>
              </div>
              <button aria-label="Close" onClick={() => setChatOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: t.sub }}>
                <X size={26} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "82%", padding: "12px 16px", borderRadius: 18,
                    background: m.role === "user" ? t.primary : t.primarySoft,
                    color: m.role === "user" ? "#fff" : t.text,
                    borderBottomRightRadius: m.role === "user" ? 4 : 18,
                    borderBottomLeftRadius: m.role === "user" ? 18 : 4,
                  }}>
                    {m.text}
                    {m.role === "assistant" && (
                      <button aria-label="Read aloud" onClick={() => speak(m.text)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: t.primary, marginLeft: 6, verticalAlign: "middle" }}>
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {thinking && <div style={{ color: t.sub, fontStyle: "italic" }}>Ollie is thinking…</div>}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8, padding: "0 16px 8px", flexWrap: "wrap" }}>
              {["I'm stuck", "Give me a hint", "Explain it simply"].map((s) => (
                <button key={s} onClick={() => !thinking && sendToOllie(s)}
                  style={btn(t.chipBg, t.text, { padding: "8px 12px", borderRadius: 14, font: `500 ${baseSize * 0.8}px ${bodyFont}` })}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `2px solid ${t.border}` }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && chatInput.trim() && !thinking) sendToOllie(chatInput.trim()); }}
                placeholder="Type a question…"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: `2px solid ${t.border}`, background: t.bg, color: t.text, font: `400 ${baseSize}px ${bodyFont}`, outline: "none" }} />
              <button aria-label="Send" disabled={thinking || !chatInput.trim()} onClick={() => sendToOllie(chatInput.trim())}
                style={btn(t.primary, "#fff", { padding: 12, opacity: thinking || !chatInput.trim() ? 0.5 : 1 })}>
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}
          onClick={() => setSettingsOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card(), width: "100%", maxWidth: 440, maxHeight: "86vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: headFont, fontWeight: 700, fontSize: baseSize * 1.2 }}>Make it comfy</span>
              <button aria-label="Close settings" onClick={() => setSettingsOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: t.sub }}>
                <X size={26} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Label icon={Type} t={t}>Text size</Label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ l: "Normal", v: 1 }, { l: "Big", v: 1.25 }, { l: "Biggest", v: 1.5 }].map((o) => (
                  <button key={o.v} onClick={() => setSettings((s) => ({ ...s, textScale: o.v }))}
                    style={btn(settings.textScale === o.v ? t.primary : t.chipBg, settings.textScale === o.v ? "#fff" : t.text, { flex: 1, padding: "10px" })}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Label icon={Palette} t={t}>Colors</Label>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(THEMES).map(([key, th]) => (
                  <button key={key} onClick={() => setSettings((s) => ({ ...s, theme: key }))}
                    style={btn(settings.theme === key ? t.primary : t.chipBg, settings.theme === key ? "#fff" : t.text, { flex: 1, padding: "10px", fontSize: baseSize * 0.85 })}>
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            <Toggle t={t} icon={Eye} label="Easy-read spacing" desc="More space between letters and lines"
              on={settings.dyslexia} onClick={() => setSettings((s) => ({ ...s, dyslexia: !s.dyslexia }))} base={baseSize} headFont={headFont} />
            <Toggle t={t} icon={Sparkles} label="Calm mode" desc="Turns off animations and movement"
              on={settings.calm} onClick={() => setSettings((s) => ({ ...s, calm: !s.calm }))} base={baseSize} headFont={headFont} />
            <Toggle t={t} icon={Bell} label="Sounds" desc="Chimes and read-aloud voice"
              on={settings.sound} onClick={() => { if (settings.sound) window.speechSynthesis?.cancel(); setSettings((s) => ({ ...s, sound: !s.sound })); }} base={baseSize} headFont={headFont} />
            <Toggle t={t} icon={Eye} label="Show pictures" desc="Dots that show the numbers (Math)"
              on={settings.pictures} onClick={() => setSettings((s) => ({ ...s, pictures: !s.pictures }))} base={baseSize} headFont={headFont} />
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ icon: Icon, children, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: t.sub, fontWeight: 600 }}>
      <Icon size={18} /> {children}
    </div>
  );
}

function Toggle({ icon: Icon, label, desc, on, onClick, t, base, headFont }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: "12px 0", cursor: "pointer", textAlign: "left", color: t.text }}>
      <span style={{ background: t.chipBg, borderRadius: 12, padding: 9, display: "flex", color: t.primary }}>
        <Icon size={20} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ fontFamily: headFont, fontWeight: 600, display: "block" }}>{label}</span>
        <span style={{ color: t.sub, fontSize: base * 0.78 }}>{desc}</span>
      </span>
      <span style={{ width: 52, height: 30, borderRadius: 30, background: on ? t.primary : t.border, position: "relative", flexShrink: 0, transition: "background 0.18s" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left 0.18s" }} />
      </span>
    </button>
  );
}
