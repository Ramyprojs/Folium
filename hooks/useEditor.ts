"use client";

import { useMemo } from "react";
import { debounce } from "@/lib/utils";

type SavePayload = {
  title?: string;
  content?: Record<string, unknown>;
};

export function useEditor(pageId: string) {
  const save = useMemo(
    () =>
      debounce(async (payload: SavePayload) => {
        await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }, 1500),
    [pageId],
  );

  return { save };
}
