import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────── SUPABASE ─────────────── */
const SUPABASE_URL = "https://segldpwxlnfnaypvmswo.supabase.co";
const SUPABASE_KEY = "sb_publishable_wXi-6DWmkw_sceAzMtPvgA_31QvjpZp";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─────────────── CONSTANTS ─────────────── */
const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const C = {
  bg: "#07080a", surface: "#0e1117", card: "#131720", border: "#1e2433",
  borderHover: "#2e3a55", accent: "#3b7ef6", accentGlow: "#3b7ef620",
  accentSoft: "#162040", teal: "#2dd4bf", tealSoft: "#0d2e2b",
  amber: "#f59e0b", amberSoft: "#2a1f05", rose: "#f43f5e", roseSoft: "#2a0912",
  green: "#22c55e", greenSoft: "#0a2015", text: "#e2e8f0",
  textMuted: "#64748b", textDim: "#94a3b8",
};

/* ─────────────── CLAUDE API ─────────────── */
const ANTHROPIC_KEY = "sk-ant-api03-fJIrR8Z4qF3FGsIFUerLOJDCrH6b4knxVe19JsL3-u_Gcsg49-rifNd55F7dS0zRJ1eZKX-Z80RPnCH6lojanw-8vyDmQAA"; // Replace with your key from console.anthropic.com
async function claude(messages, system, onStream) {
  const r = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages, stream: !!onStream }),
  });
  if (!onStream) {
    const d = await r.json();
    return d.content?.map((b) => b.text || "").join("") || "";
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const d = JSON.parse(line.slice(6));
        if (d.delta?.text) { full += d.delta.text; onStream(full); }
      } catch {}
    }
  }
  return full;
}

/* ─────────────── MARKDOWN ─────────────── */
function md(t = "") {
  return t
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, `<code style="background:#1a2035;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:.85em;color:#7dd3fc">$1</code>`)
    .replace(/^### (.+)$/gm, `<h3 style="color:${C.accent};margin:14px 0 6px;font-size:1em">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color:${C.accent};margin:16px 0 8px;font-size:1.1em">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h2 style="color:${C.accent};margin:18px 0 10px;font-size:1.2em">$1</h2>`)
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:${C.accent}">▸</span><span>$1</span></div>`)
    .replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
}

/* ─────────────── HELPERS ─────────────── */
const uid = () => Math.random().toString(36).slice(2);
const now = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Spinner({ size = 16, color = C.accent }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, flexShrink: 0,
      border: `2px solid ${color}30`, borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin .7s linear infinite",
    }} />
  );
}

function Btn({ children, onClick, disabled, variant = "primary", size = "md", style: s = {} }) {
  const variants = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.textDim, border: `1px solid ${C.border}` },
    teal: { background: C.teal, color: "#000", border: "none" },
    amber: { background: C.amber, color: "#000", border: "none" },
    rose: { background: C.rose, color: "#fff", border: "none" },
    outline: { background: "transparent", color: C.accent, border: `1px solid ${C.accent}` },
    green: { background: C.green, color: "#000", border: "none" },
  };
  const sizes = { sm: "5px 12px", md: "8px 18px", lg: "12px 28px", xl: "14px 36px" };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: sizes[size] || sizes.md,
      borderRadius: 10, fontSize: size === "sm" ? 12 : size === "lg" || size === "xl" ? 15 : 13,
      fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "inline-flex", alignItems: "center", gap: 7, transition: "all .18s",
      fontFamily: "inherit", ...(variants[variant] || variants.primary), ...s,
    }}>{children}</button>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════ */
function Landing({ onLogin, onSignup }) {
  const features = [
    { icon: "🎙️", title: "Audio Overviews", desc: "Transform sources into engaging AI-hosted podcast conversations.", color: C.teal },
    { icon: "📋", title: "Smart Summaries", desc: "Distill long documents into crisp, structured summaries instantly.", color: C.accent },
    { icon: "🧠", title: "Quiz & Flashcards", desc: "Auto-generate quizzes and flashcard decks to test your knowledge.", color: C.amber },
    { icon: "📖", title: "Study Guides", desc: "Create comprehensive, exam-ready study guides with one click.", color: C.green },
    { icon: "✍️", title: "Blog Posts", desc: "Turn research into polished, publication-ready blog articles.", color: C.rose },
    { icon: "📊", title: "Slide Decks", desc: "Generate full slide deck outlines from your uploaded sources.", color: "#a78bfa" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Crimson Pro', Georgia, serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(24px) } to { opacity:1;transform:none } }
        @keyframes pulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#1e2433;border-radius:3px }
        .hover-card:hover { border-color:${C.borderHover} !important; transform:translateY(-3px); box-shadow:0 12px 40px #00000060 !important; }
        .nav-link { color:${C.textMuted}; text-decoration:none; font-size:14px; transition:color .2s; }
        .nav-link:hover { color:${C.text}; }
        input:focus, textarea:focus { outline:none; }
        button { cursor:pointer; }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 60px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${C.bg}cc`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📓</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.5px" }}>NotebookAI</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onLogin}>Sign in</Btn>
          <Btn onClick={onSignup} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.teal})` }}>Get Started Free</Btn>
        </div>
      </nav>

      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, background: `radial-gradient(circle, ${C.accent}15, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", right: "10%", width: 300, height: 300, background: `radial-gradient(circle, ${C.teal}10, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ animation: "fadeUp .8s ease", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accentSoft, border: `1px solid ${C.accent}44`, borderRadius: 100, padding: "6px 16px", marginBottom: 28, fontSize: 13, color: C.accent }}>
            <span style={{ animation: "pulse 2s infinite" }}>●</span> Powered by Claude AI · Real accounts · Data saved forever
          </div>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", fontWeight: 700, lineHeight: 1.1, margin: "0 auto 24px", maxWidth: 820, letterSpacing: "-2px", background: `linear-gradient(135deg, ${C.text} 30%, ${C.textDim})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your AI-powered<br />research companion
          </h1>
          <p style={{ fontSize: 19, color: C.textMuted, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 300 }}>
            Upload any source. Get instant summaries, podcasts, quizzes, study guides, blog posts, and slide decks — all saved to your account.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn size="xl" onClick={onSignup} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, boxShadow: `0 8px 32px ${C.accent}50`, borderRadius: 14 }}>
              Create free account →
            </Btn>
            <Btn size="xl" variant="ghost" onClick={onLogin} style={{ borderRadius: 14 }}>Sign in</Btn>
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 60px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 38, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-1px" }}>Everything you need</h2>
          <p style={{ color: C.textMuted, fontSize: 17, maxWidth: 460, margin: "0 auto" }}>Six powerful AI tools, all grounded in your uploaded sources</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {features.map((f, i) => (
            <div key={f.title} className="hover-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, transition: "all .25s", animation: `fadeUp .6s ease ${i * .08}s both`, boxShadow: "0 4px 20px #00000040" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: f.color + "15", border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{f.icon}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 40px", background: `linear-gradient(135deg, ${C.accentSoft}, ${C.tealSoft})`, border: `1px solid ${C.accent}33`, borderRadius: 28 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-.5px" }}>Ready to transform your research?</h2>
          <p style={{ color: C.textMuted, fontSize: 16, marginBottom: 32 }}>Create a free account — your notebooks and sources are saved forever.</p>
          <Btn size="xl" onClick={onSignup} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, boxShadow: `0 8px 32px ${C.accent}50`, borderRadius: 14 }}>
            Create your free account →
          </Btn>
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px", borderTop: `1px solid ${C.border}`, color: C.textMuted, fontSize: 13 }}>
        © 2025 NotebookAI · Powered by Claude & Supabase
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════ */
function Auth({ mode, onBack, onAuth, onSwitch }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!email || !pass) { setErr("Please fill in all fields."); return; }
    if (mode === "signup" && !name) { setErr("Please enter your name."); return; }
    setLoading(true); setErr(""); setMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name } } });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, name, email });
          setMsg("✅ Account created! Please check your email to confirm, then sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
          onAuth({ id: data.user.id, name: profile?.name || email.split("@")[0], email });
        }
      }
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) { setErr(error.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Crimson Pro', Georgia, serif", color: C.text, position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} *{box-sizing:border-box} input:focus{outline:none; border-color:${C.accent} !important;}`}</style>
      <div style={{ position: "absolute", top: "20%", left: "20%", width: 350, height: 350, background: `radial-gradient(circle, ${C.accent}12, transparent 70%)`, borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 250, height: 250, background: `radial-gradient(circle, ${C.teal}10, transparent 70%)`, borderRadius: "50%" }} />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 44px", width: 440, position: "relative", zIndex: 1, animation: "fadeUp .5s ease", boxShadow: "0 24px 80px #00000080" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📓</div>
          <span style={{ fontWeight: 700, fontSize: 17 }}>NotebookAI</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, letterSpacing: "-.5px" }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p style={{ margin: "0 0 24px", color: C.textMuted, fontSize: 14 }}>{mode === "login" ? "Sign in to your notebooks" : "Start your research journey"}</p>

        {err && <div style={{ background: C.roseSoft, border: `1px solid ${C.rose}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fda4af" }}>{err}</div>}
        {msg && <div style={{ background: C.greenSoft, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.green }}>{msg}</div>}

        {/* Google Sign In */}
        <button onClick={signInWithGoogle} disabled={loading} style={{ width: "100%", padding: "11px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, fontFamily: "inherit" }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.textMuted }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit", transition: "border .2s" }} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === "Enter" && submit()} style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit", transition: "border .2s" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit", transition: "border .2s" }} />
        </div>

        <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", opacity: loading ? .7 : 1 }}>
          {loading ? <><Spinner color="#fff" /> Processing...</> : mode === "login" ? "Sign in →" : "Create account →"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.textMuted }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={onSwitch} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════ */
function App({ user, onLogout }) {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNb, setActiveNb] = useState(null);
  const [sources, setSources] = useState([]);
  const [tab, setTab] = useState("chat");
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [showAddSrc, setShowAddSrc] = useState(false);
  const [srcTitle, setSrcTitle] = useState("");
  const [srcText, setSrcText] = useState("");
  const [srcType, setSrcType] = useState("text");
  const [showNewNb, setShowNewNb] = useState(false);
  const [newNbTitle, setNewNbTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [nbTitle, setNbTitle] = useState("");
  const [studioMode, setStudioMode] = useState("overview");
  const [studioResult, setStudioResult] = useState({});
  const [studioLoading, setStudioLoading] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAns, setQuizAns] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [audioScript, setAudioScript] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPos, setAudioPos] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const chatEndRef = useRef(null);
  const taRef = useRef(null);
  const audioTimerRef = useRef(null);

  useEffect(() => { loadNotebooks(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats, streaming]);

  /* ── DB OPERATIONS ── */
  const loadNotebooks = async () => {
    setDbLoading(true);
    const { data } = await supabase.from("notebooks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setNotebooks(data || []);
    setDbLoading(false);
  };

  const loadSources = async (nbId) => {
    const { data } = await supabase.from("sources").select("*").eq("notebook_id", nbId).order("created_at", { ascending: true });
    setSources(data || []);
  };

  const createNotebook = async () => {
    if (!newNbTitle.trim()) return;
    const { data, error } = await supabase.from("notebooks").insert({ user_id: user.id, title: newNbTitle }).select().single();
    if (!error && data) {
      setNotebooks(p => [data, ...p]);
      setActiveNb(data.id); setNbTitle(data.title);
      setSources([]); setChats([]); setStudioResult({}); setSuggestions([]);
      setNewNbTitle(""); setShowNewNb(false);
    }
  };

  const updateNotebookTitle = async (id, title) => {
    await supabase.from("notebooks").update({ title }).eq("id", id);
    setNotebooks(p => p.map(n => n.id === id ? { ...n, title } : n));
  };

  const addSource = async () => {
    if (!srcText.trim() && !selectedFile) return;
    setIsUploading(true);
    try {
      let finalContent = srcText;
      let finalTitle = srcTitle || (selectedFile ? selectedFile.name : `Source ${sources.length + 1}`);
      let finalType = srcType;
      if (selectedFile) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(selectedFile);
        });
        finalContent = text;
        finalTitle = srcTitle || selectedFile.name;
        finalType = selectedFile.name.split('.').pop() || 'file';
      }
      const { data, error } = await supabase.from("sources").insert({
        notebook_id: activeNb, user_id: user.id,
        title: finalTitle, content: finalContent, type: finalType,
      }).select().single();
      if (!error && data) {
        setSources(p => [...p, data]);
        setSrcText(""); setSrcTitle(""); setSelectedFile(null);
        setShowAddSrc(false); setSuggestions([]); setStudioResult({});
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeSource = async (id) => {
    await supabase.from("sources").delete().eq("id", id);
    setSources(p => p.filter(s => s.id !== id));
  };

  const openNotebook = async (nb) => {
    setActiveNb(nb.id); setNbTitle(nb.title);
    setChats([]); setStudioResult({}); setSuggestions([]);
    setTab("chat"); await loadSources(nb.id);
  };

  /* ── AI ── */
  const sys = useCallback(() => {
    const ctx = sources.map((s, i) => `[Source ${i + 1}: "${s.title}"]\n${s.content}`).join("\n\n---\n\n");
    return `You are NotebookAI, an expert research assistant. ${ctx ? `Use ONLY these sources:\n\n${ctx}\n\nAlways cite sources by name.` : "No sources yet — ask user to add sources."}`;
  }, [sources]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = { role: "user", content: input.trim() };
    const history = [...chats, msg];
    setChats(history); setInput(""); setLoading(true); setStreaming("");
    try {
      const reply = await claude(history.map(c => ({ role: c.role, content: c.content })), sys(), t => setStreaming(t));
      setChats([...history, { role: "assistant", content: reply }]); setStreaming("");
    } catch (e) { setChats([...history, { role: "assistant", content: "⚠️ " + e.message }]); }
    setLoading(false);
  };

  const genSuggestions = async () => {
    if (!sources.length) return;
    try {
      const r = await claude([{ role: "user", content: "Give 4 insightful questions. Return ONLY a JSON array of strings." }], sys(), null);
      setSuggestions(JSON.parse(r.replace(/```json|```/g, "").trim()));
    } catch { setSuggestions(["What are the key themes?", "What are the main findings?", "What connections exist?", "What are the limitations?"]); }
  };

  const genStudio = async (mode) => {
    if (!sources.length) return;
    setStudioMode(mode); setStudioLoading(true);
    const prompts = {
      overview: "Write a comprehensive notebook overview: main topics, key insights, connections between sources. Use markdown headers.",
      summary: "Write a structured summary for each source, then an overall synthesis. Use markdown.",
      studyguide: "Create a comprehensive study guide with: Key Concepts, Important Facts, Relationships, Review Questions (with answers). Use markdown.",
      blog: "Write a publication-ready blog post (800-1000 words) based on the sources. Include headline, intro, body with subheadings, conclusion. Use markdown.",
      slides: "Create a detailed slide deck outline with 8-12 slides. For each: Slide Title, 4-6 bullet points, speaker note. Use markdown.",
    };
    try {
      await claude([{ role: "user", content: prompts[mode] }], sys(), t => setStudioResult(prev => ({ ...prev, [mode]: t })));
    } catch (e) { setStudioResult(prev => ({ ...prev, [mode]: "Error: " + e.message })); }
    setStudioLoading(false);
  };

  const genQuiz = async () => {
    if (!sources.length) return;
    setStudioLoading(true); setStudioMode("quiz");
    try {
      const r = await claude([{ role: "user", content: `Create a 6-question multiple-choice quiz. Return ONLY valid JSON array: [{"q":"question","options":["A","B","C","D"],"answer":0,"explanation":"..."}]` }], sys(), null);
      setQuiz(JSON.parse(r.replace(/```json|```/g, "").trim()));
      setQuizIdx(0); setQuizAns(null); setQuizScore(0); setQuizDone(false);
    } catch { setQuiz([]); }
    setStudioLoading(false);
  };

  const genFlashcards = async () => {
    if (!sources.length) return;
    setStudioLoading(true); setStudioMode("flashcards");
    try {
      const r = await claude([{ role: "user", content: `Create 8 flashcards. Return ONLY valid JSON array: [{"front":"term","back":"definition"}]` }], sys(), null);
      setFlashcards(JSON.parse(r.replace(/```json|```/g, "").trim()));
      setFcIdx(0); setFcFlipped(false);
    } catch { setFlashcards([]); }
    setStudioLoading(false);
  };

  const genAudio = async () => {
    if (!sources.length) return;
    setAudioLoading(true); setAudioScript("");
    try {
      await claude([{ role: "user", content: `Create a 5-7 minute podcast script between hosts Alex and Sam discussing the sources. Format:\nALEX: ...\nSAM: ...\nMake it engaging and informative.` }], sys(), t => setAudioScript(t));
    } catch (e) { setAudioScript("Error: " + e.message); }
    setAudioLoading(false);
  };

  const toggleAudio = () => {
    if (audioPlaying) { clearInterval(audioTimerRef.current); setAudioPlaying(false); }
    else {
      setAudioPlaying(true);
      audioTimerRef.current = setInterval(() => {
        setAudioPos(p => { if (p >= 100) { clearInterval(audioTimerRef.current); setAudioPlaying(false); return 100; } return p + 0.15; });
      }, 100);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); onLogout(); };

  const tabs = [
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "sources", icon: "📚", label: "Sources" },
    { id: "audio", icon: "🎙️", label: "Audio" },
    { id: "quiz", icon: "🧠", label: "Quiz" },
    { id: "studio", icon: "🛠️", label: "Studio" },
  ];

  /* ── NOTEBOOKS DASHBOARD ── */
  if (!activeNb) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Crimson Pro', Georgia, serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}} *{box-sizing:border-box} input:focus{outline:none} .nb-card:hover{border-color:${C.borderHover}!important;transform:translateY(-2px);box-shadow:0 8px 30px #00000060!important;}`}</style>
        <div style={{ padding: "18px 40px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📓</div>
            <span style={{ fontWeight: 700, fontSize: 17 }}>NotebookAI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: C.textMuted }}>Hello, <strong style={{ color: C.text }}>{user.name}</strong></span>
            <Btn variant="ghost" size="sm" onClick={handleLogout}>Sign out</Btn>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-.5px" }}>Your Notebooks</h1>
            <p style={{ color: C.textMuted, margin: 0 }}>All your research, saved permanently to your account</p>
          </div>

          {dbLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}><Spinner size={36} /></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              <div onClick={() => setShowNewNb(true)} style={{ background: "transparent", border: `2px dashed ${C.border}`, borderRadius: 18, padding: "28px 24px", cursor: "pointer", transition: "all .2s", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>+</div>
                <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>New Notebook</span>
              </div>
              {notebooks.map(nb => (
                <div key={nb.id} className="nb-card" onClick={() => openNotebook(nb)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "24px", cursor: "pointer", transition: "all .2s", animation: "fadeUp .4s ease" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📓</div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{nb.title}</h3>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{new Date(nb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showNewNb && (
          <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ background: C.card, borderRadius: 20, padding: "32px 36px", width: 420, border: `1px solid ${C.border}`, animation: "fadeUp .2s ease" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 20 }}>New Notebook</h3>
              <input autoFocus value={newNbTitle} onChange={e => setNewNbTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && createNotebook()} placeholder="e.g. Climate Research 2024"
                style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, marginBottom: 20, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setShowNewNb(false)}>Cancel</Btn>
                <Btn onClick={createNotebook} disabled={!newNbTitle.trim()}>Create Notebook</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── NOTEBOOK DETAIL ── */
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: "'Crimson Pro', Georgia, serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes flipIn{from{transform:rotateY(90deg);opacity:0}to{transform:none;opacity:1}} *{box-sizing:border-box} textarea:focus,input:focus{outline:none} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#1e2433;border-radius:3px}`}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📓</div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>NotebookAI</span>
          </div>
          <button onClick={() => setActiveNb(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12, marginBottom: 10, padding: "4px 0" }}>← All notebooks</button>
          {editingTitle ? (
            <input autoFocus value={nbTitle} onChange={e => setNbTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); updateNotebookTitle(activeNb, nbTitle); }}
              onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 7, padding: "5px 8px", color: C.text, fontSize: 13, fontFamily: "inherit" }} />
          ) : (
            <div onClick={() => setEditingTitle(true)} style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.text, padding: "4px 0" }} title="Click to rename">{nbTitle} ✏️</div>
          )}
        </div>

        <div style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: C.textMuted, padding: "6px 8px 4px", textTransform: "uppercase", letterSpacing: 1 }}>Navigation</div>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: "none", background: tab === t.id ? C.accentSoft : "transparent", color: tab === t.id ? C.accent : C.textMuted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 2, borderLeft: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", fontFamily: "inherit", transition: "all .15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
          <div style={{ fontSize: 10, color: C.textMuted, padding: "14px 8px 4px", textTransform: "uppercase", letterSpacing: 1 }}>Sources ({sources.length})</div>
          {sources.map(s => (
            <div key={s.id} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📄</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
            </div>
          ))}
          <button onClick={() => setShowAddSrc(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 12, padding: "7px 10px", marginTop: 4 }}>+ Add source</button>
        </div>

        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 11, padding: 0 }}>Sign out</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {suggestions.length > 0 && (
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, overflowX: "auto", background: C.surface, flexShrink: 0 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); taRef.current?.focus(); }} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.card, color: C.textDim, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }}>💡 {s}</button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 12px" }}>
              {chats.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 60, animation: "fadeUp .5s ease" }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📓</div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Chat with your sources</h2>
                  <p style={{ color: C.textMuted, fontSize: 15, maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.6 }}>
                    {sources.length === 0 ? "Add sources first, then ask anything about them." : "Ask questions grounded in your uploaded sources."}
                  </p>
                  {sources.length === 0 ? <Btn onClick={() => setShowAddSrc(true)}>+ Add Your First Source</Btn> : (
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      {["Summarize all sources", "What are the key themes?", "Give me the most important facts"].map(q => (
                        <Btn key={q} variant="ghost" size="sm" onClick={() => setInput(q)}>{q}</Btn>
                      ))}
                    </div>
                  )}
                  {sources.length > 0 && suggestions.length === 0 && <div style={{ marginTop: 16 }}><Btn variant="outline" size="sm" onClick={genSuggestions}>✨ Generate question ideas</Btn></div>}
                </div>
              )}
              {chats.map((m, i) => (
                <div key={i} style={{ marginBottom: 22, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 12, animation: "fadeUp .3s ease" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: m.role === "user" ? C.accentSoft : C.card, border: `1px solid ${m.role === "user" ? C.accent + "44" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginTop: 2 }}>
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div style={{ maxWidth: "70%", padding: "13px 17px", borderRadius: 16, background: m.role === "user" ? C.accentSoft : C.card, border: `1px solid ${m.role === "user" ? C.accent + "33" : C.border}`, fontSize: 14, lineHeight: 1.65 }}>
                    <div dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                  </div>
                </div>
              ))}
              {streaming && (
                <div style={{ marginBottom: 22, display: "flex", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🤖</div>
                  <div style={{ maxWidth: "70%", padding: "13px 17px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, fontSize: 14, lineHeight: 1.65 }}>
                    <div dangerouslySetInnerHTML={{ __html: md(streaming) }} />
                    <span style={{ display: "inline-block", width: 2, height: 15, background: C.accent, marginLeft: 2, animation: "spin 1s steps(2) infinite", borderRadius: 1 }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "10px 14px" }}>
                <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={sources.length === 0 ? "Add sources first..." : "Ask anything about your sources..."} rows={1} style={{ flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }} />
                <Btn onClick={send} disabled={!input.trim() || loading} style={{ flexShrink: 0 }}>{loading ? <Spinner size={14} color="#fff" /> : "Send ↑"}</Btn>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted }}>Enter to send · Shift+Enter for new line</div>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {tab === "sources" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>Sources</h2>
                <p style={{ margin: 0, color: C.textMuted, fontSize: 14 }}>Saved permanently to your account</p>
              </div>
              <Btn onClick={() => setShowAddSrc(true)}>+ Add Source</Btn>
            </div>
            {sources.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", border: `2px dashed ${C.border}`, borderRadius: 20, color: C.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <p style={{ fontSize: 16, marginBottom: 20 }}>No sources yet</p>
                <Btn onClick={() => setShowAddSrc(true)}>+ Add your first source</Btn>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                {sources.map(s => (
                  <div key={s.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, animation: "fadeUp .3s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, background: C.surface, padding: "2px 8px", borderRadius: 10, color: C.textMuted, textTransform: "capitalize" }}>📄 {s.type}</span>
                      <button onClick={() => removeSource(s.id)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                    </div>
                    <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>{s.title}</h3>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: C.textMuted, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", lineHeight: 1.55 }}>{s.content}</p>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIO */}
        {tab === "audio" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>🎙️ Audio Overview</h2>
              <p style={{ margin: "0 0 28px", color: C.textMuted, fontSize: 14 }}>Generate an AI-hosted podcast conversation about your sources</p>
              {!audioScript && !audioLoading && (
                <div style={{ textAlign: "center", padding: "60px 40px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>🎙️</div>
                  <h3 style={{ fontSize: 20, margin: "0 0 10px" }}>Create a Podcast</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>Transform your sources into an engaging conversation between Alex and Sam.</p>
                  <Btn variant="teal" size="lg" onClick={genAudio} disabled={!sources.length}>{sources.length === 0 ? "Add sources first" : "🎙️ Generate Audio Overview"}</Btn>
                </div>
              )}
              {audioLoading && <div style={{ textAlign: "center", padding: "60px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}><Spinner size={40} color={C.teal} /><p style={{ color: C.textMuted, marginTop: 16 }}>Generating your podcast...</p></div>}
              {audioScript && !audioLoading && (
                <div>
                  <div style={{ background: `linear-gradient(135deg, ${C.tealSoft}, ${C.card})`, border: `1px solid ${C.teal}33`, borderRadius: 20, padding: 28, marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.tealSoft, border: `1px solid ${C.teal}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎙️</div>
                      <div><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Audio Overview</div><div style={{ fontSize: 13, color: C.textMuted }}>Hosted by Alex & Sam</div></div>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${audioPos}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.accent})`, borderRadius: 4, transition: "width .5s linear" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                      <button onClick={() => setAudioPos(0)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18 }}>⏮</button>
                      <button onClick={toggleAudio} style={{ width: 50, height: 50, borderRadius: "50%", background: C.teal, border: "none", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{audioPlaying ? "⏸" : "▶"}</button>
                      <button style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18 }}>⏭</button>
                    </div>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📜 Podcast Script</h3>
                      <Btn variant="ghost" size="sm" onClick={genAudio}>↻ Regenerate</Btn>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.75, color: C.text }}>
                      {audioScript.split("\n").map((line, i) => {
                        const isAlex = line.startsWith("ALEX:");
                        const isSam = line.startsWith("SAM:");
                        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
                        return (
                          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                            {(isAlex || isSam) && <span style={{ minWidth: 44, fontSize: 11, fontWeight: 700, color: isAlex ? C.accent : C.teal, marginTop: 2, fontFamily: "monospace" }}>{isAlex ? "ALEX" : "SAM"}</span>}
                            <span style={{ color: (isAlex || isSam) ? C.text : C.textMuted }}>{(isAlex || isSam) ? line.replace(/^(ALEX|SAM):/, "").trim() : line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab === "quiz" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>🧠 Quiz & Flashcards</h2>
                  <p style={{ margin: 0, color: C.textMuted, fontSize: 14 }}>Test your knowledge of the sources</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Btn variant="amber" size="sm" onClick={genQuiz} disabled={!sources.length || studioLoading}>{studioLoading && studioMode === "quiz" ? <><Spinner size={13} color="#000" /> Generating...</> : "📝 New Quiz"}</Btn>
                  <Btn variant="outline" size="sm" onClick={genFlashcards} disabled={!sources.length || studioLoading}>{studioLoading && studioMode === "flashcards" ? <><Spinner size={13} /> Generating...</> : "🃏 Flashcards"}</Btn>
                </div>
              </div>

              {studioMode === "quiz" && quiz.length > 0 && !quizDone && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Question {quizIdx + 1} of {quiz.length}</span>
                    <span style={{ fontSize: 13, color: C.amber }}>Score: {quizScore}/{quizIdx}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 24 }}>
                    <div style={{ height: "100%", width: `${(quizIdx / quiz.length) * 100}%`, background: C.amber, borderRadius: 4, transition: "width .4s" }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 24px", lineHeight: 1.5 }}>{quiz[quizIdx]?.q}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {quiz[quizIdx]?.options?.map((opt, oi) => {
                      const isCorrect = oi === quiz[quizIdx].answer;
                      const isChosen = quizAns === oi;
                      let bg = C.surface, border = C.border, color = C.text;
                      if (quizAns !== null) {
                        if (isCorrect) { bg = C.greenSoft; border = C.green; color = C.green; }
                        else if (isChosen) { bg = C.roseSoft; border = C.rose; color = C.rose; }
                      }
                      return (
                        <button key={oi} onClick={() => { if (quizAns !== null) return; setQuizAns(oi); if (oi === quiz[quizIdx].answer) setQuizScore(s => s + 1); }} style={{ padding: "14px 18px", borderRadius: 12, border: `1px solid ${border}`, background: bg, color, textAlign: "left", cursor: quizAns === null ? "pointer" : "default", fontSize: 14, fontFamily: "inherit", transition: "all .2s" }}>
                          <span style={{ marginRight: 10, fontFamily: "monospace", fontSize: 12 }}>{["A","B","C","D"][oi]}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizAns !== null && (
                    <div style={{ marginTop: 18, padding: "14px 16px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, color: C.textDim, marginBottom: 6 }}>💡 Explanation</div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text }}>{quiz[quizIdx]?.explanation}</div>
                      <Btn size="sm" style={{ marginTop: 14 }} onClick={() => { if (quizIdx + 1 >= quiz.length) setQuizDone(true); else { setQuizIdx(i => i + 1); setQuizAns(null); } }}>
                        {quizIdx + 1 >= quiz.length ? "See Results" : "Next Question →"}
                      </Btn>
                    </div>
                  )}
                </div>
              )}

              {studioMode === "quiz" && quizDone && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>{quizScore >= quiz.length * 0.8 ? "🏆" : quizScore >= quiz.length * 0.5 ? "👍" : "📚"}</div>
                  <h3 style={{ fontSize: 26, margin: "0 0 8px" }}>Quiz Complete!</h3>
                  <p style={{ color: C.textMuted, fontSize: 16, marginBottom: 24 }}>You scored <strong style={{ color: C.amber }}>{quizScore}/{quiz.length}</strong> ({Math.round(quizScore / quiz.length * 100)}%)</p>
                  <Btn variant="amber" onClick={() => { setQuizIdx(0); setQuizAns(null); setQuizScore(0); setQuizDone(false); }}>Retry Quiz</Btn>
                  <Btn variant="ghost" style={{ marginLeft: 10 }} onClick={genQuiz}>New Quiz</Btn>
                </div>
              )}

              {studioMode === "flashcards" && flashcards.length > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: 12, fontSize: 13, color: C.textMuted }}>Card {fcIdx + 1} of {flashcards.length} · Click to flip</div>
                  <div onClick={() => setFcFlipped(f => !f)} style={{ width: "100%", minHeight: 220, background: fcFlipped ? C.accentSoft : C.card, border: `1px solid ${fcFlipped ? C.accent + "44" : C.border}`, borderRadius: 20, padding: "40px 32px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all .3s", marginBottom: 20, animation: "flipIn .3s ease" }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>{fcFlipped ? "Answer" : "Question"}</div>
                    <div style={{ fontSize: 20, fontWeight: fcFlipped ? 400 : 700, lineHeight: 1.5, color: C.text }}>{fcFlipped ? flashcards[fcIdx]?.back : flashcards[fcIdx]?.front}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <Btn variant="ghost" onClick={() => { setFcIdx(i => Math.max(0, i - 1)); setFcFlipped(false); }} disabled={fcIdx === 0}>← Prev</Btn>
                    <Btn variant="ghost" onClick={() => setFcFlipped(f => !f)}>Flip ↕</Btn>
                    <Btn onClick={() => { setFcIdx(i => Math.min(flashcards.length - 1, i + 1)); setFcFlipped(false); }} disabled={fcIdx === flashcards.length - 1}>Next →</Btn>
                  </div>
                </div>
              )}

              {!quiz.length && !flashcards.length && !studioLoading && (
                <div style={{ textAlign: "center", padding: "60px 40px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🧠</div>
                  <h3 style={{ fontSize: 18, margin: "0 0 8px" }}>Test your knowledge</h3>
                  <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Generate a quiz or flashcard deck from your sources</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <Btn variant="amber" onClick={genQuiz} disabled={!sources.length}>📝 Generate Quiz</Btn>
                    <Btn variant="outline" onClick={genFlashcards} disabled={!sources.length}>🃏 Flashcards</Btn>
                  </div>
                  {!sources.length && <p style={{ color: C.textMuted, fontSize: 12, marginTop: 12 }}>Add sources first</p>}
                </div>
              )}

              {studioLoading && (studioMode === "quiz" || studioMode === "flashcards") && (
                <div style={{ textAlign: "center", padding: 60 }}><Spinner size={36} color={C.amber} /><p style={{ color: C.textMuted, marginTop: 12 }}>Generating...</p></div>
              )}
            </div>
          </div>
        )}

        {/* STUDIO */}
        {tab === "studio" && (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <div style={{ width: 200, borderRight: `1px solid ${C.border}`, padding: "20px 12px", background: C.surface, flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Generate</div>
              {[{ id: "overview", icon: "📊", label: "Overview" }, { id: "summary", icon: "📋", label: "Summary" }, { id: "studyguide", icon: "📖", label: "Study Guide" }, { id: "blog", icon: "✍️", label: "Blog Post" }, { id: "slides", icon: "📊", label: "Slide Deck" }].map(item => (
                <button key={item.id} onClick={() => genStudio(item.id)} disabled={!sources.length || studioLoading} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "none", background: studioMode === item.id ? C.accentSoft : "transparent", color: studioMode === item.id ? C.accent : C.textMuted, fontSize: 13, textAlign: "left", cursor: sources.length && !studioLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, marginBottom: 2, opacity: sources.length ? 1 : 0.45, fontFamily: "inherit", transition: "all .15s", borderLeft: studioMode === item.id ? `2px solid ${C.accent}` : "2px solid transparent" }}>
                  {item.icon} {item.label}
                </button>
              ))}
              {!sources.length && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 12, padding: "0 4px" }}>Add sources to unlock Studio tools</p>}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
              {studioLoading && !["quiz","flashcards"].includes(studioMode) ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}><Spinner size={36} color={C.accent} /><p style={{ color: C.textMuted, marginTop: 16 }}>Generating...</p></div>
              ) : studioResult[studioMode] ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{{ overview: "📊 Overview", summary: "📋 Summary", studyguide: "📖 Study Guide", blog: "✍️ Blog Post", slides: "📊 Slide Deck" }[studioMode]}</h2>
                    <Btn variant="ghost" size="sm" onClick={() => genStudio(studioMode)}>↻ Regenerate</Btn>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", fontSize: 14, lineHeight: 1.8, color: C.text }}>
                    <div dangerouslySetInnerHTML={{ __html: md(studioResult[studioMode]) }} />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 40px" }}>
                  <div style={{ fontSize: 56, marginBottom: 20 }}>🛠️</div>
                  <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>Studio Tools</h2>
                  <p style={{ color: C.textMuted, fontSize: 15, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>Generate overviews, summaries, study guides, blog posts, and slide decks.</p>
                  {sources.length > 0 ? <Btn onClick={() => genStudio("overview")}>Generate Overview →</Btn> : <Btn variant="ghost" onClick={() => setTab("sources")}>+ Add sources first</Btn>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD SOURCE MODAL */}
      {showAddSrc && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: C.card, borderRadius: 22, padding: "32px 36px", width: 580, border: `1px solid ${C.border}`, animation: "fadeUp .2s ease", maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>Add Source</h3>
            <p style={{ margin: "0 0 22px", color: C.textMuted, fontSize: 13 }}>Saved permanently to your notebook</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["text","note","article","research"].map(t => (
                  <button key={t} onClick={() => setSrcType(t)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${srcType === t ? C.accent : C.border}`, background: srcType === t ? C.accentSoft : "transparent", color: srcType === t ? C.accent : C.textMuted, fontSize: 12, cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Title</label>
              <input value={srcTitle} onChange={e => setSrcTitle(e.target.value)} placeholder="Source title..." style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Upload File (optional)</label>
              <input type="file" accept=".txt,.pdf,.doc,.docx,.md,.csv,.json,.html,.xml,.py,.js,.ts" onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); if (!srcTitle) setSrcTitle(f.name); } }}
                style={{ width: "100%", padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: "inherit" }} />
              {selectedFile && <div style={{ marginTop: 8, fontSize: 12, color: C.green }}>✅ {selectedFile.name} selected</div>}
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Or Paste Content</label>
              <textarea value={srcText} onChange={e => setSrcText(e.target.value)} placeholder="Paste your content here..." rows={7} style={{ width: "100%", padding: "12px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.65 }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => { setShowAddSrc(false); setSrcText(""); setSrcTitle(""); setSelectedFile(null); }}>Cancel</Btn>
              <Btn onClick={addSource} disabled={(!srcText.trim() && !selectedFile) || isUploading}>
                {isUploading ? <><Spinner size={13} color="#fff" /> Uploading...</> : "Save Source"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT — handles auth state
═══════════════════════════════════════════════ */
export default function Root() {
  const [page, setPage] = useState("landing");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ id: session.user.id, name: profile?.name || session.user.email?.split("@")[0], email: session.user.email });
        setPage("app");
      }
      setChecking(false);
    });

    // Listen for auth changes (e.g. Google OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (!profile) {
          await supabase.from("profiles").upsert({ id: session.user.id, name: session.user.user_metadata?.name || session.user.email?.split("@")[0], email: session.user.email });
        }
        setUser({ id: session.user.id, name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0], email: session.user.email });
        setPage("app");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Spinner size={40} />
      </div>
    );
  }

  if (page === "landing") return <Landing onLogin={() => { setAuthMode("login"); setPage("auth"); }} onSignup={() => { setAuthMode("signup"); setPage("auth"); }} />;
  if (page === "auth") return (
    <Auth
      mode={authMode}
      onBack={() => setPage("landing")}
      onSwitch={() => setAuthMode(m => m === "login" ? "signup" : "login")}
      onAuth={(u) => { if (u) { setUser(u); setPage("app"); } }}
    />
  );
  if (page === "app" && user) return <App user={user} onLogout={() => { setUser(null); setPage("landing"); }} />;
  return null;
}