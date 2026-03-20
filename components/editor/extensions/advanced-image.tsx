"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Crop,
  Download,
  Expand,
  ImageUp,
  Minimize2,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ReactCrop, {
  type Crop as CropSelection,
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import DownloadPlugin from "yet-another-react-lightbox/plugins/download";
import ZoomPlugin from "yet-another-react-lightbox/plugins/zoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImageDataUrl, uploadImageFile } from "@/lib/client-upload";

type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

type ImageAttrs = {
  src: string;
  alt?: string;
  title?: string;
  align?: "left" | "center" | "right";
  width?: string;
  caption?: string;
  showCaption?: boolean;
  minimized?: boolean;
  fileName?: string;
};

const ASPECT_PRESETS: ReadonlyArray<{ label: string; value: number | null }> = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
];

function filenameFromSrc(src: string): string {
  const parts = src.split("/");
  const last = parts[parts.length - 1];
  return last ? decodeURIComponent(last.split("?")[0]) : "image.png";
}

function pxValue(width: string | undefined, parentWidth: number, originalWidth: number): number {
  if (!width || width === "original") {
    return originalWidth;
  }
  if (width.endsWith("%")) {
    return (Number.parseFloat(width) / 100) * parentWidth;
  }
  if (width.endsWith("px")) {
    return Number.parseFloat(width);
  }
  return originalWidth;
}

function defaultCenteredCrop(mediaWidth: number, mediaHeight: number, aspect: number | undefined): CropSelection {
  if (!aspect) {
    return {
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function AdvancedImageNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps): JSX.Element {
  const attrs = node.attrs as ImageAttrs;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [hovered, setHovered] = useState(false);
  const [resizing, setResizing] = useState<ResizeHandle | null>(null);
  const [resizeLabel, setResizeLabel] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | null>(null);
  const [crop, setCrop] = useState<CropSelection>({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [naturalSize, setNaturalSize] = useState({ width: 1200, height: 800 });

  const alignmentClass =
    attrs.align === "left"
      ? "mr-auto"
      : attrs.align === "right"
        ? "ml-auto"
        : "mx-auto";

  const handleResize = (handle: ResizeHandle, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const parent = blockRef.current?.parentElement;
    if (!parent) {
      return;
    }

    const parentWidth = parent.clientWidth;
    const initialWidth = pxValue(attrs.width, parentWidth, naturalSize.width);
    const startX = event.clientX;
    const startY = event.clientY;

    setResizing(handle);

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const horizontalHandle = handle.includes("e") || handle.includes("w");
      const verticalHandle = handle.includes("n") || handle.includes("s");
      const direction = handle.includes("w") ? -1 : 1;

      const draftWidth = Math.max(
        80,
        Math.round(initialWidth + (horizontalHandle ? deltaX * direction : verticalHandle ? deltaY : deltaX)),
      );

      const snapTargets = [0.25, 0.5, 0.75, 1].map((ratio) => ({
        ratio,
        width: parentWidth * ratio,
      }));

      const nearSnap = snapTargets.find((target) => Math.abs(target.width - draftWidth) <= 14);
      const nextWidth = nearSnap ? `${Math.round(nearSnap.ratio * 100)}%` : `${draftWidth}px`;
      updateAttributes({ width: nextWidth });

      const resolvedWidth = nearSnap ? nearSnap.width : draftWidth;
      const resolvedHeight = Math.round((resolvedWidth / naturalSize.width) * naturalSize.height);
      setResizeLabel(`${Math.round(resolvedWidth)} × ${resolvedHeight}`);
    };

    const onUp = () => {
      setResizing(null);
      setResizeLabel("");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const slides = useMemo(() => {
    if (!blockRef.current) {
      return [{ src: attrs.src }];
    }

    const nodes = Array.from(document.querySelectorAll<HTMLDivElement>("[data-folium-image-src]"));
    const mapped = nodes.map((entry) => ({ src: entry.dataset.foliumImageSrc || "" })).filter((entry) => entry.src);

    if (!mapped.length) {
      return [{ src: attrs.src }];
    }

    return mapped;
  }, [attrs.src]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const idx = slides.findIndex((entry) => entry.src === attrs.src);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }, [attrs.src, lightboxOpen, slides]);

  const onApplyCrop = async () => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const pixelCrop = convertToPixelCrop(crop, image.naturalWidth, image.naturalHeight);
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const uploadedUrl = await uploadImageDataUrl(dataUrl, attrs.fileName || `folium-image-${Date.now()}.png`);
      updateAttributes({ src: uploadedUrl, width: "original" });
      setCropOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update image.");
    }
  };

  const onReplaceImage = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    try {
      const uploadedUrl = await uploadImageFile(file);
      updateAttributes({
        src: uploadedUrl,
        fileName: file.name,
        alt: file.name,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to replace image.");
    }
  };

  const imageWidthStyle = attrs.width && attrs.width !== "original" ? attrs.width : undefined;

  return (
    <NodeViewWrapper
      as="div"
      className={`relative my-4 ${alignmentClass}`}
      contentEditable={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-folium-image-src={attrs.src}
      ref={blockRef}
      style={{ width: imageWidthStyle }}
    >
      <input
        ref={replaceInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          void onReplaceImage(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {(hovered || selected || cropOpen) && !attrs.minimized && (
        <div className="absolute -top-10 left-0 z-20 flex flex-wrap items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
          <button type="button" className="rounded p-1.5 hover:bg-accent" onClick={() => updateAttributes({ align: "left" })}>
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-accent" onClick={() => updateAttributes({ align: "center" })}>
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-accent" onClick={() => updateAttributes({ align: "right" })}>
            <AlignRight className="h-3.5 w-3.5" />
          </button>

          {(["25%", "50%", "75%", "100%", "original"] as const).map((size) => (
            <button
              key={size}
              type="button"
              className="rounded px-1.5 py-1 text-[11px] hover:bg-accent"
              onClick={() => updateAttributes({ width: size })}
            >
              {size === "original" ? "Orig" : size}
            </button>
          ))}

          <button type="button" className="rounded p-1.5 hover:bg-accent" onClick={() => setCropOpen(true)}>
            <Crop className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-accent"
            onClick={() => updateAttributes({ minimized: !attrs.minimized })}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-accent" onClick={() => replaceInputRef.current?.click()}>
            <ImageUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-1 text-[11px] hover:bg-accent"
            onClick={() => updateAttributes({ showCaption: !attrs.showCaption })}
          >
            Caption
          </button>
          <button type="button" className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={deleteNode}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {attrs.minimized ? (
        <button
          type="button"
          className="group relative inline-flex items-center gap-2 rounded-full border bg-muted/60 px-2 py-1 text-xs"
          onClick={() => updateAttributes({ minimized: false })}
          draggable
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attrs.src} alt={attrs.alt || "thumbnail"} className="h-8 w-8 rounded object-cover" />
          <span className="max-w-[180px] truncate">{attrs.fileName || filenameFromSrc(attrs.src)}</span>
          <Expand className="h-3.5 w-3.5" />
          <span className="pointer-events-none absolute -top-40 left-1/2 hidden -translate-x-1/2 rounded-lg border bg-popover p-2 shadow-xl group-hover:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attrs.src} alt="Preview" className="h-[150px] w-[200px] rounded object-cover" />
          </span>
        </button>
      ) : (
        <div className="relative">
          {cropOpen ? (
            <div className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex flex-wrap items-center gap-1">
                {ASPECT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${cropAspect === preset.value ? "bg-accent" : "hover:bg-accent/70"}`}
                    onClick={() => {
                      setCropAspect(preset.value);
                      const image = imageRef.current;
                      if (image) {
                        setCrop(defaultCenteredCrop(image.naturalWidth, image.naturalHeight, preset.value ?? undefined));
                      }
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <ReactCrop crop={crop} onChange={(nextCrop) => setCrop(nextCrop)} aspect={cropAspect ?? undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={attrs.src}
                  alt={attrs.alt || "Image"}
                  className="max-h-[480px] w-auto rounded"
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
                    setCrop(defaultCenteredCrop(target.naturalWidth, target.naturalHeight, cropAspect ?? undefined));
                  }}
                />
              </ReactCrop>

              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground" onClick={() => void onApplyCrop()}>
                  Apply Crop
                </button>
                <button type="button" className="rounded border px-3 py-1.5 text-xs" onClick={() => setCropOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={attrs.src}
                alt={attrs.alt || "Image"}
                title={attrs.title}
                className="block w-full rounded-lg border shadow-sm"
                style={{ width: "100%", maxWidth: attrs.width === "original" ? `${naturalSize.width}px` : undefined }}
                onLoad={(event) => {
                  const target = event.currentTarget;
                  setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
                  if (!attrs.fileName) {
                    updateAttributes({ fileName: filenameFromSrc(attrs.src) });
                  }
                }}
                onClick={() => setLightboxOpen(true)}
              />

              {(hovered || selected || resizing) && (
                <>
                  {(["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const).map((handle) => (
                    <div
                      key={handle}
                      onPointerDown={(event) => handleResize(handle, event)}
                      className="absolute h-3 w-3 rounded-sm border border-gray-700 bg-white"
                      style={{
                        left:
                          handle === "w" || handle === "nw" || handle === "sw"
                            ? -6
                            : handle === "e" || handle === "ne" || handle === "se"
                              ? "calc(100% - 6px)"
                              : "calc(50% - 6px)",
                        top:
                          handle === "n" || handle === "ne" || handle === "nw"
                            ? -6
                            : handle === "s" || handle === "se" || handle === "sw"
                              ? "calc(100% - 6px)"
                              : "calc(50% - 6px)",
                        cursor:
                          handle === "n" || handle === "s"
                            ? "ns-resize"
                            : handle === "e" || handle === "w"
                              ? "ew-resize"
                              : handle === "ne" || handle === "sw"
                                ? "nesw-resize"
                                : "nwse-resize",
                      }}
                    />
                  ))}
                  {resizeLabel && (
                    <span className="absolute right-2 top-2 rounded bg-black/80 px-2 py-0.5 text-[11px] text-white">{resizeLabel}</span>
                  )}
                </>
              )}
            </>
          )}

          {attrs.showCaption && (
            <input
              type="text"
              className="mt-2 w-full border-none bg-transparent text-center text-sm italic text-muted-foreground outline-none"
              placeholder="Add a caption..."
              value={attrs.caption || ""}
              onChange={(event) => updateAttributes({ caption: event.target.value })}
            />
          )}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          plugins={[ZoomPlugin, DownloadPlugin]}
          carousel={{ finite: false }}
          controller={{ closeOnBackdropClick: true }}
          on={{
            view: ({ index }) => setLightboxIndex(index),
          }}
          render={{
            buttonPrev: slides.length > 1 ? undefined : () => null,
            buttonNext: slides.length > 1 ? undefined : () => null,
            buttonClose: () => (
              <button type="button" className="rounded-full bg-black/50 p-2 text-white" onClick={() => setLightboxOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            ),
          }}
          zoom={{ maxZoomPixelRatio: 3 }}
        />
      )}

      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <button type="button" className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent" onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.2))}>
          <ZoomOut className="h-3 w-3" />
        </button>
        <button type="button" className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent" onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}>
          <ZoomIn className="h-3 w-3" />
        </button>
        <button type="button" className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-accent" onClick={() => void downloadFromImage(attrs.src, attrs.fileName || "image.png")}>
          <Download className="h-3 w-3" />
          Download
        </button>
        <span>{Math.round(zoomLevel * 100)}%</span>
      </div>
    </NodeViewWrapper>
  );
}

async function downloadFromImage(src: string, fileName: string): Promise<void> {
  const response = await fetch(src);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export const AdvancedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
      },
      width: {
        default: "75%",
      },
      caption: {
        default: "",
      },
      showCaption: {
        default: false,
      },
      minimized: {
        default: false,
      },
      fileName: {
        default: "",
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedImageNodeView);
  },
});
