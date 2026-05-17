import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import rehypeMermaid from "../src/index.ts";

function createProcessor(options?: Parameters<typeof rehypeMermaid>[0]) {
	return unified()
		.use(rehypeParse)
		.use(rehypeMermaid, options)
		.use(rehypeStringify);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mermaidInput(content: string): string {
	return `<pre><code class="language-mermaid">${content}</code></pre>`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("rehypeMermaid", () => {
	it("replaces mermaid code block with SVG in div", async () => {
		const processor = createProcessor();
		const input = mermaidInput("graph TD\n  A-->B");
		const result = await processor.process(input);

		expect(String(result.value)).toContain("<svg");
		expect(String(result.value)).not.toContain("<pre>");
	});

	it("applies custom className to wrapper div", async () => {
		const processor = createProcessor({ className: "mermaid-diagram" });
		const input = mermaidInput("graph TD\n  A-->B");
		const result = await processor.process(input);

		expect(String(result.value)).toContain('class="mermaid-diagram"');
	});

	it("uses a data-mermaid attribute when no className given", async () => {
		const processor = createProcessor();
		const input = mermaidInput("graph TD\n  A-->B");
		const result = await processor.process(input);

		expect(String(result.value)).toContain("data-mermaid");
		expect(String(result.value)).not.toContain("className");
	});

	it("skips non-mermaid code blocks", async () => {
		const processor = createProcessor();
		const input = `<pre><code class="language-javascript">console.log("hi");</code></pre>`;
		const result = await processor.process(input);

		expect(String(result.value)).toContain("<pre>");
		expect(String(result.value)).toContain("language-javascript");
		expect(String(result.value)).not.toContain("<svg");
	});

	it("handles multiple mermaid blocks", async () => {
		const processor = createProcessor();
		const input =
			mermaidInput("graph TD\n  A-->B") +
			mermaidInput("sequenceDiagram\n  A->>B");
		const result = await processor.process(input);

		const svgCount = (String(result.value).match(/<svg/g) || []).length;
		expect(svgCount).toBe(2);

		const preCount = (String(result.value).match(/<pre/g) || []).length;
		expect(preCount).toBe(0);
	});

	it("leaves tree unchanged when no mermaid blocks exist", async () => {
		const processor = createProcessor();
		const input = "<p>Hello world</p>";
		const result = await processor.process(input);

		expect(String(result.value)).toContain("<p>Hello world</p>");
	});

	it("renders with github-dark theme", async () => {
		const processor = createProcessor({ theme: "github-dark" });
		const input = mermaidInput("graph TD\n  A-->B");
		const result = await processor.process(input);

		expect(String(result.value)).toContain("<svg");
	});

	it("renders with default theme", async () => {
		const processor = createProcessor({ theme: "default" });
		const input = mermaidInput("graph TD\n  A-->B");
		const result = await processor.process(input);

		expect(String(result.value)).toContain("<svg");
	});
});
