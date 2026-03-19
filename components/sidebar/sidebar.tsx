"use client";

import { motion } from "framer-motion";
import { Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

  return (
    <>
      {searchOpen && <SearchModal workspaceId={workspaceId} onClose={() => setSearchOpen(false)} />}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? width : 0 }}
        className="h-screen border-r bg-card overflow-hidden relative"
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-2">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <Link href={`/settings/workspace`}>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
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
          <div className="flex-1 overflow-y-auto p-2">
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
