import { getIdToken } from "@/integrations/firebase/client";

/**
 * Fetch with the signed-in staff member's Firebase ID token. The token is read
 * from the Firebase SDK on every call (it is cached and refreshed by the SDK),
 * so a long-lived dashboard tab never sends an expired bearer.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Authorization")) {
    const token = await getIdToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401) {
    return response;
  }
  // Token may have expired mid-flight — force a refresh and retry once.
  const refreshed = await getIdToken(true);
  if (!refreshed) {
    return response;
  }
  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${refreshed}`);
  return fetch(input, { ...init, headers: retryHeaders });
}
