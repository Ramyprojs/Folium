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
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import { AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useEditor as useAutoSaveEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SketchPadModal } from "@/components/editor/sketch-pad-modal";
import { AdvancedImage } from "@/components/editor/extensions/advanced-image";
import { uploadFile, uploadImageDataUrl, uploadImageFile } from "@/lib/client-upload";

const lowlight = createLowlight(common);

type TiptapEditorProps = {
  pageId: string;
  workspaceId: string;
  content: Record<string, unknown>;
};

type SlashItem = {
  section: "Basic Blocks" | "Media";
  name: string;
  description: string;
  icon: React.ReactNode;
  run: () => void;
};

export function TiptapEditor({ pageId, workspaceId, content }: TiptapEditorProps): JSX.Element {
  const { save } = useAutoSaveEditor(pageId);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);
  const [editorFocused, setEditorFocused] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedContentRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight,
      HorizontalRule,
      Link.configure({ openOnClick: true }),
      AdvancedImage.configure({ allowBase64: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Press '/' for commands or start writing..." }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "min-h-[500px] outline-none caret-foreground",
      },
    },
    onFocus: () => setEditorFocused(true),
    onBlur: () => setEditorFocused(false),
    onUpdate: ({ editor: current }) => {
      save({ content: current.getJSON() as Record<string, unknown> });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const incoming = JSON.stringify(content);
    if (lastSyncedContentRef.current === null) {
      lastSyncedContentRef.current = incoming;
      return;
    }

    if (incoming !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content, { emitUpdate: false });
      lastSyncedContentRef.current = incoming;
    }
  }, [content, editor]);

  const slashActions = useMemo<SlashItem[]>(
    () => [
      {
        section: "Basic Blocks",
        name: "Text",
        description: "Plain paragraph text",
        icon: <Bold className="h-4 w-4" />,
        run: () => editor?.chain().focus().setParagraph().run(),
      },
      {
        section: "Basic Blocks",
        name: "Heading 1",
        description: "Large section heading",
        icon: <Heading1 className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        section: "Basic Blocks",
        name: "Heading 2",
        description: "Medium section heading",
        icon: <Heading1 className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        section: "Basic Blocks",
        name: "Heading 3",
        description: "Small section heading",
        icon: <Heading1 className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        section: "Basic Blocks",
        name: "Bulleted List",
        description: "Create a simple bullet list",
        icon: <List className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        section: "Basic Blocks",
        name: "Numbered List",
        description: "Create an ordered list",
        icon: <List className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        section: "Basic Blocks",
        name: "To-do List",
        description: "Track tasks with checkboxes",
        icon: <ListChecks className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleTaskList().run(),
      },
      {
        section: "Basic Blocks",
        name: "Quote",
        description: "Capture a quote with emphasis",
        icon: <Quote className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleBlockquote().run(),
      },
      {
        section: "Media",
        name: "Image",
        description: "Insert an image from URL",
        icon: <ImagePlus className="h-4 w-4" />,
        run: () => {
          const url = window.prompt("Paste image URL");
          if (url) {
            editor?.chain().focus().setImage({ src: url, alt: "Image" }).run();
          }
        },
      },
      {
        section: "Media",
        name: "Drawing",
        description: "Open the drawing canvas",
        icon: <Palette className="h-4 w-4" />,
        run: () => setShowDrawingPanel(true),
      },
      {
        section: "Media",
        name: "Divider",
        description: "Insert a horizontal divider",
        icon: <Minus className="h-4 w-4" />,
        run: () => editor?.chain().focus().setHorizontalRule().run(),
      },
      {
        section: "Media",
        name: "Code Block",
        description: "Display code with formatting",
        icon: <Code2 className="h-4 w-4" />,
        run: () => editor?.chain().focus().toggleCodeBlock().run(),
      },
    ],
    [editor],
  );

  const filteredSlash = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) {
      return slashActions;
    }
    return slashActions.filter(
      (action) =>
        action.name.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.section.toLowerCase().includes(q),
    );
  }, [slashActions, slashQuery]);

  useEffect(() => {
    setSlashActiveIndex(0);
  }, [slashQuery]);

  const saveDrawingAsImage = async (dataUrl: string) => {
    if (!editor) {
      return;
    }
    try {
      const uploadedUrl = await uploadImageDataUrl(dataUrl, `folium-drawing-${Date.now()}.png`);
      editor.chain().focus().setImage({ src: uploadedUrl, alt: "Drawing" }).run();
      setShowDrawingPanel(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save drawing.");
    }
  };

  const insertFiles = async (files: FileList | null) => {
    if (!files || !editor) {
      return;
    }

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        try {
          const uploadedUrl = await uploadImageFile(file);
          editor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `Unable to upload ${file.name}.`);
        }
        continue;
      }

      try {
        const uploaded = await uploadFile(file);
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: uploaded.name,
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: uploaded.url,
                        target: "_blank",
                        rel: "noreferrer",
                      },
                    },
                  ],
                },
              ],
            },
          ])
          .run();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Unable to upload ${file.name}.`);
      }
    }
  };

  return (
    <div
      data-workspace-id={workspaceId}
      className="notion-editor rounded-xl border bg-background p-4 pb-24 shadow-sm md:pb-4"
      onKeyDown={(event) => {
        if (event.key === "/") {
          setShowSlashMenu(true);
          setSlashQuery("");
        }

        if (!showSlashMenu) {
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setShowSlashMenu(false);
          setSlashQuery("");
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashActiveIndex((prev) => Math.min(prev + 1, Math.max(filteredSlash.length - 1, 0)));
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashActiveIndex((prev) => Math.max(prev - 1, 0));
        }

        if (event.key === "Enter" && filteredSlash[slashActiveIndex]) {
          event.preventDefault();
          filteredSlash[slashActiveIndex].run();
          setShowSlashMenu(false);
        }
      }}
    >
      <AnimatePresence>
        {editorFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex flex-wrap gap-2 border-b pb-3"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSlashMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-3 rounded-md border bg-background p-2"
          >
            <Input
              placeholder="Filter commands"
              value={slashQuery}
              onChange={(event) => setSlashQuery(event.target.value)}
              className="mb-2"
              autoFocus
            />
            {(["Basic Blocks", "Media"] as const).map((section) => {
              const items = filteredSlash.filter((entry) => entry.section === section);
              if (items.length === 0) {
                return null;
              }

              return (
                <div key={section} className="mb-2">
                  <p className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{section}</p>
                  <div className="grid gap-1">
                    {items.map((action) => {
                      const idx = filteredSlash.findIndex((entry) => entry.name === action.name);
                      return (
                        <button
                          key={action.name}
                          type="button"
                          className={`flex items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${slashActiveIndex === idx ? "bg-accent" : ""}`}
                          onMouseEnter={() => setSlashActiveIndex(idx)}
                          onClick={() => {
                            action.run();
                            setShowSlashMenu(false);
                          }}
                        >
                          <span className="mt-0.5 text-muted-foreground">{action.icon}</span>
                          <span>
                            <span className="block font-medium">{action.name}</span>
                            <span className="block text-xs text-muted-foreground">{action.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <EditorContent editor={editor} className="min-h-[420px]" />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="*/*"
        onChange={(event) => {
          void insertFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <SketchPadModal
        open={showDrawingPanel}
        onCancel={() => setShowDrawingPanel(false)}
        onSave={(dataUrl) => {
          void saveDrawingAsImage(dataUrl);
        }}
      />

      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur md:bottom-5 md:w-auto">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => editor?.chain().focus().toggleTaskList().run()}>
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="transition-colors hover:bg-accent"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="transition-colors hover:bg-accent"
            onClick={() => {
              const url = window.prompt("Paste image URL");
              if (url) {
                editor?.chain().focus().setImage({ src: url, alt: "Image" }).run();
              }
            }}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="transition-colors hover:bg-accent" onClick={() => setShowDrawingPanel(true)}>
            <Palette className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
