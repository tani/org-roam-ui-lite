import type { Element, Root } from "hast";

import { visit } from "unist-util-visit";

/**
 * Rehype plugin options.
 *
 * @property classNameMap - Maps HTML tag names (case-insensitive) to
 *   space-separated CSS classes to append.
 *
 * @public
 */
export interface RehypeClassNamesOptions {
	/** Mapping of tag names to space-separated class names. */
	classNameMap: Record<string, string>;
}

/**
 * Rehype plugin that assigns CSS class names to elements by tag name.
 *
 * @example
 * // Apply Bootstrap table classes to all &lt;table&gt; elements
 * const processor = unified()
 *   .use(rehypeClassNames, {
 *     table: "table table-bordered table-hover",
 *   });
 *
 * @example
 * // Apply custom styles to blockquotes and paragraphs
 * const processor = unified().use(rehypeClassNames, {
 *   blockquote: "blockquote border-start",
 *   p: "text-muted",
 * });
 *
 * @param options - Tag name to class name mapping.
 * @returns A unified transformer that adds classes to matching elements.
 */
export function rehypeClassNames(
	options: RehypeClassNamesOptions,
): (tree: Root) => void {
	const { classNameMap = {} } = options;

	// Normalize keys to lowercase for case-insensitive matching.
	const normalizedMap = Object.fromEntries(
		Object.entries(classNameMap).map(([tag, classes]) => [
			tag.toLowerCase(),
			classes,
		]),
	) as Record<string, string>;

	const tagNames = Object.keys(normalizedMap);

	return function transformer(tree: Root): void {
		if (tagNames.length === 0) {
			return;
		}

		visit(tree, "element", (node: Element) => {
			const elementName = node.tagName.toLowerCase();
			const targetClasses = normalizedMap[elementName];
			if (!targetClasses) {
				return;
			}

			const classesToAdd = targetClasses
				.split(" ")
				.map((c) => c.trim())
				.filter(Boolean);

			if (classesToAdd.length === 0) {
				return;
			}

			// Initialize className array if it does not exist.
			if (
				!node.properties.className ||
				!Array.isArray(node.properties.className)
			) {
				node.properties = { ...node.properties, className: [] };
			}

			// Collect existing classes for deduplication.
			const className = node.properties.className;
			const existingClasses = new Set(
				(className as string[]).map((c) => String(c).toLowerCase()),
			);

			// Append only classes not already present.
			for (const cls of classesToAdd) {
				if (!existingClasses.has(cls.toLowerCase())) {
					(className as string[]).push(cls);
					existingClasses.add(cls.toLowerCase());
				}
			}
		});
	};
}

export default rehypeClassNames;
