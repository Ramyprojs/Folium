import { Fragment, type ReactNode } from "react";

type RichMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

type RichNode = {
  type?: string;
  text?: string;
  content?: RichNode[];
  marks?: RichMark[];
  attrs?: Record<string, unknown>;
};

function renderChildren(nodes: RichNode[] | undefined): ReactNode {
  return nodes?.map((node, index) => (
    <Fragment key={`${node.type || "node"}-${index}`}>{renderNode(node, index)}</Fragment>
  )) ?? null;
}

function applyMarks(text: ReactNode, marks: RichMark[] | undefined, keyPrefix: string): ReactNode {
  return (marks || []).reduce<ReactNode>((current, mark, index) => {
    const key = `${keyPrefix}-${mark.type || "mark"}-${index}`;

    switch (mark.type) {
      case "bold":
        return <strong key={key}>{current}</strong>;
      case "italic":
        return <em key={key}>{current}</em>;
      case "underline":
        return <u key={key}>{current}</u>;
      case "strike":
        return <s key={key}>{current}</s>;
      case "code":
        return (
          <code key={key} className="rounded bg-black/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10">
            {current}
          </code>
        );
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : undefined;
        return href ? (
          <a key={key} href={href} className="text-violet-600 underline underline-offset-2" target="_blank" rel="noreferrer">
            {current}
          </a>
        ) : (
          current
        );
      }
      default:
        return current;
    }
  }, text);
}

function textFromNode(node: RichNode): string {
  if (node.text) {
    return node.text;
  }

  return (node.content || []).map(textFromNode).join("");
}

function renderNode(node: RichNode, index: number): ReactNode {
  switch (node.type) {
    case "doc":
      return <div className="space-y-4">{renderChildren(node.content)}</div>;
    case "paragraph":
      return <p className="whitespace-pre-wrap leading-7">{renderChildren(node.content)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level || 1);
      const content = renderChildren(node.content);

      if (level === 1) {
        return <h1 className="text-4xl font-semibold tracking-tight">{content}</h1>;
      }
      if (level === 2) {
        return <h2 className="text-3xl font-semibold tracking-tight">{content}</h2>;
      }
      if (level === 3) {
        return <h3 className="text-2xl font-semibold tracking-tight">{content}</h3>;
      }

      return <h4 className="text-xl font-semibold tracking-tight">{content}</h4>;
    }
    case "bulletList":
      return <ul className="list-disc space-y-2 pl-6">{renderChildren(node.content)}</ul>;
    case "orderedList":
      return <ol className="list-decimal space-y-2 pl-6">{renderChildren(node.content)}</ol>;
    case "listItem":
      return <li>{renderChildren(node.content)}</li>;
    case "taskList":
      return <ul className="space-y-2">{renderChildren(node.content)}</ul>;
    case "taskItem": {
      const checked = Boolean(node.attrs?.checked);
      return (
        <li className="flex items-start gap-2">
          <input checked={checked} readOnly type="checkbox" className="mt-1 h-4 w-4 rounded border-border" />
          <span className={checked ? "text-muted-foreground line-through" : ""}>{renderChildren(node.content)}</span>
        </li>
      );
    }
    case "blockquote":
      return <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground">{renderChildren(node.content)}</blockquote>;
    case "codeBlock":
      return (
        <pre className="overflow-x-auto rounded-xl border bg-card p-4 text-sm">
          <code>{textFromNode(node)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr className="border-border" />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const caption = typeof node.attrs?.caption === "string" ? node.attrs.caption : "";

      if (!src) {
        return null;
      }

      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[540px] w-full rounded-xl border object-cover" />
          {caption ? <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption> : null}
        </figure>
      );
    }
    case "hardBreak":
      return <br />;
    case "text":
      return applyMarks(node.text || "", node.marks, `text-${index}`);
    default:
      return renderChildren(node.content);
  }
}

export function PublicRichContent({ content }: { content: unknown }): JSX.Element {
  if (!content || typeof content !== "object") {
    return <p className="text-muted-foreground">This page is empty.</p>;
  }

  return <div className="space-y-4">{renderNode(content as RichNode, 0)}</div>;
}
