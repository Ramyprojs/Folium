"use client";

import Link from "next/link";
import { ChevronRight, FileText, MoreHorizontal, Plus, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const action = async (type: "rename" | "duplicate" | "favorite" | "delete" | "copy") => {
    if (type === "rename") {
      const newTitle = window.prompt("Rename page", title || "Untitled");
      const sanitized = newTitle?.trim();
      if (sanitized) {
        await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sanitized }),
        });
      }
    }

    if (type === "duplicate") {
      const res = await fetch(`/api/pages/${pageId}`);
      const data = (await res.json()) as {
        page?: {
          id: string;
          title: string;
          parentId: string | null;
          icon: string | null;
          coverImage: string | null;
          content: Record<string, unknown>;
          fullWidth: boolean;
        };
      };

      if (!data.page) {
        setMenuOpen(false);
        return;
      }

      const createdRes = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title: `${data.page.title} copy`, parentId: data.page.parentId }),
      });

      if (createdRes.ok) {
        const createdData = (await createdRes.json()) as { page?: { id: string } };
        if (createdData.page?.id && data.page) {
          await fetch(`/api/pages/${createdData.page.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              icon: data.page.icon,
              coverImage: data.page.coverImage,
              content: data.page.content,
              fullWidth: data.page.fullWidth,
            }),
          });
        }
      }
    }

    if (type === "favorite") {
      await fetch(`/api/pages/${pageId}/favorite`, { method: "PATCH" });
    }

    if (type === "delete") {
      await fetch(`/api/pages/${pageId}/archive`, { method: "PATCH" });
    }

    if (type === "copy") {
      await navigator.clipboard.writeText(`${window.location.origin}/${workspaceId}/${pageId}`);
    }

    setMenuOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
    await queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    if (type === "delete" && isActive) {
      router.push(`/${workspaceId}`);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-md border-l-2 border-transparent px-2 py-1.5 text-[0.875rem] font-medium transition-colors duration-150 ease-out hover:bg-accent/75",
        isActive && "border-l-primary bg-accent/70",
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
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuPos({ x: event.clientX, y: event.clientY });
        setMenuOpen(true);
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
      <div className="ml-auto hidden items-center gap-0.5 group-hover:flex">
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          onClick={async () => {
            const response = await fetch("/api/pages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workspaceId, title: "Untitled", parentId: pageId }),
            });

            if (!response.ok) {
              return;
            }

            const data = (await response.json()) as { page?: { id?: string } };
            await queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
            if (data.page?.id) {
              router.push(`/${workspaceId}/${data.page.id}`);
            }
          }}
          title="Add child page"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          onClick={(event) => {
            event.preventDefault();
            setMenuPos({ x: event.clientX, y: event.clientY });
            setMenuOpen(true);
          }}
          title="Page options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[180px] rounded-md border bg-background p-1 shadow-lg"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          {[
            ["Rename", "rename"],
            ["Duplicate", "duplicate"],
            [isFavorited ? "Remove from favorites" : "Add to favorites", "favorite"],
            ["Copy link", "copy"],
            ["Delete", "delete"],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              className="flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => void action(value as "rename" | "duplicate" | "favorite" | "delete" | "copy")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
