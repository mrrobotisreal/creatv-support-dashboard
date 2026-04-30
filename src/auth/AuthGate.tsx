import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSupportSession } from "@/hooks/use-support-session";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSupportTech } from "@/lib/supportApi";
import type { Session } from "@supabase/supabase-js";

async function verifySupportSession(session: Session | null, setUser: ReturnType<typeof useSupportSession.getState>["setUser"]) {
  if (!session?.user.email || !session.access_token) {
    setUser(null);
    return;
  }
  try {
    const tech = await getCurrentSupportTech(session.access_token);
    setUser({
      id: session.user.id,
      email: session.user.email,
      accessToken: session.access_token,
      techID: tech.tech_id,
      displayName: tech.display_name,
      role: tech.role,
    });
  } catch {
    setUser(null);
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { setUser } = useSupportSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await verifySupportSession(data.session, setUser);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void verifySupportSession(session, setUser);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [setUser]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading support dashboard...</div>;
  }
  return <>{children}</>;
}

export function RequireSupportSession() {
  const location = useLocation();
  const { user } = useSupportSession();
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  }
  return <Outlet />;
}
