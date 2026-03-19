import { create } from "zustand";

type WorkspaceState = {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
}));
