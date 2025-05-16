import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { encodeBase64url } from "./base64url.ts";

export default function rehypeImgSrcFix(id: string) {
	return (tree: Root) => {
		visit(tree, "element", (node: Element) => {
			if (
				node.tagName === "img" &&
				node.properties &&
				typeof node.properties.src === "string"
			) {
				const src: string = node.properties.src;
				if (
					src.startsWith("data:") ||
					src.startsWith("http:") ||
					src.startsWith("https:") ||
					src.startsWith("//") ||
					src.startsWith("/api/node/") ||
					src.startsWith("#") ||
					src.trim() === ""
				) {
					return;
				}
				const extname = src.replace(/^.*[.]/, ".");
				const basename = src.replace(/[.][^.]*$/, "");
				const encodedBasename = encodeBase64url(basename);
				node.properties.src = `/api/node/${id}/${encodedBasename}${extname}`;
			}
		});
	};
}
