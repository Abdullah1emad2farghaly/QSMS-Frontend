import { create } from 'zustand';

interface UiState {
  /** Mobile navigation drawer. Not persisted. */
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
}

/** Global, non-business UI state shared by layouts. */
export const useUiStore = create<UiState>()((set) => ({
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
  toggleNav: () => set((state) => ({ navOpen: !state.navOpen })),
}));
