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
};

export function SidebarItem({
  pageId,
  workspaceId,
  title,
  icon,
  depth = 0,
  isFavorited,
  isActive,
}: SidebarItemProps): JSX.Element {
  return (
    <Link
      href={`/${workspaceId}/${pageId}`}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        isActive && "bg-accent",
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span>{icon || <FileText className="h-4 w-4" />}</span>
      <span className="truncate">{title}</span>
      {isFavorited && <Star className="ml-auto h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
    </Link>
  );
}
