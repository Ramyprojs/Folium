"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Menu,
  MoreHorizontal,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { ShareModal } from "@/components/modals/share-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverTab, setCoverTab] = useState<"upload" | "link" | "unsplash">("upload");
  const [coverLink, setCoverLink] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("nature");
  const [moreOpen, setMoreOpen] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [iconBounce, setIconBounce] = useState(false);
  const { save, saveState } = useEditor(params.pageId);

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

  const unsplashResults = useQuery<{ results: Array<{ id: string; urls: { regular: string } }> }>({
    queryKey: ["unsplash", unsplashQuery],
    queryFn: async () => {
      const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        return { results: [] };
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=12&client_id=${accessKey}`,
      );
      if (!response.ok) {
        return { results: [] };
      }
      return response.json();
    },
    enabled: coverPickerOpen && coverTab === "unsplash",
  });

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

  useEffect(() => {
    setTitleValue(pageQuery.data?.page.title || "");
  }, [pageQuery.data?.page.title]);

  useEffect(() => {
    if (pageQuery.data?.page.icon) {
      setIconBounce(true);
      const timer = setTimeout(() => setIconBounce(false), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pageQuery.data?.page.icon]);

  if (pageQuery.isLoading || !pageQuery.data) {
    return (
      <div className="mx-auto max-w-[720px] px-6 pb-16 pt-24">
        <div className="shimmer mb-5 h-14 w-16 rounded-xl bg-muted" />
        <div className="shimmer mb-4 h-14 w-2/3 rounded-md bg-muted" />
        <div className="shimmer mb-3 h-5 w-1/3 rounded-md bg-muted" />
        <div className="space-y-3">
          <div className="shimmer h-4 w-full rounded-md bg-muted" />
          <div className="shimmer h-4 w-5/6 rounded-md bg-muted" />
          <div className="shimmer h-4 w-4/5 rounded-md bg-muted" />
          <div className="shimmer h-4 w-11/12 rounded-md bg-muted" />
        </div>
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
              value={titleValue}
              className="h-8 max-w-xl border-none bg-transparent px-2 text-sm font-medium shadow-none focus-visible:ring-0"
              onChange={(event) => {
                setTitleValue(event.target.value);
                save({ title: event.target.value });
              }}
            />
            <div className="ml-auto mr-1 text-xs text-muted-foreground">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Saving...
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
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
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setMoreOpen((prev) => !prev)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {moreOpen && (
                <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-md border bg-background p-1 shadow-lg">
                  <button
                    className="flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      const rename = window.prompt("Rename page", titleValue);
                      if (rename) {
                        setTitleValue(rename);
                        save({ title: rename });
                      }
                      setMoreOpen(false);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      setMoreOpen(false);
                    }}
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <motion.div
          key={params.pageId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={
            pageQuery.data.page.fullWidth
              ? "w-full px-8 pb-20 pt-20"
              : "mx-auto max-w-[720px] px-6 pb-20 pt-20"
          }
        >
          <div
            className="group relative h-[200px] w-full overflow-hidden rounded-xl border"
            style={
              pageQuery.data.page.coverImage
                ? {
                    backgroundImage: `url(${pageQuery.data.page.coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!pageQuery.data.page.coverImage && (
              <div className="h-full w-full bg-gradient-to-b from-[#f1efe9] to-[#f8f7f4] dark:from-[#2a2927] dark:to-[#1f1e1c]" />
            )}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <Button size="sm" variant="outline" onClick={() => setCoverPickerOpen(true)}>
                Change cover
              </Button>
              {pageQuery.data.page.coverImage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => save({ coverImage: null })}
                >
                  Remove cover
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              className={`-mt-10 mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-background text-2xl shadow-sm transition-transform ${iconBounce ? "animate-bounce" : ""}`}
              onClick={() => setIconPickerOpen((prev) => !prev)}
            >
              {pageQuery.data.page.icon || "📄"}
            </button>
            {iconPickerOpen && (
              <div className="absolute left-0 top-8 z-20 rounded-lg border bg-background p-2 shadow-lg">
                <Picker
                  data={emojiData}
                  theme="auto"
                  onEmojiSelect={(emoji: { native?: string }) => {
                    if (emoji.native) {
                      save({ icon: emoji.native });
                      setIconPickerOpen(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <Textarea
            value={titleValue}
            className="mb-2 min-h-0 resize-none overflow-hidden border-none bg-transparent px-0 text-[clamp(2.2rem,2rem+1vw,2.8rem)] font-bold tracking-[-0.02em] shadow-none focus-visible:ring-0"
            onChange={(event) => {
              setTitleValue(event.target.value);
              save({ title: event.target.value });
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const editorElement = document.querySelector(".notion-editor .ProseMirror") as HTMLElement | null;
                editorElement?.focus();
              }
            }}
          />
          <p className="mb-6 text-xs text-muted-foreground">
            Last edited by {pageQuery.data.page.createdBy.name} • {formatDistanceToNow(new Date(pageQuery.data.page.updatedAt), { addSuffix: true })}
          </p>
          <TiptapEditor pageId={params.pageId} workspaceId={params.workspaceId} content={content} />
        </motion.div>

        <AnimatePresence>
          {coverPickerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                className="mx-auto mt-16 w-full max-w-3xl rounded-xl border bg-background p-4 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex rounded-md border p-1 text-sm">
                    {(["upload", "link", "unsplash"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`rounded px-2 py-1 capitalize ${coverTab === tab ? "bg-accent" : ""}`}
                        onClick={() => setCoverTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setCoverPickerOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {coverTab === "upload" && (
                  <label className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    <Upload className="mr-2 h-4 w-4" /> Upload image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        const response = await fetch("/api/upload", { method: "POST", body: formData });
                        const data = await response.json();
                        if (data.url) {
                          save({ coverImage: data.url });
                          setCoverPickerOpen(false);
                        }
                      }}
                    />
                  </label>
                )}

                {coverTab === "link" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Paste image URL"
                      value={coverLink}
                      onChange={(event) => setCoverLink(event.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (coverLink) {
                          save({ coverImage: coverLink });
                          setCoverPickerOpen(false);
                        }
                      }}
                    >
                      Apply cover
                    </Button>
                  </div>
                )}

                {coverTab === "unsplash" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search Unsplash"
                        value={unsplashQuery}
                        onChange={(event) => setUnsplashQuery(event.target.value)}
                      />
                      <Button size="sm" variant="outline">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                      {unsplashResults.data?.results.map((item) => (
                        <button
                          key={item.id}
                          className="h-24 rounded-md bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.urls.regular})` }}
                          onClick={() => {
                            save({ coverImage: item.urls.regular });
                            setCoverPickerOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
