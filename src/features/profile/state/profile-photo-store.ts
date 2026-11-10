import { create } from "zustand";

interface ProfilePhotoState {
  /** Link to a picture uploaded in this run, by user id. The stored path only reaches the app at the next sign-in. */
  urls: Readonly<Record<string, string>>;
  setUrl: (userId: string, url: string) => void;
  reset: () => void;
}

export const useProfilePhotoStore = create<ProfilePhotoState>((set) => ({
  urls: {},
  setUrl: (userId, url): void => set((state) => ({ urls: { ...state.urls, [userId]: url } })),
  reset: (): void => set({ urls: {} }),
}));
