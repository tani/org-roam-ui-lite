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

function detect(org: string): Detect {
	const langRe = /^#\+begin_src\s+(\S+)/gm;
	const langs = new Set<string>();
	let match = langRe.exec(org);
	while (match) {
		langs.add(match[1]);
		match = langRe.exec(org);
	}

	return {
		mermaid: /#\+begin_src\s+mermaid/i.test(org),
		math: /\$[^\n$]+\$|\\\(|\\\[/m.test(org),
		languages: [...langs],
	};
}

type Process = (str: string) => Promise<string>;

export function createOrgHtmlProcessor<Theme extends string>(
	theme: Theme,
	id: string,
): Process {
	return async (org: string) => {
		const { default: rehypeImgSrcFix } = await import(
			"./rehype-img-src-fix.ts"
		);
		const { default: rehypeClassNames } = await import("rehype-class-names");

		const info = detect(org);

		const processor = unified()
			.use(uniorgParse)
			.use(uniorgRehype)
			.use(rehypeRaw)
			.use(rehypeImgSrcFix, id);

		if (info.math) {
			const { default: rehypeMathJax } = await import("rehype-mathjax");
			processor.use(rehypeMathJax);
		}

		if (info.mermaid) {
			const mod = await import("rehype-mermaid");
			const rehypeMermaid = mod.default;
			processor.use(rehypeMermaid, {
				strategy: "img-svg",
				dark: theme.endsWith("dark"),
			} as RehypeMermaidOptions);
		}

		if (info.languages.length > 0) {
			const { transformerCopyButton } = await import(
				"@rehype-pretty/transformers"
			);
			const { default: rehypePrettyCode } = await import("rehype-pretty-code");
			const { getSingletonHighlighter } = await import("shiki");
			const highlighter = await getSingletonHighlighter({
				themes: [theme.endsWith("dark") ? "vitesse-dark" : "vitesse-light"],
			});
			await Promise.all(
				info.languages.map(async (l) => {
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

		return String(await processor.process(org));
	};
}
