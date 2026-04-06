import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────── SUPABASE ─────────────── */
// Replace these with your actual environment variables if they differ
const SUPABASE_URL = "https://segldpwxlnfnaypvmswo.supabase.co";
const SUPABASE_KEY = "sb_publishable_wXi-6DWmkw_sceAzMtPvgA_31QvjpZp";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─────────────── CONSTANTS & STYLING ─────────────── */
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

/* ─────────────── HELPERS ─────────────── */
const uid = () => Math.random().toString(36).slice(2);

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
  };
  const sizes = { sm: "5px 12px", md: "8px 18px", lg: "12px 28px" };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: sizes[size] || sizes.md, borderRadius: 10, fontWeight: 600, 
      cursor: disabled ? "not-allowed" : "pointer", transition: "all .18s",
      display: "inline-flex", alignItems: "center", gap: 7,
      ...(variants[variant] || variants.primary), ...s,
    }}>{children}</button>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════ */
function Landing({ onLogin, onSignup }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, textAlign: "center", paddingTop: 100 }}>
       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
       <h1>Welcome to NotebookAI</h1>
       <p style={{ color: C.textMuted }}>Your intelligent research companion.</p>
       <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
         <Btn onClick={onLogin}>Sign In</Btn>
         <Btn variant="ghost" onClick={onSignup}>Create Account</Btn>
       </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════ */
function Auth({ mode, onBack, onAuth, onSwitch }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ 
      provider: "google", 
      options: { redirectTo: window.location.origin } 
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.card, padding: 40, borderRadius: 20, border: `1px solid ${C.border}`, width: 400 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>
        <h2 style={{ color: C.text, marginTop: 20 }}>{mode === "login" ? "Sign In" : "Sign Up"}</h2>
        <Btn onClick={signInWithGoogle} style={{ width: "100%", marginTop: 20 }} disabled={loading}>
          {loading ? <Spinner color="#fff" /> : "Continue with Google"}
        </Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN NOTEBOOK APP
═══════════════════════════════════════════════ */
function NotebookApp({ user, onLogout }) {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from("notebooks").select("*").eq("user_id", user.id);
      setNotebooks(data || []);
      setLoading(false);
    };
    loadData();
  }, [user.id]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Your Notebooks</h1>
        <Btn variant="ghost" onClick={onLogout}>Logout</Btn>
      </div>
      {loading ? <Spinner size={30} /> : (
        <div style={{ marginTop: 20 }}>
          {notebooks.length === 0 ? <p>No notebooks yet. Create one!</p> : (
            notebooks.map(nb => <div key={nb.id} style={{ padding: 10, borderBottom: `1px solid ${C.border}` }}>{nb.title}</div>)
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT COMPONENT (THE FIX)
═══════════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("loading");
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    // Check for existing session on startup
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    initAuth();

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = (session) => {
    if (session) {
      setUser({
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email.split("@")[0],
        email: session.user.email
      });
      setPage("app");
    } else {
      setUser(null);
      setPage("landing");
    }
  };

  // Rendering logic based on state
  if (page === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (page === "landing") {
    return <Landing onLogin={() => setPage("auth")} onSignup={() => { setAuthMode("signup"); setPage("auth"); }} />;
  }

  if (page === "auth") {
    return (
      <Auth 
        mode={authMode} 
        onBack={() => setPage("landing")} 
        onSwitch={() => setAuthMode(authMode === "login" ? "signup" : "login")}
        onAuth={(u) => { setUser(u); setPage("app"); }} 
      />
    );
  }

  if (page === "app" && user) {
    return <NotebookApp user={user} onLogout={async () => { await supabase.auth.signOut(); setPage("landing"); }} />;
  }

  return null;
}