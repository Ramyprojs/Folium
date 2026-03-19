"use client";

import { motion } from "framer-motion";
import { Moon, Plus, Search, Settings, Sun } from "lucide-react";
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
  const { resolvedTheme, setTheme } = useTheme();

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
        className="relative h-screen overflow-hidden border-r bg-[#f7f6f3] dark:bg-[#1c1b1a]"
      >
        <div className="flex h-full flex-col">
          <div className="border-b px-3 py-2">
            <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
