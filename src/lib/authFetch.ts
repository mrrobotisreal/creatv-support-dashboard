import { useSupportSession } from "@/hooks/use-support-session";
import { supabase } from "@/integrations/supabase/client";

async function resolveAccessToken(): Promise<string | null> {
  const state = useSupportSession.getState();
  if (state.user?.accessToken) {
    return state.user.accessToken;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  const session = data.session;
  if (!session?.access_token || !session.user.email) {
    return null;
  }
  state.setUser({
    id: session.user.id,
    email: session.user.email,
    accessToken: session.access_token,
  });
  return session.access_token;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Authorization")) {
    const token = await resolveAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(input, { ...init, headers });
}
