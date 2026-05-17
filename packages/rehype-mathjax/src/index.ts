import type { ElementContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import MathJaxModule from "mathjax";

import { createRehypeMathjax } from "./core.ts";

export type { RehypeMathjaxOptions } from "./core.ts";

let mathjaxReady: Promise<typeof MathJaxModule> | undefined;

function getMathJax(): Promise<typeof MathJaxModule> {
	mathjaxReady ??= MathJaxModule.init({
		loader: { load: ["input/tex", "output/svg"] },
	});

	return mathjaxReady as Promise<typeof MathJaxModule>;
}

async function renderSvg(
	value: string,
	display: boolean,
): Promise<ElementContent[]> {
	const mathjax = await getMathJax();
	const rendered = await mathjax.tex2svgPromise(value, { display });
	const html = mathjax.startup.adaptor.serializeXML(rendered);
	const parsed = fromHtml(html, { fragment: true });

	return parsed.children as ElementContent[];
}

export const rehypeMathjax = createRehypeMathjax(renderSvg);

export default rehypeMathjax;
