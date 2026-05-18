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

const mathJaxKey = "MathJax";

async function renderSvg(
	value: string,
	display: boolean,
): Promise<ElementContent[]> {
	const mathJax = (window as unknown as Record<string, BrowserMathJax>)[
		mathJaxKey
	];
	if (!mathJax) {
		throw new Error("MathJax browser runtime is not loaded");
	}
	await mathJax.startup.promise;
	const rendered = await mathJax.tex2svgPromise(value, { display });
	const html = mathJax.startup.adaptor.outerHTML(rendered);
	const parsed = fromHtml(html, { fragment: true });

	return parsed.children as ElementContent[];
}

export const rehypeMathjax = createRehypeMathjax(renderSvg);

export default rehypeMathjax;
