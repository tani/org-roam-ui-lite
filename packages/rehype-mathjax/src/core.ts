import type { Element, ElementContent, Parents, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { visit } from "unist-util-visit";

export interface RehypeMathjaxOptions {
	/**
	 * CSS class for the wrapper around generated inline SVG.
	 *
	 * Defaults to `math-inline` for inline math and `math-display` for display
	 * math.
	 */
	className?: string;
}

interface MathTarget {
	code: Element;
	display: boolean;
	index: number;
	parent: Parents;
	target: Element;
}

export type RenderMathSvg = (
	value: string,
	display: boolean,
) => Promise<ElementContent[]>;

function hasClass(node: Element, className: string): boolean {
	const classes = node.properties?.className;
	return Array.isArray(classes) && classes.includes(className);
}

function isMathCode(node: Element): boolean {
	return hasClass(node, "language-math") || hasClass(node, "math");
}

function createWrapper(
	children: ElementContent[],
	display: boolean,
	className?: string,
): Element {
	return {
		type: "element",
		tagName: display ? "div" : "span",
		properties: {
			className: [className ?? (display ? "math-display" : "math-inline")],
		},
		children,
	};
}

/**
 * Naive rehype plugin that turns TeX math code nodes into inline MathJax SVG.
 *
 * It handles the common `remark-math` HAST shapes:
 *
 * - `<code class="language-math math-inline">...`
 * - `<pre><code class="language-math math-display">...</code></pre>`
 */
export function createRehypeMathjax(
	renderSvg: RenderMathSvg,
): (options?: RehypeMathjaxOptions) => (tree: Root) => Promise<void> {
	return (options: RehypeMathjaxOptions = {}) =>
		async (tree: Root): Promise<void> => {
			const targets: MathTarget[] = [];

			visit(
				tree,
				"element",
				(
					node: Element,
					index: number | undefined,
					parent: Parents | undefined,
				) => {
					if (index === undefined || !parent) {
						return;
					}

					if (node.tagName === "pre") {
						const code = node.children[0];
						if (
							code?.type === "element" &&
							code.tagName === "code" &&
							isMathCode(code)
						) {
							targets.push({
								code,
								display: true,
								index,
								parent,
								target: node,
							});
						}
						return;
					}

					if (node.tagName === "code" && isMathCode(node)) {
						targets.push({
							code: node,
							display: hasClass(node, "math-display"),
							index,
							parent,
							target: node,
						});
					}
				},
			);

			for (const target of targets.reverse()) {
				const value = hastToString(target.code).trim();
				if (!value) {
					continue;
				}

				target.parent.children.splice(
					target.index,
					1,
					createWrapper(
						await renderSvg(value, target.display),
						target.display,
						options.className,
					),
				);
			}
		};
}
