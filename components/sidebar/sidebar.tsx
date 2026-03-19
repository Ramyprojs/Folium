"use client";

import { motion } from "framer-motion";
import { ChevronDown, Leaf, Moon, Plus, Search, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { PageTree } from "@/components/sidebar/page-tree";
import { SearchModal } from "@/components/modals/search-modal";
import { useSidebarStore } from "@/store/sidebar";

type SidebarProps = {
  workspaceId: string;
  activePageId?: string;
};

export function Sidebar({ workspaceId, activePageId }: SidebarProps): JSX.Element {
  const { isOpen, width, setWidth } = useSidebarStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolvedTheme, theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <>
      {searchOpen && <SearchModal workspaceId={workspaceId} onClose={() => setSearchOpen(false)} />}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? width : 0 }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        className="relative h-screen overflow-hidden border-r bg-card"
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-3 py-3">
            <button type="button" className="mb-2 flex w-full items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent/60">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/35 dark:text-violet-300">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="flex-1 text-left text-[15px] font-semibold tracking-tight">Folium Workspace</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Workspace</div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cycleTheme} title={`Theme: ${theme || resolvedTheme || "system"}`}>
                {theme === "system" ? (
                  <span className="text-[10px] font-semibold uppercase">Sys</span>
                ) : resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Link href={`/settings/workspace`}>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={async () => {
                  await fetch("/api/pages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workspaceId, title: "Untitled" }),
                  });
                  window.location.reload();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            <PageTree workspaceId={workspaceId} activePageId={activePageId} />
          </div>
        </div>
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-border"
          onMouseDown={(event) => {
            const startX = event.clientX;
            const startWidth = width;

            const onMove = (moveEvent: MouseEvent) => {
              setWidth(startWidth + (moveEvent.clientX - startX));
            };

            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        />
      </motion.aside>
    </>
  );
}
