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

async function claude(messages, system, onStream) {

  const r = await fetch(API, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

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

    if (!srcText.trim()) return;

    const { data, error } = await supabase.from("sources").insert({

      notebook_id: activeNb, user_id: user.id,

      title: srcTitle || `Source ${sources.length + 1}`,

      content: srcText, type: srcType,

    }).select().single();

    if (!error && data) {

      setSources(p => [...p, data]);

      setSrcText(""); setSrcTitle(""); setShowAddSrc(false); setSuggestions([]); setStudioResult({});

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