"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  CheckSquare,
  Code2,
  Heading1,
  ImagePlus,
  Italic,
  List,
  ListChecks,
  Minus,
  Palette,
  Paperclip,
  Quote,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor as useAutoSaveEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";

const lowlight = createLowlight(common);

type TiptapEditorProps = {
  pageId: string;
  content: Record<string, unknown>;
};

export function TiptapEditor({ pageId, content }: TiptapEditorProps): JSX.Element {
  const { save } = useAutoSaveEditor(pageId);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#1f1f1f");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight,
      HorizontalRule,
      Link.configure({ openOnClick: true }),
      Image.configure({ allowBase64: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Type '/' for commands" }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "min-h-[500px] outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      save({ content: current.getJSON() as Record<string, unknown> });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.commands.setContent(content);
  }, [content, editor]);

  const slashActions = useMemo(
    () => [
      { label: "Heading", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "Bullet List", run: () => editor?.chain().focus().toggleBulletList().run() },
      { label: "Todo List", run: () => editor?.chain().focus().toggleTaskList().run() },
      { label: "Quote", run: () => editor?.chain().focus().toggleBlockquote().run() },
      { label: "Code Block", run: () => editor?.chain().focus().toggleCodeBlock().run() },
      { label: "Divider", run: () => editor?.chain().focus().setHorizontalRule().run() },
      {
        label: "Drawing",
        run: () => {
          setShowDrawingPanel(true);
        },
      },
      {
        label: "Image URL",
        run: () => {
          const url = window.prompt("Paste image URL");
          if (url) {
            editor?.chain().focus().setImage({ src: url, alt: "Image" }).run();
          }
        },
      },
    ],
    [editor],
  );

  const getCanvasContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = drawingColor;
    return ctx;
  };

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawingAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !editor) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    editor.chain().focus().setImage({ src: dataUrl, alt: "Drawing" }).run();
    clearDrawing();
    setShowDrawingPanel(false);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const insertFiles = async (files: FileList | null) => {
    if (!files || !editor) {
      return;
    }

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const dataUrl = await readFileAsDataUrl(file);
        editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
      } else {
        const blobUrl = URL.createObjectURL(file);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `Attachment: ${file.name}`,
                marks: [{ type: "link", attrs: { href: blobUrl, target: "_blank" } }],
              },
            ],
          })
          .run();
      }
    }
  };

  return (
    <div
      className="notion-editor rounded-xl border bg-background p-4 shadow-sm"
      onKeyDown={(event) => {
        if (event.key === "/") {
          setShowSlashMenu(true);
        }
      }}
    >
      <div className="mb-3 flex flex-wrap gap-2 border-b pb-3">
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="mr-1 h-3.5 w-3.5" /> Bold
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="mr-1 h-3.5 w-3.5" /> Italic
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="mr-1 h-3.5 w-3.5" /> H1
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="mr-1 h-3.5 w-3.5" /> List
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleTaskList().run()}>
          <ListChecks className="mr-1 h-3.5 w-3.5" /> Todo
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote className="mr-1 h-3.5 w-3.5" /> Quote
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="mr-1 h-3.5 w-3.5" /> Code
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus className="mr-1 h-3.5 w-3.5" /> Divider
        </Button>
      </div>

      {showSlashMenu && (
        <div className="mb-3 rounded-md border bg-background p-2">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Slash commands</div>
          <div className="grid gap-1 sm:grid-cols-2">
            {slashActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="rounded px-2 py-1 text-left text-sm hover:bg-accent"
                onClick={() => {
                  action.run();
                  setShowSlashMenu(false);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <EditorContent editor={editor} className="min-h-[420px]" />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          void insertFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {showDrawingPanel && (
        <div className="fixed inset-0 z-40 bg-black/20 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 w-full max-w-4xl rounded-xl border bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Sketch Pad</p>
              <Button variant="ghost" size="sm" onClick={() => setShowDrawingPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={900}
              height={420}
              className="w-full rounded-lg border bg-white"
              onPointerDown={(event) => {
                const ctx = getCanvasContext();
                if (!ctx) {
                  return;
                }
                isDrawingRef.current = true;
                const point = getPoint(event);
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
              }}
              onPointerMove={(event) => {
                if (!isDrawingRef.current) {
                  return;
                }
                const ctx = getCanvasContext();
                if (!ctx) {
                  return;
                }
                const point = getPoint(event);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
              }}
              onPointerUp={() => {
                isDrawingRef.current = false;
              }}
              onPointerLeave={() => {
                isDrawingRef.current = false;
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={drawingColor}
                onChange={(event) => setDrawingColor(event.target.value)}
                className="h-9 w-10 rounded border"
              />
              <Button size="sm" variant="outline" onClick={clearDrawing}>
                Clear
              </Button>
              <Button size="sm" onClick={saveDrawingAsImage}>
                Insert drawing
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleTaskList().run()}>
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = window.prompt("Paste image URL");
              if (url) {
                editor?.chain().focus().setImage({ src: url, alt: "Image" }).run();
              }
            }}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDrawingPanel(true)}>
            <Palette className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
