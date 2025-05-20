import { transformerCopyButton } from "@rehype-pretty/transformers";
import rehypeClassNames from "rehype-class-names";
import rehypeMathJax from "rehype-mathjax";
import rehypeMermaid, { type RehypeMermaidOptions } from "rehype-mermaid";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorgRehype from "uniorg-rehype";
import rehypeImgSrcFix from "./rehype-img-src-fix.ts";

type Process = (str: string) => Promise<string>;

export function createOrgHtmlProcessor<Theme extends string>(
	theme: Theme,
	id: string,
): Process {
	const processor = unified()
		.use(uniorgParse)
		.use(uniorgRehype)
		.use(rehypeRaw)
		.use(rehypeImgSrcFix, id)
		.use(rehypeMathJax)
		.use(rehypeMermaid, {
			strategy: "img-svg",
			dark: theme.endsWith("dark"),
		} as RehypeMermaidOptions)
		.use(rehypePrettyCode, {
			theme: theme.endsWith("dark") ? "vitesse-dark" : "vitesse-light",
			transformers: [
				transformerCopyButton({
					visibility: "always",
					feedbackDuration: 3_000,
				}),
			],
		})
		.use(rehypeClassNames, {
			table: "table table-bordered table-hover",
			blockquote: "blockquote",
		})
		.use(rehypeStringify);
	return async (org: string) => String(await processor.process(org));
}
