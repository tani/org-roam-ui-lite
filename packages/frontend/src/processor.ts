import type { RehypeMermaidOptions } from "rehype-mermaid";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import uniorgParse from "uniorg-parse";
import uniorgRehype from "uniorg-rehype";

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
		languages.add(match[1]);
		match = languageRegex.exec(orgContent);
	}

	return {
		mermaid: /#\+begin_src\s+mermaid/i.test(orgContent),
		math: /\$[^\n$]+\$|\\\(|\\\[/m.test(orgContent),
		languages: [...languages],
	};
}

type Process = (str: string) => Promise<string>;

/**
 * Create a processor that converts Org markup to HTML.
 *
 * @param theme - Color theme
 * @param nodeId - Node identifier used for resource links
 * @returns Function that processes an Org string to HTML
 */
export function createOrgHtmlProcessor<Theme extends string>(
	theme: Theme,
	nodeId: string,
): Process {
	return async (orgContent: string) => {
		const { default: rehypeImgSrcFix } = await import(
			"./rehype-img-src-fix.ts"
		);
		const { default: rehypeClassNames } = await import("rehype-class-names");

		const detected = detect(orgContent);

		const processor = unified()
			.use(uniorgParse)
			.use(uniorgRehype)
			.use(rehypeRaw)
			.use(rehypeImgSrcFix, nodeId);

		if (detected.math) {
			const { default: rehypeMathJax } = await import("rehype-mathjax");
			processor.use(rehypeMathJax);
		}

		if (detected.mermaid) {
			const mod = await import("rehype-mermaid");
			const rehypeMermaid = mod.default;
			processor.use(rehypeMermaid, {
				strategy: "img-svg",
				dark: theme.endsWith("dark"),
			} as RehypeMermaidOptions);
		}

		if (detected.languages.length > 0) {
			const { transformerCopyButton } = await import(
				"@rehype-pretty/transformers"
			);
			const { default: rehypePrettyCode } = await import("rehype-pretty-code");
			const { getSingletonHighlighter } = await import("shiki");
			const highlighter = await getSingletonHighlighter({
				themes: [theme.endsWith("dark") ? "vitesse-dark" : "vitesse-light"],
			});
			await Promise.all(
				detected.languages.map(async (l) => {
					try {
						await highlighter.loadLanguage(l as never);
					} catch {
						/* ignore unknown languages */
					}
				}),
			);
			processor.use(rehypePrettyCode, {
				theme: theme.endsWith("dark") ? "vitesse-dark" : "vitesse-light",
				getHighlighter: () => Promise.resolve(highlighter),
				transformers: [
					transformerCopyButton({
						visibility: "always",
						feedbackDuration: 3_000,
					}),
				],
			});
		}

		processor
			.use(rehypeClassNames, {
				table: "table table-bordered table-hover",
				blockquote: "blockquote",
			})
			.use(rehypeStringify);

		return String(await processor.process(orgContent));
	};
}
