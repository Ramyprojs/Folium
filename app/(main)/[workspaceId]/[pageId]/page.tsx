"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import {
  Check,
  ChevronDown,
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

type CoverTab = "solid" | "gradient" | "animated" | "upload" | "unsplash";

type CoverConfig =
  | { kind: "none" }
  | { kind: "image"; url: string; focalY: number }
  | { kind: "solid"; value: string }
  | { kind: "gradient"; value: string }
  | { kind: "animated"; value: string };

const SOLID_COVERS = [
  { name: "Ivory", value: "#f7f3ea" },
  { name: "Sand", value: "#eadfc8" },
  { name: "Coral", value: "#f5cdc4" },
  { name: "Rose", value: "#efd2db" },
  { name: "Lavender", value: "#ddd7f0" },
  { name: "Sky", value: "#cee4f8" },
  { name: "Mint", value: "#cbe9dd" },
  { name: "Forest", value: "#bfd7c2" },
  { name: "Coal", value: "#2c2e31" },
] as const;

const GRADIENT_COVERS = [
  {
    name: "Sunset Bloom",
    value: "linear-gradient(135deg, #fda085 0%, #f6d365 35%, #fbc2eb 100%)",
  },
  {
    name: "Ocean Air",
    value: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  },
  {
    name: "Forest Dew",
    value: "linear-gradient(140deg, #d4fc79 0%, #96e6a1 100%)",
  },
  {
    name: "Velvet Night",
    value: "linear-gradient(145deg, #1e3c72 0%, #2a5298 45%, #b06ab3 100%)",
  },
  {
    name: "Amber Mist",
    value: "linear-gradient(145deg, #f6d365 0%, #fda085 100%)",
  },
  {
    name: "Aurora",
    value: "linear-gradient(145deg, #43cea2 0%, #185a9d 100%)",
  },
] as const;

const ANIMATED_COVERS = [
  {
    id: "aurora-flow",
    name: "Aurora Flow",
    base: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #0ea5e9 100%)",
    blobs: ["#22d3ee", "#818cf8", "#34d399"],
  },
  {
    id: "peach-fizz",
    name: "Peach Fizz",
    base: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    blobs: ["#fb7185", "#f97316", "#facc15"],
  },
  {
    id: "emerald-haze",
    name: "Emerald Haze",
    base: "linear-gradient(140deg, #022c22 0%, #14532d 45%, #4d7c0f 100%)",
    blobs: ["#6ee7b7", "#86efac", "#34d399"],
  },
] as const;

function encodeImageCover(url: string, focalY = 50): string {
  const params = new URLSearchParams({ url, fy: String(Math.round(focalY)) });
  return `folium:cover:image:${encodeURIComponent(params.toString())}`;
}

function encodeGeneratedCover(kind: "solid" | "gradient" | "animated", value: string): string {
  return `folium:cover:${kind}:${encodeURIComponent(value)}`;
}

function decodeCover(raw: string | null): CoverConfig {
  if (!raw) {
    return { kind: "none" };
  }

  if (raw.startsWith("folium:cover:")) {
    const payload = raw.slice("folium:cover:".length);
    const firstColon = payload.indexOf(":");
    if (firstColon === -1) {
      return { kind: "none" };
    }

    const kind = payload.slice(0, firstColon);
    const encoded = payload.slice(firstColon + 1);

    if (kind === "image") {
      const decoded = decodeURIComponent(encoded);
      const params = new URLSearchParams(decoded);
      const url = params.get("url") || "";
      const focalY = Number(params.get("fy") || "50");
      if (!url) {
        return { kind: "none" };
      }
      return {
        kind: "image",
        url,
        focalY: Number.isFinite(focalY) ? Math.max(0, Math.min(100, focalY)) : 50,
      };
    }

    if (kind === "solid" || kind === "gradient" || kind === "animated") {
      const value = decodeURIComponent(encoded);
      return { kind, value };
    }
  }

  return { kind: "image", url: raw, focalY: 50 };
}

export default function WorkspacePage({
  params,
}: {
  params: { workspaceId: string; pageId: string };
}): JSX.Element {
  const { isOpen, setOpen } = useSidebarStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverTab, setCoverTab] = useState<CoverTab>("solid");
  const [coverLink, setCoverLink] = useState("");
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [coverFocalY, setCoverFocalY] = useState(50);
  const [unsplashInput, setUnsplashInput] = useState("nature");
  const [unsplashQuery, setUnsplashQuery] = useState("nature");
  const [moreOpen, setMoreOpen] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [iconBounce, setIconBounce] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const coverFrameRef = useRef<HTMLDivElement | null>(null);
  const { save, saveState } = useEditor(params.pageId);
  const unsplashAccessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

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

  const parsedCover = useMemo(
    () => decodeCover(pageQuery.data?.page.coverImage || null),
    [pageQuery.data?.page.coverImage],
  );

  const activeAnimatedCover = useMemo(
    () =>
      ANIMATED_COVERS.find((item) => item.id === (parsedCover.kind === "animated" ? parsedCover.value : "")) ||
      null,
    [parsedCover],
  );

  const unsplashResults = useInfiniteQuery<{
    results: Array<{ id: string; urls: { regular: string; small: string } }>;
    nextPage: number | null;
  }>({
    queryKey: ["unsplash", unsplashQuery],
    queryFn: async ({ pageParam }) => {
      if (!unsplashAccessKey) {
        return { results: [], nextPage: null };
      }

      const page = typeof pageParam === "number" ? pageParam : 1;

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=18&page=${page}&client_id=${unsplashAccessKey}`,
      );
      if (!response.ok) {
        return { results: [], nextPage: null };
      }

      const data = (await response.json()) as {
        results: Array<{ id: string; urls: { regular: string; small: string } }>;
        total_pages: number;
      };

      return {
        results: data.results,
        nextPage: page < Math.min(data.total_pages, 12) ? page + 1 : null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: coverPickerOpen && coverTab === "unsplash" && Boolean(unsplashAccessKey),
  });

  const unsplashItems = useMemo(
    () => unsplashResults.data?.pages.flatMap((page) => page.results) || [],
    [unsplashResults.data?.pages],
  );

  const applyImageCover = (url: string, focalY = 50) => {
    const encoded = encodeImageCover(url, focalY);
    setCoverFocalY(focalY);
    save({ coverImage: encoded });
  };

  const applyGeneratedCover = (kind: "solid" | "gradient" | "animated", value: string) => {
    save({ coverImage: encodeGeneratedCover(kind, value) });
    setCoverPickerOpen(false);
  };

  const updateFocal = (value: number) => {
    const next = Math.max(0, Math.min(100, value));
    setCoverFocalY(next);
    if (parsedCover.kind === "image") {
      save({ coverImage: encodeImageCover(parsedCover.url, next) });
    }
  };

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

  useEffect(() => {
    if (parsedCover.kind === "image") {
      setCoverFocalY(parsedCover.focalY);
    }
  }, [parsedCover]);

  useEffect(() => {
    if (!coverPickerOpen || coverTab !== "unsplash" || !loadMoreRef.current) {
      return undefined;
    }

    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && unsplashResults.hasNextPage && !unsplashResults.isFetchingNextPage) {
          unsplashResults.fetchNextPage();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    coverPickerOpen,
    coverTab,
    unsplashResults.fetchNextPage,
    unsplashResults.hasNextPage,
    unsplashResults.isFetchingNextPage,
  ]);

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
            ref={coverFrameRef}
            className={`group relative h-[220px] w-full overflow-hidden rounded-xl border ${parsedCover.kind === "image" ? "cursor-ns-resize" : ""}`}
            style={{
              background:
                parsedCover.kind === "solid"
                  ? parsedCover.value
                  : parsedCover.kind === "gradient"
                    ? parsedCover.value
                    : undefined,
              backgroundImage: parsedCover.kind === "image" ? `url(${parsedCover.url})` : undefined,
              backgroundSize: parsedCover.kind === "image" ? "cover" : undefined,
              backgroundPosition: parsedCover.kind === "image" ? `center ${coverFocalY}%` : undefined,
            }}
            onPointerDown={(event) => {
              if (parsedCover.kind !== "image") {
                return;
              }

              const box = coverFrameRef.current?.getBoundingClientRect();
              if (!box) {
                return;
              }

              const y = ((event.clientY - box.top) / box.height) * 100;
              setIsDraggingCover(true);
              updateFocal(y);
            }}
            onPointerMove={(event) => {
              if (!isDraggingCover || parsedCover.kind !== "image") {
                return;
              }

              const box = coverFrameRef.current?.getBoundingClientRect();
              if (!box) {
                return;
              }

              const y = ((event.clientY - box.top) / box.height) * 100;
              updateFocal(y);
            }}
            onPointerUp={() => setIsDraggingCover(false)}
            onPointerLeave={() => setIsDraggingCover(false)}
          >
            {activeAnimatedCover && (
              <>
                <div className="absolute inset-0" style={{ background: activeAnimatedCover.base }} />
                {activeAnimatedCover.blobs.map((blob, index) => (
                  <motion.div
                    key={blob}
                    className="absolute h-40 w-40 rounded-full blur-2xl"
                    style={{
                      backgroundColor: blob,
                      left: `${10 + index * 30}%`,
                      top: `${20 + index * 10}%`,
                    }}
                    animate={{
                      x: [0, index % 2 === 0 ? 28 : -24, 0],
                      y: [0, index % 2 === 0 ? -18 : 16, 0],
                      scale: [1, 1.12, 1],
                    }}
                    transition={{
                      duration: 7 + index,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </>
            )}

            {parsedCover.kind === "none" && (
              <div className="h-full w-full bg-gradient-to-b from-[#f1efe9] to-[#f8f7f4] dark:from-[#2a2927] dark:to-[#1f1e1c]" />
            )}

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <Button size="sm" variant="outline" onClick={() => setCoverPickerOpen(true)}>
                Change cover
              </Button>
              {parsedCover.kind !== "none" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => save({ coverImage: null })}
                >
                  Remove cover
                </Button>
              )}
            </div>
            {parsedCover.kind === "image" && (
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                Drag to reposition
              </div>
            )}
          </div>

          {parsedCover.kind === "image" && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Focus</span>
              <input
                type="range"
                min={0}
                max={100}
                value={coverFocalY}
                className="h-2 w-56 accent-primary"
                onChange={(event) => updateFocal(Number(event.target.value))}
              />
            </div>
          )}
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
                  <div className="inline-flex flex-wrap rounded-md border p-1 text-sm">
                    {(["solid", "gradient", "animated", "upload", "unsplash"] as const).map((tab) => (
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

                {coverTab === "solid" && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {SOLID_COVERS.map((cover) => (
                      <button
                        key={cover.value}
                        className="overflow-hidden rounded-md border text-left transition hover:-translate-y-0.5"
                        onClick={() => applyGeneratedCover("solid", cover.value)}
                      >
                        <div className="h-16" style={{ background: cover.value }} />
                        <div className="px-2 py-1 text-xs">{cover.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {coverTab === "gradient" && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {GRADIENT_COVERS.map((cover) => (
                      <button
                        key={cover.name}
                        className="overflow-hidden rounded-md border text-left transition hover:-translate-y-0.5"
                        onClick={() => applyGeneratedCover("gradient", cover.value)}
                      >
                        <div className="h-20" style={{ background: cover.value }} />
                        <div className="px-2 py-1 text-xs">{cover.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {coverTab === "animated" && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {ANIMATED_COVERS.map((cover) => (
                      <button
                        key={cover.id}
                        className="relative overflow-hidden rounded-md border text-left"
                        onClick={() => applyGeneratedCover("animated", cover.id)}
                      >
                        <div className="relative h-20" style={{ background: cover.base }}>
                          {cover.blobs.map((blob, idx) => (
                            <motion.div
                              key={blob}
                              className="absolute h-16 w-16 rounded-full blur-xl"
                              style={{ backgroundColor: blob, left: `${10 + idx * 28}%`, top: `${20 + idx * 8}%` }}
                              animate={{ x: [0, idx % 2 === 0 ? 12 : -12, 0], y: [0, idx % 2 === 0 ? -8 : 8, 0] }}
                              transition={{ duration: 4 + idx, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <div className="px-2 py-1 text-xs">{cover.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {coverTab === "upload" && (
                  <div className="grid gap-3 md:grid-cols-2">
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
                            applyImageCover(data.url, 50);
                            setCoverPickerOpen(false);
                          }
                        }}
                      />
                    </label>
                    <div className="space-y-2 rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Paste image URL</div>
                      <Input
                        placeholder="https://"
                        value={coverLink}
                        onChange={(event) => setCoverLink(event.target.value)}
                      />
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (coverLink) {
                            applyImageCover(coverLink, 50);
                            setCoverPickerOpen(false);
                          }
                        }}
                      >
                        Apply image
                      </Button>
                    </div>
                  </div>
                )}

                {coverTab === "unsplash" && (
                  <div className="space-y-2">
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        setUnsplashQuery(unsplashInput || "nature");
                      }}
                    >
                      <Input
                        placeholder="Search Unsplash"
                        value={unsplashInput}
                        onChange={(event) => setUnsplashInput(event.target.value)}
                      />
                      <Button size="sm" variant="outline" type="submit">
                        <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                      </Button>
                    </form>

                    {!unsplashAccessKey && (
                      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        Add NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to enable Unsplash search.
                      </p>
                    )}

                    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                      {unsplashItems.map((item) => (
                        <button
                          key={item.id}
                          className="h-24 rounded-md bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.urls.small})` }}
                          onClick={() => {
                            applyImageCover(item.urls.regular, 50);
                            setCoverPickerOpen(false);
                          }}
                        />
                      ))}
                      <div ref={loadMoreRef} className="col-span-2 h-2 sm:col-span-3" />
                    </div>
                    {unsplashResults.isFetchingNextPage && (
                      <p className="text-center text-xs text-muted-foreground">Loading more...</p>
                    )}
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
