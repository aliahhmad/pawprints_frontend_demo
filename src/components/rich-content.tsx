"use client";

/* eslint-disable @next/next/no-img-element -- User-authored attachments may use arbitrary hosts and lack intrinsic dimensions. */

import { createElement, Fragment, type ReactNode } from "react";

type EditorNode = {
  type?: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  url?: string;
  src?: string;
  altText?: string;
  children?: EditorNode[];
};

function safeUrl(value: string | null | undefined, image = false) {
  if (typeof value !== "string" || !value) return undefined;
  if (image && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value, "https://pawprints.invalid");
    if (
      ["http:", "https:", ...(image ? [] : ["mailto:"])].includes(url.protocol)
    )
      return value;
  } catch {
    /* Invalid links become ordinary text. */
  }
  return undefined;
}

function editorNode(node: EditorNode, key: number, depth = 0): ReactNode {
  if (depth > 60 || !node || typeof node !== "object") return null;
  const children = Array.isArray(node.children)
    ? node.children.map((child, index) => editorNode(child, index, depth + 1))
    : undefined;
  if (node.type === "text") {
    let text: ReactNode = typeof node.text === "string" ? node.text : "";
    const format = typeof node.format === "number" ? node.format : 0;
    if (format & 1) text = <strong>{text}</strong>;
    if (format & 2) text = <em>{text}</em>;
    if (format & 4) text = <s>{text}</s>;
    if (format & 8) text = <u>{text}</u>;
    if (format & 16) text = <code>{text}</code>;
    if (format & 32) text = <sub>{text}</sub>;
    if (format & 64) text = <sup>{text}</sup>;
    return <Fragment key={key}>{text}</Fragment>;
  }
  if (node.type === "linebreak") return <br key={key} />;
  if (node.type === "image") {
    const src = safeUrl(node.src, true);
    return src ? (
      <img
        key={key}
        src={src}
        alt={
          typeof node.altText === "string"
            ? node.altText
            : "Petition attachment"
        }
        loading="lazy"
      />
    ) : null;
  }
  if (node.type === "link" || node.type === "autolink")
    return (
      <a key={key} href={safeUrl(node.url)} rel="noreferrer noopener">
        {children}
      </a>
    );
  const tag =
    node.type === "heading"
      ? node.tag === "h1" || node.tag === "h2"
        ? "h3"
        : ["h3", "h4", "h5", "h6"].includes(node.tag || "")
          ? node.tag!
          : "h3"
      : node.type === "paragraph"
        ? "p"
        : node.type === "quote"
          ? "blockquote"
          : node.type === "list"
            ? node.listType === "number"
              ? "ol"
              : "ul"
            : node.type === "listitem"
              ? "li"
              : "div";
  const align =
    typeof node.format === "string" &&
    ["left", "center", "right", "justify"].includes(node.format)
      ? (node.format as "left" | "center" | "right" | "justify")
      : undefined;
  return createElement(
    tag,
    { key, style: align ? { textAlign: align } : undefined },
    children,
  );
}

function htmlNode(node: Node, key: number, depth = 0): ReactNode {
  if (depth > 60) return null;
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const element = node as HTMLElement;
  let tag = element.tagName.toLowerCase();
  if (
    [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "meta",
      "link",
      "title",
      "svg",
      "math",
      "template",
    ].includes(tag)
  )
    return null;
  const children = Array.from(element.childNodes).map((child, index) =>
    htmlNode(child, index, depth + 1),
  );
  if (tag === "img") {
    const src = safeUrl(element.getAttribute("src"), true);
    return src ? (
      <img
        key={key}
        src={src}
        alt={element.getAttribute("alt") || "Petition attachment"}
        loading="lazy"
      />
    ) : null;
  }
  if (tag === "a")
    return (
      <a
        key={key}
        href={safeUrl(element.getAttribute("href"))}
        rel="noreferrer noopener"
      >
        {children}
      </a>
    );
  if (tag === "h1" || tag === "h2") tag = "h3";
  const allowed = [
    "p",
    "div",
    "span",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "sub",
    "sup",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ];
  if (!allowed.includes(tag)) return <Fragment key={key}>{children}</Fragment>;
  return createElement(
    tag,
    { key },
    ["br", "hr"].includes(tag) ? undefined : children,
  );
}

export default function RichContent({ content }: { content: string | null }) {
  if (!content)
    return <p className="text-secondary">No description provided.</p>;
  let root: EditorNode | undefined;
  try {
    const parsed = JSON.parse(content);
    if (parsed?.root && typeof parsed.root === "object") root = parsed.root;
  } catch {
    /* Older petitions use HTML or plain text. */
  }
  if (root) return <div className="rich-content">{editorNode(root, 0)}</div>;
  if (typeof DOMParser === "undefined")
    return <div className="rich-content">{content}</div>;
  let source = content;
  // Decode legacy entity-encoded markup in an inert document; render an allowlist as React nodes.
  if (/&lt;\/?(?:p|div|strong|h[1-6]|ul|ol|br)\b/i.test(source))
    source =
      new DOMParser().parseFromString(source, "text/html").documentElement
        .textContent || source;
  const document = new DOMParser().parseFromString(source, "text/html");
  return (
    <div className="rich-content">
      {Array.from(document.body.childNodes).map((node, index) =>
        htmlNode(node, index),
      )}
    </div>
  );
}
