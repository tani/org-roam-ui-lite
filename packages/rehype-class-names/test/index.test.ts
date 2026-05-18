import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import rehypeClassNames from "../src/index.ts";

function createProcessor(options: Parameters<typeof rehypeClassNames>[0]) {
	return unified()
		.use(rehypeParse)
		.use(rehypeClassNames, options)
		.use(rehypeStringify);
}

function tableInput(content: string) {
	return `<table><tr><td>${content}</td></tr></table>`;
}

describe("rehypeClassNames", () => {
	it("applies classes to table elements", async () => {
		const processor = createProcessor({
			classNameMap: { table: "table table-bordered table-hover" },
		});
		const input = tableInput("content");
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).toContain("table-bordered");
		expect(output).toContain("table-hover");
	});

	it("applies classes to blockquote elements", async () => {
		const processor = createProcessor({
			classNameMap: { blockquote: "blockquote border-start" },
		});
		const input = ["<div>", "<blockquote>q</blockquote>", "</div>"].join("");
		const result = await processor.process(input);
		const output = String(result.value);
		expect(output).toContain("blockquote border-start");
	});

	it("appends classes to existing ones", async () => {
		const processor = createProcessor({
			classNameMap: { p: "text-muted" },
		});
		const input = '<p class="lead">hello</p>';
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).toContain("text-muted");
		expect(output).toContain("lead");
	});

	it("deduplicates classes", async () => {
		const processor = createProcessor({
			classNameMap: { p: "text-muted" },
		});
		const input = '<p class="text-muted">already has</p>';
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).not.toContain("text-muted text-muted");
	});

	it("skips elements not in the map", async () => {
		const processor = createProcessor({
			classNameMap: { table: "table-bordered" },
		});
		const input = "<p>paragraph</p>";
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).not.toContain("table-bordered");
		expect(output).toContain("paragraph");
	});

	it("handles empty classNameMap", async () => {
		const processor = createProcessor({ classNameMap: {} });
		const input = tableInput("content");
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).toContain("content");
	});

	it("handles case-insensitive tag names", async () => {
		const tagKey = "TABLE";
		const processor = createProcessor({
			classNameMap: { [tagKey]: "table-responsive" },
		});
		const input = tableInput("content");
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).toContain("table-responsive");
	});

	it("leaves non-matched elements unchanged", async () => {
		const processor = createProcessor({
			classNameMap: { table: "table-bordered" },
		});
		const input = "<p>No tables here</p>";
		const result = await processor.process(input);
		const output = String(result.value);

		expect(output).toContain("No tables here");
	});
});
