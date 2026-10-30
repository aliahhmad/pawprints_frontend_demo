"use client";

/* eslint-disable @next/next/no-img-element -- User-authored image attachments have arbitrary hosts and dimensions. */

import {
  DecoratorNode,
  type DOMConversionMap,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { ReactNode } from "react";

type ImageData = Spread<
  { src: string; altText: string },
  SerializedLexicalNode
>;
export class EditorImage extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  static getType() {
    return "image";
  }
  static clone(node: EditorImage) {
    return new EditorImage(node.__src, node.__altText, node.__key);
  }
  static importJSON(node: ImageData) {
    return new EditorImage(node.src, node.altText);
  }
  static importDOM(): DOMConversionMap {
    return {
      img: () => ({
        priority: 0,
        conversion: (node) => ({
          node: new EditorImage(
            (node as HTMLImageElement).src,
            (node as HTMLImageElement).alt,
          ),
        }),
      }),
    };
  }
  constructor(src = "", altText = "", key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }
  exportJSON(): ImageData {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }
  createDOM() {
    return document.createElement("span");
  }
  updateDOM() {
    return false;
  }
  decorate(): ReactNode {
    if (!/^(?:https?:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|webp|gif);base64,)/.test(this.__src))
      return <span>Image unavailable</span>;
    return (
      <img
        className="editor-image"
        src={this.__src}
        alt={this.__altText || "Petition attachment"}
      />
    );
  }
}
