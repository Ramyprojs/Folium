"use client";

import { useMemo, useRef, useState } from "react";
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

  const save = useMemo(
    () =>
      debounce(async (payload: SavePayload) => {
        try {
          setSaveState("saving");
          const response = await fetch(`/api/pages/${pageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            setSaveState("error");
            return;
          }

          setSaveState("saved");
          if (doneTimer.current) {
            clearTimeout(doneTimer.current);
          }
          doneTimer.current = setTimeout(() => setSaveState("idle"), 2000);
        } catch {
          setSaveState("error");
        }
      }, 1500),
    [pageId],
  );

  return { save, saveState };
}
