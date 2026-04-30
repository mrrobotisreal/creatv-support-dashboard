import { create } from "zustand";

type SupportSessionUser = {
  id: string;
  email: string;
  accessToken: string;
  techID: string;
  displayName: string;
  role: string;
};

type SupportSessionStore = {
  user: SupportSessionUser | null;
  setUser: (user: SupportSessionUser | null) => void;
};

export const useSupportSession = create<SupportSessionStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
