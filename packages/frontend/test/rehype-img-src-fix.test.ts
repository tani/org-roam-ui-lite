import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";
import { encodeBase64url } from "../src/utils/base64url.ts";
import rehypeImgSrcFix from "../src/utils/rehype-img-src-fix.ts";

function imgTree(src: string): Root {
  return {
    type: "root",
    children: [
      { type: "element", tagName: "img", properties: { src }, children: [] },
    ],
  } as unknown as Root;
}

describe("rehypeImgSrcFix", () => {
  it("rewrites relative paths", () => {
    const tree = imgTree("images/foo.png");
    rehypeImgSrcFix("abc")(tree);
    const encoded = encodeBase64url("images/foo");
    const el = tree.children[0] as Element;
    expect(el.properties?.src).toBe(`/api/node/abc/${encoded}.png`);
  });

  it("ignores absolute URLs", () => {
    const tree = imgTree("http://example.com/foo.png");
    const before = (tree.children[0] as Element).properties?.src;
    rehypeImgSrcFix("abc")(tree);
    const el = tree.children[0] as Element;
    expect(el.properties?.src).toBe(before);
  });
});
