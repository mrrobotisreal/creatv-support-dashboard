// Firebase web SDK bootstrap (project: creatv-io). Staff sign in with the same
// Firebase project as the apps; authorization is a backend allowlist, so an
// end-user account that is not allowlisted is rejected by the API.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBkJTE9xm44-WEkm7UUgNGiCYSuQwCPXL8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "creatv-io.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "creatv-io",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "creatv-io.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "201888244102",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:201888244102:web:cec35bff9d4d957f8b4c07",
};

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth: Auth = initializeAuth(firebaseApp, {
  persistence: [browserLocalPersistence],
});

export type { FirebaseUser };

/** Resolves once Firebase has restored (or ruled out) a persisted session. */
export function waitForAuthReady(): Promise<void> {
  return firebaseAuth.authStateReady();
}

export async function getCurrentUser(): Promise<FirebaseUser | null> {
  await waitForAuthReady();
  return firebaseAuth.currentUser;
}

/** Fresh Firebase ID token for the signed-in user (SDK caches until near expiry). */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export function subscribeToAuthState(listener: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, listener);
}

/** Fires on sign-in/out and on every hourly token refresh. */
export function subscribeToIdToken(listener: (user: FirebaseUser | null) => void): () => void {
  return onIdTokenChanged(firebaseAuth, listener);
}

export async function signInWithPassword(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

export function describeAuthError(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default: {
      const message = (error as { message?: string })?.message;
      return typeof message === "string" && message.trim() ? message : fallback;
    }
  }
}
