import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Show loading while checking session
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // If NOT logged in
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>You are not logged in</h2>

        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo:
                  "https://notebookai-pro.vercel.app/auth/callback",
              },
            });
          }}
        >
          Login with Google
        </button>
      </div>
    );
  }

  // If logged in
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome 🎉</h2>
      <p>{user.email}</p>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
        }}
      >
        Logout
      </button>
    </div>
  );
}
