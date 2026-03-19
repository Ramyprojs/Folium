"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Circle,
  Download,
  Eraser,
  Hand,
  Minus,
  MousePointer,
  Pen,
  RectangleHorizontal,
  Redo2,
  Trash2,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SketchPadModalProps = {
  open: boolean;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
};

type Tool = "select" | "pen" | "eraser" | "line" | "rectangle" | "ellipse" | "arrow" | "text";
type StrokeWidth = 2 | 4 | 8 | 16;
type LineStyle = "solid" | "dashed" | "dotted";

type Point = {
  x: number;
  y: number;
};

type ShapeBase = {
  id: string;
  tool: Exclude<Tool, "eraser" | "select">;
  stroke: string;
  fill: string;
  strokeWidth: StrokeWidth;
  opacity: number;
  lineStyle: LineStyle;
};

type PenShape = ShapeBase & {
  tool: "pen";
  points: Point[];
};

type LineShape = ShapeBase & {
  tool: "line" | "arrow";
  start: Point;
  end: Point;
};

type RectShape = ShapeBase & {
  tool: "rectangle";
  start: Point;
  end: Point;
};

type EllipseShape = ShapeBase & {
  tool: "ellipse";
  start: Point;
  end: Point;
};

type TextShape = ShapeBase & {
  tool: "text";
  anchor: Point;
  text: string;
};

type Shape = PenShape | LineShape | RectShape | EllipseShape | TextShape;

type ToolbarTool = {
  id: Tool;
  label: string;
  icon: JSX.Element;
  shortcut?: string;
};

const TOOL_ITEMS: ToolbarTool[] = [
  { id: "pen", label: "Pen", icon: <Pen className="h-4 w-4" />, shortcut: "P" },
  { id: "eraser", label: "Eraser", icon: <Eraser className="h-4 w-4" />, shortcut: "E" },
  { id: "line", label: "Line", icon: <Minus className="h-4 w-4" />, shortcut: "L" },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    shortcut: "R",
  },
  { id: "ellipse", label: "Circle", icon: <Circle className="h-4 w-4" />, shortcut: "O" },
  { id: "arrow", label: "Arrow", icon: <ArrowRight className="h-4 w-4" /> },
  { id: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  {
    id: "select",
    label: "Select",
    icon: <MousePointer className="h-4 w-4" />,
    shortcut: "V",
  },
];

const COLOR_SWATCHES = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#92400e",
  "#6b7280",
] as const;

const WIDTH_PRESETS: ReadonlyArray<{ value: StrokeWidth; label: string }> = [
  { value: 2, label: "Thin" },
  { value: 4, label: "Medium" },
  { value: 8, label: "Thick" },
  { value: 16, label: "Very Thick" },
];

const LINE_STYLES: ReadonlyArray<{ value: LineStyle; label: string; dash: string | undefined }> = [
  { value: "solid", label: "Solid", dash: undefined },
  { value: "dashed", label: "Dashed", dash: "10 6" },
  { value: "dotted", label: "Dotted", dash: "2 6" },
];

const MIN_CANVAS_HEIGHT = 500;

function createShapeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function shapeBounds(shape: Shape): { x1: number; y1: number; x2: number; y2: number } {
  if (shape.tool === "pen") {
    const xs = shape.points.map((point) => point.x);
    const ys = shape.points.map((point) => point.y);
    return {
      x1: Math.min(...xs),
      y1: Math.min(...ys),
      x2: Math.max(...xs),
      y2: Math.max(...ys),
    };
  }

  if (shape.tool === "text") {
    return {
      x1: shape.anchor.x,
      y1: shape.anchor.y - 24,
      x2: shape.anchor.x + Math.max(shape.text.length * 10, 24),
      y2: shape.anchor.y + 8,
    };
  }

  return {
    x1: Math.min(shape.start.x, shape.end.x),
    y1: Math.min(shape.start.y, shape.end.y),
    x2: Math.max(shape.start.x, shape.end.x),
    y2: Math.max(shape.start.y, shape.end.y),
  };
}

function isPointNearShape(point: Point, shape: Shape, tolerance = 8): boolean {
  const bounds = shapeBounds(shape);
  return (
    point.x >= bounds.x1 - tolerance &&
    point.x <= bounds.x2 + tolerance &&
    point.y >= bounds.y1 - tolerance &&
    point.y <= bounds.y2 + tolerance
  );
}

function moveShape(shape: Shape, delta: Point): Shape {
  if (shape.tool === "pen") {
    return {
      ...shape,
      points: shape.points.map((point) => ({ x: point.x + delta.x, y: point.y + delta.y })),
    };
  }

  if (shape.tool === "text") {
    return {
      ...shape,
      anchor: { x: shape.anchor.x + delta.x, y: shape.anchor.y + delta.y },
    };
  }

  return {
    ...shape,
    start: { x: shape.start.x + delta.x, y: shape.start.y + delta.y },
    end: { x: shape.end.x + delta.x, y: shape.end.y + delta.y },
  };
}

function toDashArray(lineStyle: LineStyle): string | undefined {
  const match = LINE_STYLES.find((item) => item.value === lineStyle);
  return match?.dash;
}

function toSvgPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    const one = points[0];
    return `M ${one.x} ${one.y}`;
  }

  return points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, "");
}

export function SketchPadModal({ open, onCancel, onSave }: SketchPadModalProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [fillColor, setFillColor] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(4);
  const [opacity, setOpacity] = useState<number>(1);
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [zoom, setZoom] = useState<number>(1);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draftShape, setDraftShape] = useState<Shape | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragSnapshot, setDragSnapshot] = useState<Shape[] | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [future, setFuture] = useState<Shape[][]>([]);

  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 560 });

  const resetPad = useCallback(() => {
    setShapes([]);
    setDraftShape(null);
    setSelectedShapeId(null);
    setDragStart(null);
    setDragSnapshot(null);
    setDragMoved(false);
    setHistory([]);
    setFuture([]);
    setZoom(1);
    setActiveTool("pen");
    setStrokeColor("#000000");
    setFillColor("transparent");
    setStrokeWidth(4);
    setOpacity(1);
    setLineStyle("solid");
  }, []);

  const updateCanvasSize = useCallback(() => {
    const width = canvasWrapRef.current?.clientWidth ?? 960;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    const modalBasedHeight = Math.floor(viewportHeight * 0.5);

    setCanvasSize({
      width,
      height: Math.max(MIN_CANVAS_HEIGHT, modalBasedHeight),
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [open, updateCanvasSize]);

  const pushHistory = useCallback((snapshot: Shape[]) => {
    setHistory((prev) => [...prev, snapshot]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      const previous = prev[prev.length - 1];
      if (!previous) {
        return prev;
      }
      setFuture((futureState) => [...futureState, shapes]);
      setShapes(previous);
      return prev.slice(0, -1);
    });
  }, [shapes]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      const next = prev[prev.length - 1];
      if (!next) {
        return prev;
      }
      setHistory((historyState) => [...historyState, shapes]);
      setShapes(next);
      return prev.slice(0, -1);
    });
  }, [shapes]);

  const toCanvasPoint = useCallback(
    (event: React.PointerEvent<SVGSVGElement>): Point => {
      const svg = svgRef.current;
      if (!svg) {
        return { x: 0, y: 0 };
      }
      const rect = svg.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;
      return { x, y };
    },
    [zoom],
  );

  const createDraftFromTool = useCallback(
    (point: Point): Shape | null => {
      const base = {
        stroke: strokeColor,
        fill: fillColor,
        strokeWidth,
        opacity,
        lineStyle,
      } satisfies Omit<ShapeBase, "tool" | "id">;

      if (activeTool === "pen") {
        return {
          id: createShapeId(),
          tool: "pen",
          points: [point],
          ...base,
        };
      }

      if (activeTool === "line") {
        return {
          id: createShapeId(),
          tool: "line",
          start: point,
          end: point,
          ...base,
        };
      }

      if (activeTool === "rectangle") {
        return {
          id: createShapeId(),
          tool: "rectangle",
          start: point,
          end: point,
          ...base,
        };
      }

      if (activeTool === "ellipse") {
        return {
          id: createShapeId(),
          tool: "ellipse",
          start: point,
          end: point,
          ...base,
        };
      }

      if (activeTool === "arrow") {
        return {
          id: createShapeId(),
          tool: "arrow",
          start: point,
          end: point,
          ...base,
        };
      }

      return null;
    },
    [activeTool, fillColor, lineStyle, opacity, strokeColor, strokeWidth],
  );

  const commitShape = useCallback(
    (shape: Shape) => {
      pushHistory(shapes);
      setShapes((prev) => [...prev, shape]);
      setSelectedShapeId(shape.id);
    },
    [pushHistory, shapes],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const point = toCanvasPoint(event);

      if (activeTool === "text") {
        const value = window.prompt("Text label");
        if (!value) {
          return;
        }

        const textShape: TextShape = {
          id: createShapeId(),
          tool: "text",
          anchor: point,
          text: value,
          stroke: strokeColor,
          fill: "transparent",
          strokeWidth,
          opacity,
          lineStyle,
        };
        commitShape(textShape);
        return;
      }

      if (activeTool === "eraser") {
        const target = [...shapes].reverse().find((shape) => isPointNearShape(point, shape));
        if (!target) {
          return;
        }
        pushHistory(shapes);
        setShapes((prev) => prev.filter((shape) => shape.id !== target.id));
        if (selectedShapeId === target.id) {
          setSelectedShapeId(null);
        }
        return;
      }

      if (activeTool === "select") {
        const target = [...shapes].reverse().find((shape) => isPointNearShape(point, shape));
        setSelectedShapeId(target?.id ?? null);
        if (target) {
          setDragSnapshot(shapes);
          setDragMoved(false);
        }
        setDragStart(point);
        return;
      }

      const draft = createDraftFromTool(point);
      if (draft) {
        setDraftShape(draft);
      }
    },
    [
      activeTool,
      commitShape,
      createDraftFromTool,
      lineStyle,
      opacity,
      pushHistory,
      selectedShapeId,
      shapes,
      strokeColor,
      strokeWidth,
      toCanvasPoint,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const point = toCanvasPoint(event);

      if (activeTool === "select" && selectedShapeId && dragStart) {
        const delta = { x: point.x - dragStart.x, y: point.y - dragStart.y };
        if (Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
          setDragMoved(true);
        }
        setShapes((prev) =>
          prev.map((shape) => {
            if (shape.id !== selectedShapeId) {
              return shape;
            }
            return moveShape(shape, delta);
          }),
        );
        setDragStart(point);
        return;
      }

      if (!draftShape) {
        return;
      }

      if (draftShape.tool === "pen") {
        setDraftShape({
          ...draftShape,
          points: [...draftShape.points, point],
        });
        return;
      }

      if (draftShape.tool === "line" || draftShape.tool === "arrow" || draftShape.tool === "rectangle" || draftShape.tool === "ellipse") {
        setDraftShape({
          ...draftShape,
          end: point,
        });
      }
    },
    [activeTool, draftShape, dragStart, selectedShapeId, toCanvasPoint],
  );

  const onPointerUp = useCallback(() => {
    if (activeTool === "select") {
      if (dragStart && selectedShapeId && dragMoved && dragSnapshot) {
        pushHistory(dragSnapshot);
      }
      setDragStart(null);
      setDragSnapshot(null);
      setDragMoved(false);
      return;
    }

    if (!draftShape) {
      return;
    }

    commitShape(draftShape);
    setDraftShape(null);
  }, [activeTool, commitShape, draftShape, dragMoved, dragSnapshot, dragStart, pushHistory, selectedShapeId]);

  const zoomBy = useCallback((delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.5, Number((prev + delta).toFixed(2)))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const clearCanvas = useCallback(() => {
    if (!shapes.length) {
      return;
    }
    const confirmed = window.confirm("Clear the whole canvas?");
    if (!confirmed) {
      return;
    }
    pushHistory(shapes);
    setShapes([]);
    setSelectedShapeId(null);
  }, [pushHistory, shapes]);

  const exportAsPng = useCallback(async (): Promise<string | null> => {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }

    const cloned = svg.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloned.setAttribute("width", String(canvasSize.width));
    cloned.setAttribute("height", String(canvasSize.height));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(cloned);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Unable to render sketch image."));
        img.src = objectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return null;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, [canvasSize.height, canvasSize.width]);

  const downloadPng = useCallback(async () => {
    const dataUrl = await exportAsPng();
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "folium-sketch.png";
    link.click();
  }, [exportAsPng]);

  const onSaveDrawing = useCallback(async () => {
    const dataUrl = await exportAsPng();
    if (!dataUrl) {
      return;
    }
    onSave(dataUrl);
  }, [exportAsPng, onSave]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const lower = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;

      if (meta && lower === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (meta && lower === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if (lower === "v") {
        setActiveTool("select");
      } else if (lower === "p") {
        setActiveTool("pen");
      } else if (lower === "e") {
        setActiveTool("eraser");
      } else if (lower === "l") {
        setActiveTool("line");
      } else if (lower === "r") {
        setActiveTool("rectangle");
      } else if (lower === "o") {
        setActiveTool("ellipse");
      } else if (event.key === "[") {
        setStrokeWidth((prev) => {
          const index = WIDTH_PRESETS.findIndex((entry) => entry.value === prev);
          const next = Math.max(index - 1, 0);
          return WIDTH_PRESETS[next].value;
        });
      } else if (event.key === "]") {
        setStrokeWidth((prev) => {
          const index = WIDTH_PRESETS.findIndex((entry) => entry.value === prev);
          const next = Math.min(index + 1, WIDTH_PRESETS.length - 1);
          return WIDTH_PRESETS[next].value;
        });
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (!selectedShapeId) {
          return;
        }
        event.preventDefault();
        pushHistory(shapes);
        setShapes((prev) => prev.filter((shape) => shape.id !== selectedShapeId));
        setSelectedShapeId(null);
      } else if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open, pushHistory, redo, selectedShapeId, shapes, undo]);

  const effectiveShapes = useMemo(() => {
    if (!draftShape) {
      return shapes;
    }
    return [...shapes, draftShape];
  }, [draftShape, shapes]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-[85vh] w-[90vw] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-base font-semibold">Sketch Pad</p>
                <p className="text-xs text-muted-foreground">Draw and insert directly into your page</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetPad();
                  onCancel();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-b px-3 py-2">
              <div className="grid gap-2 xl:grid-cols-[1.8fr_2fr_1.4fr]">
                <div className="rounded-full border bg-muted/35 px-2 py-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {TOOL_ITEMS.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs transition-colors ${activeTool === tool.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                        onClick={() => setActiveTool(tool.id)}
                        title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                      >
                        {tool.icon}
                        <span>{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-full border bg-muted/35 px-2 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      {COLOR_SWATCHES.map((color) => (
                        <button
                          key={`stroke-${color}`}
                          type="button"
                          className="relative h-5 w-5 rounded-full border"
                          style={{ backgroundColor: color }}
                          onClick={() => setStrokeColor(color)}
                          title={`Stroke ${color}`}
                        >
                          {strokeColor.toLowerCase() === color.toLowerCase() && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                      <Input
                        type="color"
                        value={strokeColor}
                        onChange={(event) => setStrokeColor(event.target.value)}
                        className="h-7 w-9 p-1"
                        aria-label="Custom stroke color"
                      />
                    </div>

                    <div className="h-5 w-px bg-border" />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={`rounded border px-1.5 py-1 text-[10px] ${fillColor === "transparent" ? "bg-accent" : ""}`}
                        onClick={() => setFillColor("transparent")}
                      >
                        No fill
                      </button>
                      {COLOR_SWATCHES.map((color) => (
                        <button
                          key={`fill-${color}`}
                          type="button"
                          className="relative h-5 w-5 rounded-full border"
                          style={{ backgroundColor: color }}
                          onClick={() => setFillColor(color)}
                          title={`Fill ${color}`}
                        >
                          {fillColor.toLowerCase() === color.toLowerCase() && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-full border bg-muted/35 px-2 py-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={undo}>
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={redo}>
                      <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearCanvas}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void downloadPng()}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => zoomBy(-0.1)}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => zoomBy(0.1)}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetZoom}>
                      <Hand className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 rounded-lg border bg-muted/25 px-2 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Stroke</span>
                  {WIDTH_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-1 ${strokeWidth === preset.value ? "bg-accent" : "hover:bg-accent/70"}`}
                      onClick={() => setStrokeWidth(preset.value)}
                    >
                      <span
                        className="block w-8 rounded-full bg-foreground"
                        style={{ height: `${Math.max(1, preset.value / 2)}px` }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Opacity</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(opacity * 100)}
                    onChange={(event) => setOpacity(Number(event.target.value) / 100)}
                  />
                  <span className="w-9 text-right">{Math.round(opacity * 100)}%</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Line</span>
                  {LINE_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 ${lineStyle === style.value ? "bg-accent" : "hover:bg-accent/70"}`}
                      onClick={() => setLineStyle(style.value)}
                    >
                      <svg width="20" height="8" aria-hidden>
                        <line
                          x1="1"
                          y1="4"
                          x2="19"
                          y2="4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={style.dash}
                        />
                      </svg>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div ref={canvasWrapRef} className="flex-1 overflow-auto bg-[#f5f5f4] p-4">
              <div
                className="overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.08)]"
                style={{ minHeight: `${MIN_CANVAS_HEIGHT}px` }}
              >
                <svg
                  ref={svgRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  style={{
                    display: "block",
                    backgroundColor: "#ffffff",
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                >
                  <defs>
                    <marker
                      id="arrow-head"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
                    </marker>
                  </defs>

                  {effectiveShapes.map((shape) => {
                    const isSelected = shape.id === selectedShapeId;
                    const strokeDasharray = toDashArray(shape.lineStyle);

                    if (shape.tool === "pen") {
                      return (
                        <Fragment key={shape.id}>
                          <path
                            d={toSvgPath(shape.points)}
                            fill="none"
                            stroke={shape.stroke}
                            strokeWidth={shape.strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={shape.opacity}
                          />
                          {isSelected && (
                            <rect
                              x={shapeBounds(shape).x1 - 4}
                              y={shapeBounds(shape).y1 - 4}
                              width={shapeBounds(shape).x2 - shapeBounds(shape).x1 + 8}
                              height={shapeBounds(shape).y2 - shapeBounds(shape).y1 + 8}
                              fill="none"
                              stroke="#7c3aed"
                              strokeWidth={1}
                              strokeDasharray="4 3"
                            />
                          )}
                        </Fragment>
                      );
                    }

                    if (shape.tool === "text") {
                      return (
                        <Fragment key={shape.id}>
                          <text
                            x={shape.anchor.x}
                            y={shape.anchor.y}
                            fill={shape.stroke}
                            fontSize={Math.max(16, shape.strokeWidth * 3)}
                            opacity={shape.opacity}
                            fontFamily="Inter, sans-serif"
                          >
                            {shape.text}
                          </text>
                          {isSelected && (
                            <rect
                              x={shapeBounds(shape).x1 - 4}
                              y={shapeBounds(shape).y1 - 4}
                              width={shapeBounds(shape).x2 - shapeBounds(shape).x1 + 8}
                              height={shapeBounds(shape).y2 - shapeBounds(shape).y1 + 8}
                              fill="none"
                              stroke="#7c3aed"
                              strokeWidth={1}
                              strokeDasharray="4 3"
                            />
                          )}
                        </Fragment>
                      );
                    }

                    if (shape.tool === "line") {
                      return (
                        <line
                          key={shape.id}
                          x1={shape.start.x}
                          y1={shape.start.y}
                          x2={shape.end.x}
                          y2={shape.end.y}
                          stroke={shape.stroke}
                          strokeWidth={shape.strokeWidth}
                          strokeDasharray={strokeDasharray}
                          opacity={shape.opacity}
                        />
                      );
                    }

                    if (shape.tool === "arrow") {
                      return (
                        <line
                          key={shape.id}
                          x1={shape.start.x}
                          y1={shape.start.y}
                          x2={shape.end.x}
                          y2={shape.end.y}
                          stroke={shape.stroke}
                          strokeWidth={shape.strokeWidth}
                          strokeDasharray={strokeDasharray}
                          markerEnd="url(#arrow-head)"
                          opacity={shape.opacity}
                        />
                      );
                    }

                    if (shape.tool === "rectangle") {
                      const x = Math.min(shape.start.x, shape.end.x);
                      const y = Math.min(shape.start.y, shape.end.y);
                      const width = Math.abs(shape.end.x - shape.start.x);
                      const height = Math.abs(shape.end.y - shape.start.y);
                      return (
                        <rect
                          key={shape.id}
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={shape.fill}
                          stroke={shape.stroke}
                          strokeWidth={shape.strokeWidth}
                          strokeDasharray={strokeDasharray}
                          opacity={shape.opacity}
                        />
                      );
                    }

                    const cx = (shape.start.x + shape.end.x) / 2;
                    const cy = (shape.start.y + shape.end.y) / 2;
                    const rx = Math.abs(shape.end.x - shape.start.x) / 2;
                    const ry = Math.abs(shape.end.y - shape.start.y) / 2;
                    return (
                      <ellipse
                        key={shape.id}
                        cx={cx}
                        cy={cy}
                        rx={rx}
                        ry={ry}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        strokeDasharray={strokeDasharray}
                        opacity={shape.opacity}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Shortcuts: V Select, P Pen, E Eraser, L Line, R Rectangle, O Circle, Cmd/Ctrl+Z Undo, Cmd/Ctrl+Shift+Z Redo
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetPad();
                    onCancel();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await onSaveDrawing();
                    resetPad();
                  }}
                >
                  Save Drawing
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
