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
  const pendingPayload = useRef<SavePayload | null>(null);
  const flushInFlight = useRef(false);
  const queryClient = useQueryClient();

  const flushQueue = useMemo(
    () => async () => {
      if (flushInFlight.current) {
        return;
      }

      flushInFlight.current = true;

      try {
        while (pendingPayload.current) {
          const payload = pendingPayload.current;
          pendingPayload.current = null;

          try {
            const currentPage = queryClient.getQueryData<{ page?: { workspaceId?: string } }>(["page", pageId]);
            const workspaceId = currentPage?.page?.workspaceId;

            const response = await fetch(`/api/pages/${pageId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              setSaveState("error");
              void queryClient.invalidateQueries({ queryKey: ["page", pageId] });
              if (workspaceId) {
                void queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
              }
              continue;
            }

            setSaveState("saved");
            if (doneTimer.current) {
              clearTimeout(doneTimer.current);
            }
            doneTimer.current = setTimeout(() => setSaveState("idle"), 2000);
          } catch {
            setSaveState("error");
            void queryClient.invalidateQueries({ queryKey: ["page", pageId] });
            const currentPage = queryClient.getQueryData<{ page?: { workspaceId?: string } }>(["page", pageId]);
            if (currentPage?.page?.workspaceId) {
              void queryClient.invalidateQueries({ queryKey: ["pages", currentPage.page.workspaceId] });
            }
          }
        }
      } finally {
        flushInFlight.current = false;
        if (pendingPayload.current) {
          void flushQueue();
        }
      }
    },
    [pageId, queryClient],
  );

  const persist = useMemo(
    () =>
      debounce((payload: SavePayload) => {
        pendingPayload.current = {
          ...(pendingPayload.current || {}),
          ...payload,
        };
        void flushQueue();
      }, 700),
    [flushQueue],
  );

  const save = useMemo(
    () => (payload: SavePayload) => {
      setSaveState("saving");
      const currentPage = queryClient.getQueryData<{ page?: { workspaceId?: string } }>(["page", pageId]);
      const workspaceId = currentPage?.page?.workspaceId;

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

      if (workspaceId && (payload.title !== undefined || payload.icon !== undefined)) {
        queryClient.setQueryData<{ pages: Array<Record<string, unknown>> }>(["pages", workspaceId], (current) => {
          if (!current?.pages) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => {
              if (String(page.id) !== pageId) {
                return page;
              }

              return {
                ...page,
                ...(payload.title !== undefined ? { title: payload.title } : {}),
                ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
              };
            }),
          };
        });
      }

      void persist(payload);
    },
    [pageId, persist, queryClient],
  );

  return { save, saveState };
}
