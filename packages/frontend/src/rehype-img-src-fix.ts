import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { encodeBase64url } from "./base64url.ts";

/**
 * Rewrite image src attributes to point to the resource API.
 *
 * @param nodeId - Node identifier used in the URL
 * @returns Transformer for the rehype pipeline
 */
export default function rehypeImgSrcFix(nodeId: string): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "img" &&
        node.properties &&
        typeof node.properties.src === "string"
      ) {
        const source: string = node.properties.src;
        if (
          source.startsWith("data:") ||
          source.startsWith("http:") ||
          source.startsWith("https:") ||
          source.startsWith("//") ||
          source.startsWith("/api/node/") ||
          source.startsWith("#") ||
          source.trim() === ""
        ) {
          return;
        }
        const extension = source.replace(/^.*[.]/, ".");
        const baseName = source.replace(/[.][^.]*$/, "");
        const encodedBaseName = encodeBase64url(baseName);
        node.properties.src = `/api/node/${nodeId}/${encodedBaseName}${extension}`;
      }
    });
  };
}
