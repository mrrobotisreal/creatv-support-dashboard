import { LifeBuoy, LogOut } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useSupportSession } from "@/hooks/use-support-session";
import { supabase } from "@/integrations/supabase/client";

export function SupportShell() {
  const navigate = useNavigate();
  const { user, setUser } = useSupportSession();

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/20 p-2 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm text-muted-foreground">CreaTV</span>
              <span className="font-semibold">Support Dashboard</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
