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
import { common, createLowlight } from "lowlight";
import { useEffect } from "react";
import { useEditor as useAutoSaveEditor } from "@/hooks/useEditor";

const lowlight = createLowlight(common);

type TiptapEditorProps = {
  pageId: string;
  content: Record<string, unknown>;
};

export function TiptapEditor({ pageId, content }: TiptapEditorProps): JSX.Element {
  const { save } = useAutoSaveEditor(pageId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight,
      HorizontalRule,
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

  return (
    <div className="rounded-lg border bg-card p-4">
      <EditorContent editor={editor} />
    </div>
  );
}
