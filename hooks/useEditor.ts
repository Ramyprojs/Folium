"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { debounce } from "@/lib/utils";

type SavePayload = {
  title?: string;
  content?: Record<string, unknown>;
  icon?: string | null;
  coverImage?: string | null;
};

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useEditor(pageId: string) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const doneTimer = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const persist = useMemo(
    () =>
      debounce(async (payload: SavePayload) => {
        try {
          const response = await fetch(`/api/pages/${pageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            setSaveState("error");
            await queryClient.invalidateQueries({ queryKey: ["page", pageId] });
            return;
          }

          setSaveState("saved");
          if (doneTimer.current) {
            clearTimeout(doneTimer.current);
          }
          doneTimer.current = setTimeout(() => setSaveState("idle"), 2000);
          await queryClient.invalidateQueries({ queryKey: ["page", pageId] });
        } catch {
          setSaveState("error");
          await queryClient.invalidateQueries({ queryKey: ["page", pageId] });
        }
      }, 700),
    [pageId, queryClient],
  );

  const save = useMemo(
    () => (payload: SavePayload) => {
      setSaveState("saving");
      queryClient.setQueryData<{ page: Record<string, unknown> }>(["page", pageId], (current) => {
        if (!current || !current.page) {
          return current;
        }

        return {
          ...current,
          page: {
            ...current.page,
            ...payload,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      void persist(payload);
    },
    [pageId, persist, queryClient],
  );

  return { save, saveState };
}
