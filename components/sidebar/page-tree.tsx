"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePages } from "@/hooks/usePages";
import { SidebarItem } from "@/components/sidebar/sidebar-item";

type PageTreeProps = {
  workspaceId: string;
  activePageId?: string;
};

export function PageTree({ workspaceId, activePageId }: PageTreeProps): JSX.Element {
  const { data, isLoading } = usePages(workspaceId);
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const pages = data?.pages || [];

  const grouped = useMemo(() => {
    const groups = new Map<string | null, typeof pages>();
    for (const page of pages) {
      const key = page.parentId || null;
      const bucket = groups.get(key) || [];
      bucket.push(page);
      groups.set(key, bucket);
    }
    for (const [key, bucket] of groups.entries()) {
      groups.set(
        key,
        [...bucket].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title)),
      );
    }
    return groups;
  }, [data?.pages]);

  const rootPages = grouped.get(null) || [];
  const favoritePages = pages.filter((page) => page.isFavorited);

  const movePage = async (sourcePageId: string, targetPageId: string) => {
    await fetch(`/api/pages/${sourcePageId}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: targetPageId }),
    });
    await queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
  };

  const renderNode = (pageId: string, depth: number): JSX.Element | null => {
    const page = pages.find((entry) => entry.id === pageId);
    if (!page) {
      return null;
    }

    const children = grouped.get(page.id) || [];
    const isExpanded = expanded[page.id] ?? depth < 1;

    return (
      <motion.div
        key={page.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.18, delay: depth * 0.03 }}
      >
        <SidebarItem
          pageId={page.id}
          workspaceId={workspaceId}
          title={page.title}
          icon={page.icon}
          isFavorited={page.isFavorited}
          isActive={activePageId === page.id}
          depth={depth}
          hasChildren={children.length > 0}
          isExpanded={isExpanded}
          onToggle={() => setExpanded((prev) => ({ ...prev, [page.id]: !isExpanded }))}
          onDropPage={movePage}
        />
        <AnimatePresence initial={false}>
          {children.length > 0 && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {children.map((child) => renderNode(child.id, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <div className="shimmer h-7 rounded-md bg-muted" />
        <div className="shimmer h-7 rounded-md bg-muted" />
        <div className="shimmer h-7 rounded-md bg-muted" />
        <div className="shimmer h-7 rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Favorites</p>
        <div className="space-y-1">
          {favoritePages.length === 0 && (
            <div className="rounded-md border border-dashed p-2 text-center">
              <svg viewBox="0 0 80 40" className="mx-auto mb-1 h-8 w-16 text-muted-foreground/50">
                <path d="M10 30c6-14 16-14 22 0 6-14 16-14 22 0" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="20" cy="16" r="3" fill="currentColor" />
                <circle cx="40" cy="12" r="3" fill="currentColor" />
                <circle cx="58" cy="16" r="3" fill="currentColor" />
              </svg>
              <p className="px-2 text-xs text-muted-foreground">No favorite pages yet</p>
            </div>
          )}
          {favoritePages.map((page) => (
            <SidebarItem
              key={`fav-${page.id}`}
              pageId={page.id}
              workspaceId={workspaceId}
              title={page.title}
              icon={page.icon}
              isFavorited
              isActive={activePageId === page.id}
              onDropPage={movePage}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pages</p>
        {rootPages.length === 0 ? (
          <div className="rounded-md border border-dashed p-2 text-center">
            <p className="mb-2 text-xs text-muted-foreground">No pages yet</p>
            <button
              type="button"
              className="rounded-md bg-accent px-2 py-1 text-xs transition-colors hover:bg-accent/70"
              onClick={async () => {
                await fetch("/api/pages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ workspaceId, title: "Untitled" }),
                });
                await queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
              }}
            >
              Create your first page
            </button>
          </div>
        ) : (
          <div className="space-y-1">{rootPages.map((page) => renderNode(page.id, 0))}</div>
        )}
      </div>
    </div>
  );
}
