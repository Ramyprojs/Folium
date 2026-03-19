"use client";

import Link from "next/link";
import { ChevronRight, FileText, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  pageId: string;
  workspaceId: string;
  title: string;
  icon?: string | null;
  depth?: number;
  isFavorited?: boolean;
  isActive?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onDropPage?: (sourcePageId: string, targetPageId: string) => void;
};

export function SidebarItem({
  pageId,
  workspaceId,
  title,
  icon,
  depth = 0,
  isFavorited,
  isActive,
  hasChildren,
  isExpanded,
  onToggle,
  onDropPage,
}: SidebarItemProps): JSX.Element {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        isActive && "bg-accent",
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", pageId);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const sourcePageId = event.dataTransfer.getData("text/plain");
        if (!sourcePageId || sourcePageId === pageId || !onDropPage) {
          return;
        }
        onDropPage(sourcePageId, pageId);
      }}
    >
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted"
        onClick={onToggle}
        disabled={!hasChildren}
      >
        <ChevronRight
          className={cn("h-3 w-3 text-muted-foreground transition-transform", hasChildren && isExpanded && "rotate-90")}
        />
      </button>
      <Link href={`/${workspaceId}/${pageId}`} className="flex min-w-0 flex-1 items-center gap-2">
        <span>{icon || <FileText className="h-4 w-4" />}</span>
        <span className="truncate">{title}</span>
      </Link>
      {isFavorited && <Star className="ml-auto h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
    </div>
  );
}
