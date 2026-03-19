import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  isOpen: boolean;
  width: number;
  toggle: () => void;
  setOpen: (value: boolean) => void;
  setWidth: (width: number) => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      width: 280,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (value) => set({ isOpen: value }),
      setWidth: (width) => set({ width: Math.max(180, Math.min(400, width)) }),
    }),
    {
      name: "folium-sidebar",
      partialize: (state) => ({ isOpen: state.isOpen, width: state.width }),
    },
  ),
);
