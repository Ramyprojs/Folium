"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
      <div key={page.id}>
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
        {children.length > 0 && isExpanded && (
          <div>{children.map((child) => renderNode(child.id, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="space-y-2 p-2">Loading pages...</div>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Favorites</p>
        <div className="space-y-1">
          {favoritePages.length === 0 && <p className="px-2 text-xs text-muted-foreground">No favorite pages yet</p>}
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
        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pages</p>
        <div className="space-y-1">{rootPages.map((page) => renderNode(page.id, 0))}</div>
      </div>
    </div>
  );
}
