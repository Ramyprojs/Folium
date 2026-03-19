"use client";

import { useQuery } from "@tanstack/react-query";

type Workspace = {
  id: string;
  name: string;
  icon: string | null;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

export function useWorkspace() {
  return useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      if (!res.ok) {
        throw new Error("Failed to load workspaces");
      }
      return res.json();
    },
  });
}
