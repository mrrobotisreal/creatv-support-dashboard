import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import icon from "@/assets/support_icon.png";
import { useSupportSession } from "@/hooks/use-support-session";
import { describeAuthError, signInWithPassword, signOut } from "@/integrations/firebase/client";
import { getCurrentSupportTech } from "@/lib/supportApi";

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
    let firebaseUser;
    try {
      firebaseUser = await signInWithPassword(email, password);
    } catch (err) {
      setLoading(false);
      setError(describeAuthError(err, "Unable to sign in."));
      return;
    }
    setLoading(false);
    if (!firebaseUser.email) {
      await signOut();
      setError("Unable to sign in.");
      return;
    }
    try {
      const accessToken = await firebaseUser.getIdToken();
      const tech = await getCurrentSupportTech(accessToken);
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        accessToken,
        techID: tech.tech_id,
        displayName: tech.display_name,
        role: tech.role,
      });
    } catch (err) {
      await signOut();
      setError(err instanceof Error ? err.message : "This account is not authorized for the support dashboard.");
      return;
    }
    navigate(searchParams.get("redirect") || "/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xl" onSubmit={submit}>
        <div>
          <div className="mb-8 flex items-center justify-center gap-3">
            <img src={icon} alt="CreaTV Support icon" className="h-16 w-16" />
            <h1 className="flex items-center gap-0.25 text-4xl font-medium">
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(265_83%_57%)] to-[hsl(203_92%_75%)] bg-clip-text text-transparent">
                Crea
              </span>
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(24_96%_55%)] to-[hsl(63_100%_73%)] bg-clip-text text-transparent">
                TV
              </span>
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(203_92%_75%)] to-[hsl(265_83%_57%)] bg-clip-text text-transparent">
                -Support
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
