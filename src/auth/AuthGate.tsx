import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSupportSession } from "@/hooks/use-support-session";
import { supabase } from "@/integrations/supabase/client";

export function AuthGate({ children }: { children: ReactNode }) {
  const { setUser } = useSupportSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setUser(
        session?.user.email && session.access_token
          ? { id: session.user.id, email: session.user.email, accessToken: session.access_token }
          : null,
      );
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user.email && session.access_token
          ? { id: session.user.id, email: session.user.email, accessToken: session.access_token }
          : null,
      );
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
