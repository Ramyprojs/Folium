"use client";

import { useMemo } from "react";
import { usePages } from "@/hooks/usePages";
import { SidebarItem } from "@/components/sidebar/sidebar-item";

type PageTreeProps = {
  workspaceId: string;
  activePageId?: string;
};

export function PageTree({ workspaceId, activePageId }: PageTreeProps): JSX.Element {
  const { data, isLoading } = usePages(workspaceId);

  const ordered = useMemo(() => {
    return [...(data?.pages || [])].sort((a, b) => a.title.localeCompare(b.title));
  }, [data?.pages]);

  if (isLoading) {
    return <div className="space-y-2 p-2">Loading pages...</div>;
  }

  return (
    <div className="space-y-1">
      {ordered.map((page) => (
        <SidebarItem
          key={page.id}
          pageId={page.id}
          workspaceId={workspaceId}
          title={page.title}
          icon={page.icon}
          isFavorited={page.isFavorited}
          isActive={activePageId === page.id}
        />
      ))}
    </div>
  );
}
