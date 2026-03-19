"use client";

import { useQuery } from "@tanstack/react-query";

export type PageNode = {
  id: string;
  title: string;
  icon: string | null;
  isFavorited: boolean;
  isArchived: boolean;
  parentId: string | null;
  workspaceId: string;
};

export function usePages(workspaceId: string) {
  return useQuery<{ pages: PageNode[] }>({
    queryKey: ["pages", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=&workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error("Failed to load pages");
      }
      const data = await res.json();
      return { pages: data.pages || [] };
    },
  });
}
