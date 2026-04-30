import { LogOut } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import icon from "@/assets/support_icon.png";
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
            <img src={icon} alt="CreaTV Support icon" className="h-12 w-12" />
            <span className="flex items-center gap-0.25 text-2xl font-medium">
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(265_83%_57%)] to-[hsl(203_92%_75%)] bg-clip-text text-transparent">
                Crea
              </span>
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(24_96%_55%)] to-[hsl(63_100%_73%)] bg-clip-text text-transparent">
                TV{" "}
              </span>
              <span className="font-rubik-glitch bg-gradient-to-r from-[hsl(265_83%_57%)] to-[hsl(203_92%_75%)] bg-clip-text text-transparent">
                Support
              </span>
            </span>
            <span className="hidden text-sm font-semibold text-muted-foreground sm:inline">Support Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.displayName || user?.email}</span>
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
