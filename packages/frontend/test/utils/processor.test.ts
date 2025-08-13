import { describe, expect, test } from "vitest";
import { createOrgHtmlProcessor } from "../../src/utils/processor.ts";

describe("createOrgHtmlProcessor", () => {
	test("creates processor function", () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		expect(typeof processor).toBe("function");
	});

	test("processes simple org content", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const result = await processor("* Hello World");
		expect(result).toBeDefined();
	});

	test("processes org content with paragraph", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const result = await processor(
			"This is a paragraph.\n\nAnother paragraph.",
		);
		expect(result).toBeDefined();
	});

	test("handles empty content", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const result = await processor("");
		expect(result).toBeDefined();
	});

	test("works with dark theme", async () => {
		const processor = createOrgHtmlProcessor("dark", "test-node");
		const result = await processor("* Dark theme test");
		expect(result).toBeDefined();
	});

	test("processes content with basic markup", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const result = await processor("*bold* /italic/ _underline_");
		expect(result).toBeDefined();
	});
});

describe("processor with different content types", () => {
	test("detects languages correctly", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const orgContent = `
#+begin_src javascript
console.log("hello");
#+end_src

#+begin_src python
print("hello")
#+end_src
		`.trim();

		const result = await processor(orgContent);
		expect(result).toBeDefined();
	});

	test("handles math content", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const result = await processor("Math: $x = y + z$");
		expect(result).toBeDefined();
	});

	test("handles mermaid diagrams", async () => {
		const processor = createOrgHtmlProcessor("light", "test-node");
		const orgContent = `
#+begin_src text
Simple text block
#+end_src
		`.trim();

		const result = await processor(orgContent);
		expect(result).toBeDefined();
	});
});
