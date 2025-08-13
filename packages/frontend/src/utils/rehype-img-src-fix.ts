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
  const ignorePattern = /^(data:|https?:|\/\/|\/api\/node\/|#|\s*$)/;
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img" || typeof node.properties?.src !== "string") {
        return;
      }

      const src = node.properties.src.trim();
      if (ignorePattern.test(src)) return;

      const [base, extension = ""] = src.split(/(?=\.[^.]+$)/);
      node.properties!.src = `/api/node/${nodeId}/${
        encodeBase64url(base)
      }${extension}`;
    });
  };
}
