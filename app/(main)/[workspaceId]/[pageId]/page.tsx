"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Share2, Star, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { ShareModal } from "@/components/modals/share-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditor } from "@/hooks/useEditor";
import { useSidebarStore } from "@/store/sidebar";

type PageData = {
  id: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: Record<string, unknown>;
  isPublic: boolean;
  fullWidth: boolean;
  updatedAt: string;
  createdBy: { name: string };
};

export default function WorkspacePage({
  params,
}: {
  params: { workspaceId: string; pageId: string };
}): JSX.Element {
  const { isOpen, setOpen } = useSidebarStore();
  const [shareOpen, setShareOpen] = useState(false);
  const { save } = useEditor(params.pageId);

  const pageQuery = useQuery<{ page: PageData }>({
    queryKey: ["page", params.pageId],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${params.pageId}`);
      if (!res.ok) {
        throw new Error("Failed to load page");
      }
      return res.json();
    },
  });

  const content = useMemo(
    () =>
      pageQuery.data?.page.content || {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    [pageQuery.data?.page.content],
  );

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (window.innerWidth < 900) {
      setOpen(false);
    }
  }, [setOpen]);

  if (pageQuery.isLoading || !pageQuery.data) {
    return (
      <div className="p-6">
        <div className="mb-2 h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fbfbfa] dark:bg-[#1b1a19]">
      {isOpen && <Sidebar workspaceId={params.workspaceId} activePageId={params.pageId} />}

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
            <Button variant="ghost" size="sm" onClick={() => setOpen(!isOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Input
              defaultValue={pageQuery.data.page.title}
              className="h-8 max-w-xl border-none bg-transparent px-2 text-sm font-medium shadow-none focus-visible:ring-0"
              onChange={(event) => save({ title: event.target.value })}
            />
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch(`/api/pages/${params.pageId}/favorite`, { method: "PATCH" });
                pageQuery.refetch();
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch(`/api/pages/${params.pageId}/archive`, { method: "PATCH" });
                window.location.href = `/${params.workspaceId}`;
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div
          className={
            pageQuery.data.page.fullWidth
              ? "w-full px-8 pb-20"
              : "mx-auto max-w-3xl px-6 pb-20"
          }
        >
          <div className="mt-5 h-40 w-full rounded-xl border bg-gradient-to-b from-[#f1efe9] to-[#f8f7f4] dark:from-[#2a2927] dark:to-[#1f1e1c]" />
          <div className="-mt-8 mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-background text-2xl shadow-sm">
            {pageQuery.data.page.icon || "📄"}
          </div>
          <Input
            defaultValue={pageQuery.data.page.title}
            className="mb-2 h-auto border-none bg-transparent px-0 text-4xl font-bold shadow-none focus-visible:ring-0"
            onChange={(event) => save({ title: event.target.value })}
          />
          <p className="mb-6 text-xs text-muted-foreground">
            Last edited by {pageQuery.data.page.createdBy.name} • {new Date(pageQuery.data.page.updatedAt).toLocaleString()}
          </p>
          <TiptapEditor pageId={params.pageId} content={content} />
        </div>
      </main>

      {shareOpen && (
        <ShareModal
          pageId={params.pageId}
          isPublic={pageQuery.data.page.isPublic}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
