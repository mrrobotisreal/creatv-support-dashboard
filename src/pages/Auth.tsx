import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import logo from "@/assets/logo.png";
import { useSupportSession } from "@/hooks/use-support-session";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useSupportSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.session?.user.email) {
      setError(error?.message || "Unable to sign in.");
      return;
    }
    setUser({
      id: data.session.user.id,
      email: data.session.user.email,
      accessToken: data.session.access_token,
    });
    navigate(searchParams.get("redirect") || "/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xl" onSubmit={submit}>
        <div>
          <div className="mb-8 flex items-center justify-center gap-3">
            <img src={logo} alt="CreaTV logo" className="h-16 w-16" />
            <h1 className="flex items-center gap-0.25 text-4xl font-medium">
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(265_83%_57%)] to-[hsl(203_92%_75%)] bg-clip-text text-transparent">
                Crea
              </span>
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(24_96%_55%)] to-[hsl(63_100%_73%)] bg-clip-text text-transparent">
                TV
              </span>
            </h1>
          </div>
          <h1 className="mt-2 text-2xl font-bold">Support dashboard sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use your authorized account to manage support tickets.</p>
        </div>
        <label className="grid gap-2 text-sm">
          Email
          <input className="rounded-lg border border-input bg-background px-3 py-2 outline-none ring-primary focus:ring-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm">
          Password
          <input className="rounded-lg border border-input bg-background px-3 py-2 outline-none ring-primary focus:ring-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
