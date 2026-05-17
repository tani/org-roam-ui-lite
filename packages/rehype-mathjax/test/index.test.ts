import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import rehypeMathjax from "../src/index.ts";

function createProcessor(options?: Parameters<typeof rehypeMathjax>[0]) {
	return unified()
		.use(rehypeParse)
		.use(rehypeMathjax, options)
		.use(rehypeStringify);
}

describe("rehypeMathjax", () => {
	it("replaces inline math code with MathJax SVG markup", async () => {
		const processor = createProcessor();
		const result = await processor.process(
			'<p><code class="language-math math-inline">x^2</code></p>',
		);
		const html = String(result.value);

		expect(html).toContain('class="math-inline"');
		expect(html).toContain("<mjx-container");
		expect(html).not.toContain("<code");
	});

	it("replaces display math code block with MathJax SVG markup", async () => {
		const processor = createProcessor();
		const result = await processor.process(
			'<pre><code class="language-math math-display">\\frac{1}{x}</code></pre>',
		);
		const html = String(result.value);

		expect(html).toContain('class="math-display"');
		expect(html).toContain("<mjx-container");
		expect(html).not.toContain("<pre>");
	});

	it("applies a custom wrapper class", async () => {
		const processor = createProcessor({ className: "mathjax-svg" });
		const result = await processor.process(
			'<p><code class="language-math math-inline">x+y</code></p>',
		);

		expect(String(result.value)).toContain('class="mathjax-svg"');
	});

	it("leaves non-math code unchanged", async () => {
		const processor = createProcessor();
		const result = await processor.process(
			'<pre><code class="language-javascript">const x = 1;</code></pre>',
		);
		const html = String(result.value);

		expect(html).toContain("<pre>");
		expect(html).toContain("language-javascript");
		expect(html).not.toContain("<mjx-container");
	});
});
