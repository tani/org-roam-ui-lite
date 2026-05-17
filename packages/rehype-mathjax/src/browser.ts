import type { ElementContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import "mathjax/tex-svg.js";

import { createRehypeMathjax } from "./core.ts";

export type { RehypeMathjaxOptions } from "./core.ts";

interface BrowserMathJax {
	startup: {
		adaptor: {
			outerHTML(node: unknown): string;
		};
		promise: Promise<void>;
	};
	tex2svgPromise(
		value: string,
		options: { display: boolean },
	): Promise<unknown>;
}

declare global {
	interface Window {
		MathJax: BrowserMathJax;
	}
}

async function renderSvg(
	value: string,
	display: boolean,
): Promise<ElementContent[]> {
	await window.MathJax.startup.promise;
	const rendered = await window.MathJax.tex2svgPromise(value, { display });
	const html = window.MathJax.startup.adaptor.outerHTML(rendered);
	const parsed = fromHtml(html, { fragment: true });

	return parsed.children as ElementContent[];
}

export const rehypeMathjax = createRehypeMathjax(renderSvg);

export default rehypeMathjax;
