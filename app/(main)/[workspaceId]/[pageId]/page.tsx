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
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  if (pageQuery.isLoading || !pageQuery.data) {
    return <div className="p-6">Loading page...</div>;
  }

  return (
    <div className="flex h-screen">
      {isOpen && <Sidebar workspaceId={params.workspaceId} activePageId={params.pageId} />}

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(!isOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Input
              defaultValue={pageQuery.data.page.title}
              className="max-w-xl"
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

        <div className={pageQuery.data.page.fullWidth ? "w-full px-8 py-6" : "mx-auto max-w-3xl px-4 py-6"}>
          <p className="mb-4 text-xs text-muted-foreground">
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
