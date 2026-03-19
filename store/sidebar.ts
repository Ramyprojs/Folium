import { create } from "zustand";

type SidebarState = {
  isOpen: boolean;
  width: number;
  toggle: () => void;
  setOpen: (value: boolean) => void;
  setWidth: (width: number) => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  width: 280,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (value) => set({ isOpen: value }),
  setWidth: (width) => set({ width: Math.max(220, Math.min(420, width)) }),
}));
