"use client";

import { BookmarkCheck, GripHorizontal, Maximize2, Minimize2, Pin, Plus, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DockPosition = "none" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

type NoteTheme = "light" | "dark";

type FloatingNote = {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  pinned: boolean;
  dock: DockPosition;
  theme: NoteTheme;
  background: string;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  showSettings: boolean;
  previousRect?: { x: number; y: number; width: number; height: number };
};

type DragState = {
  noteId: string;
  offsetX: number;
  offsetY: number;
};

type ResizeState = {
  noteId: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

const NOTE_BACKGROUNDS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Paper", value: "#fffef8" },
  { label: "Mint", value: "#ecfdf5" },
  { label: "Sky", value: "#eff6ff" },
  { label: "Rose", value: "#fff1f2" },
  { label: "Slate", value: "#e2e8f0" },
  { label: "Charcoal", value: "#1f2937" },
];

const FONT_FAMILIES: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Sans", value: "ui-sans-serif, system-ui, -apple-system" },
  { label: "Serif", value: "ui-serif, Georgia, Cambria" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createNoteId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultNote(viewportWidth: number, viewportHeight: number, zIndex: number): FloatingNote {
  const baseWidth = viewportWidth < 768 ? Math.max(280, Math.min(360, viewportWidth - 20)) : 380;
  const baseHeight = viewportWidth < 768 ? 300 : 320;

  return {
    id: createNoteId(),
    title: "Quick Note",
    body: "",
    x: viewportWidth < 768 ? 10 : Math.max(16, Math.round(viewportWidth * 0.55)),
    y: viewportWidth < 768 ? Math.max(72, Math.round(viewportHeight * 0.15)) : 110,
    width: baseWidth,
    height: baseHeight,
    zIndex,
    minimized: false,
    maximized: false,
    pinned: false,
    dock: "none",
    theme: "light",
    background: "#fffef8",
    opacity: 0.96,
    fontSize: 15,
    fontFamily: "ui-sans-serif, system-ui, -apple-system",
    showSettings: false,
  };
}

function resolveDockPosition(note: FloatingNote): Pick<FloatingNote, "x" | "y"> {
  const margin = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (note.dock === "top-left") {
    return { x: margin, y: margin + 56 };
  }
  if (note.dock === "top-right") {
    return { x: viewportWidth - note.width - margin, y: margin + 56 };
  }
  if (note.dock === "bottom-left") {
    return { x: margin, y: viewportHeight - note.height - margin };
  }
  if (note.dock === "bottom-right") {
    return { x: viewportWidth - note.width - margin, y: viewportHeight - note.height - margin };
  }

  return { x: note.x, y: note.y };
}

function detectSnap(x: number, y: number, width: number, height: number): DockPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const threshold = 34;

  const nearLeft = x <= threshold;
  const nearRight = viewportWidth - (x + width) <= threshold;
  const nearTop = y <= 56 + threshold;
  const nearBottom = viewportHeight - (y + height) <= threshold;

  if (nearLeft && nearTop) return "top-left";
  if (nearRight && nearTop) return "top-right";
  if (nearLeft && nearBottom) return "bottom-left";
  if (nearRight && nearBottom) return "bottom-right";
  return "none";
}

export function FloatingNotes(): JSX.Element {
  const [notes, setNotes] = useState<FloatingNote[]>([]);
  const [, setZCursor] = useState(20);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const bringToFront = (noteId: string) => {
    setZCursor((prev) => {
      const next = prev + 1;
      setNotes((current) => current.map((note) => (note.id === noteId ? { ...note, zIndex: next } : note)));
      return next;
    });
  };

  const createNote = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    setZCursor((prev) => {
      const next = prev + 1;
      setNotes((current) => [...current, createDefaultNote(viewportWidth, viewportHeight, next)]);
      return next;
    });
  };

  const updateNote = (noteId: string, updater: (note: FloatingNote) => FloatingNote) => {
    setNotes((current) => current.map((note) => (note.id === noteId ? updater(note) : note)));
  };

  const saveNoteToPage = (note: FloatingNote) => {
    const title = note.title.trim();
    const body = note.body.trim();

    if (!title && !body) {
      toast.error("Quick note is empty");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("folium:save-quick-note", {
        detail: { title, body },
      }),
    );

    toast.success("Saved to note");
  };

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const onResizeViewport = () => {
      setNotes((current) =>
        current.map((note) => {
          if (note.maximized) {
            return {
              ...note,
              x: 12,
              y: 66,
              width: Math.max(280, window.innerWidth - 24),
              height: Math.max(220, window.innerHeight - 90),
            };
          }

          if (note.dock !== "none") {
            const docked = resolveDockPosition(note);
            return {
              ...note,
              ...docked,
            };
          }

          return {
            ...note,
            x: clamp(note.x, 0, Math.max(0, window.innerWidth - note.width)),
            y: clamp(note.y, 56, Math.max(56, window.innerHeight - note.height)),
          };
        }),
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      const activeDrag = dragRef.current;
      const activeResize = resizeRef.current;

      if (activeDrag) {
        setNotes((current) =>
          current.map((note) => {
            if (note.id !== activeDrag.noteId || note.maximized || note.pinned) {
              return note;
            }

            const nextX = clamp(event.clientX - activeDrag.offsetX, 0, Math.max(0, window.innerWidth - note.width));
            const nextY = clamp(event.clientY - activeDrag.offsetY, 56, Math.max(56, window.innerHeight - note.height));
            return {
              ...note,
              x: nextX,
              y: nextY,
              dock: "none",
            };
          }),
        );
      }

      if (activeResize) {
        setNotes((current) =>
          current.map((note) => {
            if (note.id !== activeResize.noteId || note.maximized || note.minimized) {
              return note;
            }

            const deltaX = event.clientX - activeResize.startX;
            const deltaY = event.clientY - activeResize.startY;
            const width = clamp(activeResize.startWidth + deltaX, 260, Math.max(260, window.innerWidth - note.x));
            const height = clamp(activeResize.startHeight + deltaY, 180, Math.max(180, window.innerHeight - note.y));

            return {
              ...note,
              width,
              height,
              dock: "none",
            };
          }),
        );
      }
    };

    const onPointerUp = () => {
      if (dragRef.current) {
        const currentDrag = dragRef.current;
        setNotes((current) =>
          current.map((note) => {
            if (note.id !== currentDrag.noteId || note.maximized) {
              return note;
            }

            const snap = detectSnap(note.x, note.y, note.width, note.height);
            if (snap === "none") {
              return note;
            }

            const dockedNote = { ...note, dock: snap };
            return {
              ...dockedNote,
              ...resolveDockPosition(dockedNote),
            };
          }),
        );
      }

      dragRef.current = null;
      resizeRef.current = null;
      setDragging(null);
      setResizing(null);
    };

    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        createNote();
      }
    };

    window.addEventListener("resize", onResizeViewport);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onShortcut);

    return () => {
      window.removeEventListener("resize", onResizeViewport);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onShortcut);
    };
  }, [isMounted]);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => (a.zIndex + (a.pinned ? 10000 : 0)) - (b.zIndex + (b.pinned ? 10000 : 0))),
    [notes],
  );

  if (!isMounted) {
    return <></>;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60]">
        {sortedNotes.map((note) => {
          const isDark = note.theme === "dark";
          const displayHeight = note.minimized ? 52 : note.height;

          return (
            <section
              key={note.id}
              className="pointer-events-auto absolute overflow-hidden rounded-xl border shadow-xl"
              style={{
                left: note.x,
                top: note.y,
                width: note.width,
                height: displayHeight,
                zIndex: note.zIndex + (note.pinned ? 10000 : 0),
                background: note.background,
                opacity: note.opacity,
                color: isDark ? "#f8fafc" : "#0f172a",
                borderColor: isDark ? "#334155" : "#cbd5e1",
                backdropFilter: "blur(8px)",
              }}
              onPointerDown={() => bringToFront(note.id)}
            >
              <header
                className="flex h-12 items-center gap-1 border-b px-2"
                style={{ borderColor: isDark ? "#334155" : "#dbeafe", cursor: note.maximized || note.pinned ? "default" : "grab" }}
                onPointerDown={(event) => {
                  if (event.button !== 0 || note.maximized || note.pinned) {
                    return;
                  }

                  const rect = (event.currentTarget.parentElement as HTMLElement | null)?.getBoundingClientRect();
                  if (!rect) {
                    return;
                  }

                  dragRef.current = {
                    noteId: note.id,
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                  };
                  setDragging(dragRef.current);
                }}
              >
                <GripHorizontal className="h-4 w-4 opacity-60" />
                <Input
                  value={note.title}
                  className="h-7 border-none bg-transparent px-1 text-sm font-semibold shadow-none focus-visible:ring-0"
                  onChange={(event) => updateNote(note.id, (current) => ({ ...current, title: event.target.value }))}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateNote(note.id, (current) => ({ ...current, pinned: !current.pinned }))}
                  title={note.pinned ? "Unpin (unlock move)" : "Pin (lock position)"}
                  className={note.pinned ? "text-primary" : ""}
                >
                  <Pin className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveNoteToPage(note)}
                  title="Save quick note into page"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateNote(note.id, (current) => ({ ...current, showSettings: !current.showSettings }))}
                  title="Customize"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateNote(note.id, (current) =>
                      current.maximized
                        ? {
                            ...current,
                            maximized: false,
                            x: current.previousRect?.x ?? current.x,
                            y: current.previousRect?.y ?? current.y,
                            width: current.previousRect?.width ?? current.width,
                            height: current.previousRect?.height ?? current.height,
                          }
                        : {
                            ...current,
                            maximized: true,
                            minimized: false,
                            previousRect: {
                              x: current.x,
                              y: current.y,
                              width: current.width,
                              height: current.height,
                            },
                            x: 12,
                            y: 66,
                            width: Math.max(280, window.innerWidth - 24),
                            height: Math.max(220, window.innerHeight - 90),
                            dock: "none",
                          },
                    )
                  }
                  title={note.maximized ? "Restore" : "Maximize"}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateNote(note.id, (current) => ({ ...current, minimized: !current.minimized }))}
                  title={note.minimized ? "Expand" : "Minimize"}
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNotes((current) => current.filter((entry) => entry.id !== note.id))} title="Close">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </header>

              {!note.minimized && (
                <div className="flex h-[calc(100%-3rem)] flex-col">
                  {note.showSettings && (
                    <div className="grid grid-cols-2 gap-2 border-b p-2 text-xs" style={{ borderColor: isDark ? "#334155" : "#dbeafe" }}>
                      <label className="space-y-1">
                        <span className="block">Font size</span>
                        <input
                          type="range"
                          min={12}
                          max={24}
                          value={note.fontSize}
                          onChange={(event) => updateNote(note.id, (current) => ({ ...current, fontSize: Number(event.target.value) }))}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="block">Opacity</span>
                        <input
                          type="range"
                          min={40}
                          max={100}
                          value={Math.round(note.opacity * 100)}
                          onChange={(event) => updateNote(note.id, (current) => ({ ...current, opacity: Number(event.target.value) / 100 }))}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="block">Font family</span>
                        <select
                          value={note.fontFamily}
                          onChange={(event) => updateNote(note.id, (current) => ({ ...current, fontFamily: event.target.value }))}
                          className="w-full rounded border bg-transparent px-1 py-1"
                        >
                          {FONT_FAMILIES.map((family) => (
                            <option key={family.label} value={family.value}>
                              {family.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="block">Theme</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, theme: "light" }))}>
                            Light
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, theme: "dark", background: current.background === "#fffef8" ? "#1f2937" : current.background }))}>
                            Dark
                          </Button>
                        </div>
                      </label>
                      <div className="col-span-2 flex flex-wrap gap-1">
                        {NOTE_BACKGROUNDS.map((swatch) => (
                          <button
                            key={swatch.value}
                            type="button"
                            onClick={() => updateNote(note.id, (current) => ({ ...current, background: swatch.value }))}
                            className="h-5 w-5 rounded border"
                            style={{ background: swatch.value }}
                            title={swatch.label}
                          />
                        ))}
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Dock</span>
                        <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, dock: "top-left", ...resolveDockPosition({ ...current, dock: "top-left" }) }))}>TL</Button>
                        <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, dock: "top-right", ...resolveDockPosition({ ...current, dock: "top-right" }) }))}>TR</Button>
                        <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, dock: "bottom-left", ...resolveDockPosition({ ...current, dock: "bottom-left" }) }))}>BL</Button>
                        <Button size="sm" variant="outline" onClick={() => updateNote(note.id, (current) => ({ ...current, dock: "bottom-right", ...resolveDockPosition({ ...current, dock: "bottom-right" }) }))}>BR</Button>
                      </div>
                    </div>
                  )}

                  <Textarea
                    value={note.body}
                    onChange={(event) => updateNote(note.id, (current) => ({ ...current, body: event.target.value }))}
                    className="h-full resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0"
                    style={{
                      fontSize: note.fontSize,
                      fontFamily: note.fontFamily,
                      color: isDark ? "#e2e8f0" : "#0f172a",
                    }}
                    placeholder="Write your note here..."
                  />
                </div>
              )}

              {!note.minimized && !note.maximized && (
                <button
                  aria-label="Resize note"
                  className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize"
                  onPointerDown={(event) => {
                    if (event.button !== 0) {
                      return;
                    }

                    event.preventDefault();
                    resizeRef.current = {
                      noteId: note.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      startWidth: note.width,
                      startHeight: note.height,
                    };
                    setResizing(resizeRef.current);
                  }}
                >
                  <span className="absolute bottom-1 right-1 block h-2 w-2 rounded-sm border border-current opacity-60" />
                </button>
              )}
            </section>
          );
        })}
      </div>

      <div className="fixed bottom-4 right-4 z-[61]">
        <Button onClick={createNote} className="rounded-full px-4 py-2 shadow-lg">
          <Plus className="mr-1 h-4 w-4" /> New note
        </Button>
      </div>

      {(dragging || resizing) && <div className="pointer-events-none fixed inset-0 z-[62]" />}
    </>
  );
}
