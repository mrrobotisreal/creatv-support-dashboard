import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSupportSession } from "@/hooks/use-support-session";
import { subscribeToIdToken, type FirebaseUser } from "@/integrations/firebase/client";
import { getCurrentSupportTech } from "@/lib/supportApi";

async function verifySupportSession(
  firebaseUser: FirebaseUser | null,
  setUser: ReturnType<typeof useSupportSession.getState>["setUser"],
) {
  if (!firebaseUser || firebaseUser.isAnonymous || !firebaseUser.email) {
    setUser(null);
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
  } catch {
    setUser(null);
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { setUser } = useSupportSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    // onIdTokenChanged emits the restored session immediately, then on every
    // sign-in / sign-out / hourly token refresh.
    const unsubscribe = subscribeToIdToken(async (firebaseUser) => {
      if (!mounted) return;
      if (location.pathname.startsWith("/auth") && ready) {
        return;
      }
      await verifySupportSession(firebaseUser, setUser);
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setUser]);

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
