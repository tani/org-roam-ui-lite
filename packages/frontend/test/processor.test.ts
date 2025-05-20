import { describe, expect, it, vi } from "vitest";

const mockMermaid = vi.fn(() => () => {});
vi.mock("rehype-mermaid", () => ({
	default: (...args: unknown[]) => mockMermaid(...args),
}));
const mockPrettyCode = vi.fn(() => () => {});
vi.mock("rehype-pretty-code", () => ({
	default: (...args: unknown[]) => mockPrettyCode(...args),
}));
const mockMathJax = vi.fn(() => () => {});
vi.mock("rehype-mathjax", () => ({
	default: (...args: unknown[]) => mockMathJax(...args),
}));

import { createOrgHtmlProcessor } from "../src/processor.ts";

function createProcess(theme = "light") {
	return createOrgHtmlProcessor(theme, "abc");
}

function trim(str: string): string {
	return str.replace(/\n/g, "");
}

describe("createOrgHtmlProcessor", () => {
	it("converts headings", async () => {
		const process = createProcess();
		const html = await process("* Hello");
		expect(trim(html)).toBe("<h1>Hello</h1>");
	});

	it("rewrites relative image paths", async () => {
		const process = createProcess();
		const html = await process("[[file:images/foo.png]]");
		expect(trim(html)).toBe(
			'<p><img src="/api/node/abc/ZmlsZTppbWFnZXMvZm9v.png"></p>',
		);
	});

	it("keeps absolute image paths", async () => {
		const process = createProcess();
		const html = await process("[[http://example.com/foo.png]]");
		expect(trim(html)).toBe('<p><img src="http://example.com/foo.png"></p>');
	});

	it("adds blockquote class", async () => {
		const process = createProcess();
		const org = "#+begin_quote\nfoo\n#+end_quote";
		const html = await process(org);
		expect(trim(html)).toBe(
			'<blockquote class="blockquote"><p>foo</p></blockquote>',
		);
	});
	it("uses mermaid plugin based on theme", async () => {
		mockMermaid.mockClear();
		await createProcess()("*");
		expect(mockMermaid).toHaveBeenCalledWith(
			expect.objectContaining({ dark: false }),
		);
		mockMermaid.mockClear();
		await createProcess("my-dark")("*");
		expect(mockMermaid).toHaveBeenCalledWith(
			expect.objectContaining({ dark: true }),
		);
	});

	it("uses mathjax plugin", async () => {
		mockMathJax.mockClear();
		await createProcess()("*");
		expect(mockMathJax).toHaveBeenCalled();
	});

	it("uses pretty code plugin", async () => {
		mockPrettyCode.mockClear();
		await createProcess()("*");
		expect(mockPrettyCode).toHaveBeenCalled();
		const opts = mockPrettyCode.mock.calls[0][0];
		expect(opts.theme).toBe("vitesse-light");
		expect(Array.isArray(opts.transformers)).toBe(true);
	});
});
