"use client";

import { useEffect, useRef, useState } from "react";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type RangeSelection,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $createLinkNode,
  AutoLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { EditorImage } from "@/components/editor-image";
import { uploadImage } from "@/lib/demo-client";

function validUrl(value: string) {
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function EditorTools({
  disabled,
  onUploadBusy,
}: {
  disabled: boolean;
  onUploadBusy: (busy: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [link, setLink] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const selection = useRef<RangeSelection | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const current = $getSelection();
          if ($isRangeSelection(current))
            setFormat({
              bold: current.hasFormat("bold"),
              italic: current.hasFormat("italic"),
              underline: current.hasFormat("underline"),
            });
        });
      }),
    [editor]
  );
  const block = (value: string) => {
    if (value === "bullet" || value === "number") {
      editor.dispatchCommand(
        value === "bullet"
          ? INSERT_UNORDERED_LIST_COMMAND
          : INSERT_ORDERED_LIST_COMMAND,
        undefined
      );
      return;
    }
    editor.update(() => {
      const current = $getSelection();
      if ($isRangeSelection(current))
        $setBlocksType(current, () =>
          value === "quote"
            ? $createQuoteNode()
            : value === "h1" || value === "h2" || value === "h3"
            ? $createHeadingNode(value)
            : $createParagraphNode()
        );
    });
  };
  const insertLink = () => {
    editor.getEditorState().read(() => {
      const current = $getSelection();
      selection.current = $isRangeSelection(current) ? current.clone() : null;
      setText($isRangeSelection(current) ? current.getTextContent() : "");
    });
    setLink(true);
    setUrl("https://");
  };
  async function insertImage(image: File) {
    setUploading(true);
    onUploadBusy(true);
    setError("");
    try {
      const result = await uploadImage(image);
      editor.update(() => {
        $insertNodes([new EditorImage(result.uri, image.name)]);
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The local image could not be added."
      );
    } finally {
      setUploading(false);
      onUploadBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  return (
    <>
      <fieldset
        disabled={disabled || uploading}
        className="editor-toolbar"
        aria-label="Text formatting"
      >
        <select
          aria-label="Text style"
          className="editor-style"
          defaultValue="paragraph"
          onChange={(event) => block(event.target.value)}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="bullet">Bullet list</option>
          <option value="number">Numbered list</option>
          <option value="quote">Quote</option>
        </select>
        {(["bold", "italic", "underline"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-label={value[0].toUpperCase() + value.slice(1)}
            aria-pressed={format[value]}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, value)}
          >
            {value === "bold" ? (
              <b>B</b>
            ) : value === "italic" ? (
              <i>I</i>
            ) : (
              <u>U</u>
            )}
          </button>
        ))}
        <select
          aria-label="Text alignment"
          className="editor-style"
          defaultValue="left"
          onChange={(event) =>
            editor.dispatchCommand(
              FORMAT_ELEMENT_COMMAND,
              event.target.value as "left" | "center" | "right" | "justify"
            )
          }
        >
          <option value="left">Align left</option>
          <option value="center">Center</option>
          <option value="right">Align right</option>
          <option value="justify">Justify</option>
        </select>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertLink}
        >
          Link
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}
        >
          Unlink
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => file.current?.click()}
        >
          Image
        </button>
        <button
          type="button"
          aria-label="Undo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="Redo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          ↷
        </button>
        <input
          ref={file}
          className="visually-hidden"
          type="file"
          aria-label="Upload an image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => {
            const image = event.target.files?.[0];
            if (image) void insertImage(image);
          }}
        />
      </fieldset>
      {link && (
        <div className="editor-link-form">
          <label>
            Link text
            <input
              className="form-control"
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={disabled}
            />
          </label>
          <label>
            Link URL
            <input
              className="form-control"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={disabled}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={disabled || !validUrl(url) || !text.trim()}
            onClick={() => {
              editor.update(() => {
                if (selection.current) $setSelection(selection.current.clone());
                const current = $getSelection();
                if ($isRangeSelection(current) && !current.isCollapsed())
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
                else {
                  const node = $createLinkNode(url);
                  node.append($createTextNode(text));
                  $insertNodes([node]);
                }
              });
              setLink(false);
            }}
          >
            Insert link
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => setLink(false)}
          >
            Cancel
          </button>
        </div>
      )}
      {uploading && (
        <p className="editor-notice" role="status">
          Adding image…
        </p>
      )}
      {error && (
        <p className="editor-notice action-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export default function RichEditor({
  initialValue = "",
  onChange,
  disabled = false,
  label = "Update message",
  descriptionId,
  invalid = false,
  placeholder = "Write something useful for the campus community…",
  onUploadBusy,
}: {
  initialValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  descriptionId?: string;
  invalid?: boolean;
  placeholder?: string;
  onUploadBusy: (busy: boolean) => void;
}) {
  const config = {
    namespace: "PawprintsUpdate",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      EditorImage,
    ],
    theme: {
      paragraph: "editor-paragraph",
      quote: "editor-quote",
      text: {
        bold: "editor-bold",
        italic: "editor-italic",
        underline: "editor-underline",
      },
      heading: { h1: "editor-h1", h2: "editor-h2", h3: "editor-h3" },
    },
    onError: (error: Error) => {
      throw error;
    },
    editorState: (editor: import("lexical").LexicalEditor) => {
      const root = $getRoot();
      if (!initialValue) {
        root.append($createParagraphNode());
        return;
      }
      try {
        const json = JSON.parse(initialValue);
        if (json?.root) {
          editor.setEditorState(editor.parseEditorState(initialValue));
          return;
        }
      } catch {
        /* Older updates use HTML or plain text. */
      }
      const doc = new DOMParser().parseFromString(initialValue, "text/html");
      const nodes = $generateNodesFromDOM(editor, doc);
      let paragraph = $createParagraphNode();
      for (const node of nodes) {
        if ($isElementNode(node)) {
          if (!paragraph.isEmpty()) root.append(paragraph);
          root.append(node);
          paragraph = $createParagraphNode();
        } else paragraph.append(node);
      }
      if (!paragraph.isEmpty() || root.isEmpty()) root.append(paragraph);
    },
  };
  return (
    <div className={`rich-editor ${disabled ? "is-disabled" : ""}`}>
      <LexicalComposer initialConfig={config}>
        <EditorTools disabled={disabled} onUploadBusy={onUploadBusy} />
        <div className="editor-content">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-label={label}
                aria-describedby={descriptionId}
                aria-invalid={invalid || undefined}
                aria-multiline="true"
              />
            }
            placeholder={
              <span className="editor-placeholder">{placeholder}</span>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin validateUrl={validUrl} />
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(state) => onChange(JSON.stringify(state.toJSON()))}
        />
      </LexicalComposer>
    </div>
  );
}
