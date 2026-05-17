import type { ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeClassNames from "rehype-class-names";
import rehypeHighlight from "rehype-highlight";
import rehypeMathJax from "rehype-mathjax";
import { rehypeMermaid } from "rehype-mermaid";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorgRehype from "uniorg-rehype";

import rehypeImgSrcFix from "./rehype-img-src-fix.ts";

type Detect = {
	mermaid: boolean;
	math: boolean;
	languages: string[];
};

/**
 * Inspect the Org string and determine which processors are needed.
 *
 * @param orgContent - Org source text
 * @returns Flags indicating required plugins
 */
function detect(orgContent: string): Detect {
	const languageRegex = /^#\+begin_src\s+(\S+)/gm;
	const languages = new Set<string>();
	let match = languageRegex.exec(orgContent);
	while (match) {
		if (match[1]) {
			languages.add(match[1]);
		}
		match = languageRegex.exec(orgContent);
	}

	return {
		mermaid: /#\+begin_src\s+mermaid/i.test(orgContent),
		math: /\$[^\n$]+\$|\\\(|\\\[/m.test(orgContent),
		languages: [...languages],
	};
}

type Process = (str: string) => Promise<ReactNode>;

/**
 * Create a processor that converts Org markup into a ReactNode.
 *
 * @param theme - Color theme
 * @param nodeId - Node identifier used for resource links
 * @returns Function that processes an Org string to a ReactNode
 */
export function createOrgHtmlProcessor<Theme extends string>(
	theme: Theme,
	nodeId: string,
): Process {
	return async (orgContent: string) => {
		const detected = detect(orgContent);

		const processor = unified()
			.use(uniorgParse)
			.use(uniorgRehype)
			.use(rehypeRaw)
			.use(rehypeImgSrcFix, nodeId);

		if (detected.math) {
			processor.use(rehypeMathJax);
		}

		if (detected.mermaid) {
			processor.use(rehypeMermaid, {
				theme: theme.endsWith("dark") ? "github-dark" : "default",
			});
		}

		if (detected.languages.length > 0) {
			processor.use(rehypeHighlight, {
				ignoreMissing: true,
			});
		}

		processor
			.use(rehypeClassNames, {
				table: "table table-bordered table-hover",
				blockquote: "blockquote",
			})
			.use(rehypeReact, {
				Fragment,
				jsx,
				jsxs,
				elementAttributeNameCase: "react",
			});

		return (await processor.process(orgContent)).result;
	};
}
