/// <reference lib="dom" />

import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./app.css";
import * as bootstrap from "bootstrap";
import { z } from "zod";
import "@wooorm/starry-night/style/both";
import type { RehypeMermaidOptions } from "rehype-mermaid";

// Zod schemas and TS types
const NodeDataSchema = z.object({
	id: z.string(),
	title: z.string(),
	file: z.string(),
});

const EdgeDataSchema = z.object({ source: z.string(), dest: z.string() });

const GraphResponseSchema = z.object({
	nodes: z.array(NodeDataSchema),
	edges: z.array(EdgeDataSchema),
});

const BacklinkSchema = z.object({ source: z.string(), title: z.string() });

const NodeResponseSchema = z.object({
	id: z.string(),
	title: z.string(),
	file: z.string(),
	raw: z.string(),
	backlinks: z.array(BacklinkSchema).optional(),
});
type NodeResponse = z.infer<typeof NodeResponseSchema>;

type Theme = "dark" | "light";

async function createOrgHtmlProcessor(theme: Theme) {
	// 並列で import() しておく
	const [
		unifiedModule,
		uniorgParseModule,
		uniorgRehypeModule,
		rehypeMathjaxModule,
		rehypeMermaidModule,
		rehypeStarryNightModule,
		starryNightCoreModule,
		rehypeStringifyModule,
	] = await Promise.all([
		import("unified"),
		import("uniorg-parse"),
		import("uniorg-rehype"),
		import("rehype-mathjax"),
		import("rehype-mermaid"),
		import("rehype-starry-night"),
		import("@wooorm/starry-night"),
		import("rehype-stringify"),
	]);

	const unified = unifiedModule.unified;
	const uniorgParse = uniorgParseModule.default;
	const uniorgRehype = uniorgRehypeModule.default;
	const rehypeMathjax = rehypeMathjaxModule.default;
	const rehypeMermaid = rehypeMermaidModule.default;
	const rehypeStarryNight = rehypeStarryNightModule.default;
	const grammars = starryNightCoreModule.all;
	const rehypeStringify = rehypeStringifyModule.default;

	// パイプライン組み立て
	return unified()
		.use(uniorgParse)
		.use(uniorgRehype)
		.use(rehypeMathjax)
		.use(rehypeMermaid, { dark: theme === "dark" } as RehypeMermaidOptions)
		.use(rehypeStarryNight, { grammars })
		.use(rehypeStringify);
}

cytoscape.use(coseBilkent);

function pickColor(key: string): string {
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash + key.charCodeAt(i)) % 360;
	}
	return `hsl(${hash}, 65%, 50%)`;
}

Alpine.data("app", () => ({
	theme: matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: ("light" as Theme),
	graph: null as cytoscape.Core | null,
	selected: {} as (NodeResponse & { html: string }) | Record<string, undefined>,
	detailsCanvas: new bootstrap.Offcanvas(
		document.getElementById("offcanvasDetails")!,
	),

	async init() {
		await this.refreshGraph();
	},

	async refreshGraph() {
		// 型チェック付きフェッチ
		const response = await fetch("/api/graph");
		const json = await response.json();
		const { nodes, edges } = GraphResponseSchema.parse(json);

		const elements: cytoscape.ElementDefinition[] = [
			...nodes.map((n) => ({
				data: { id: n.id, label: n.title, color: pickColor(n.file) },
			})),
			...edges.map((e) => ({ data: { source: e.source, target: e.dest } })),
		];

		if (!this.graph) {
			this.graph = cytoscape({
				container: this.$refs.graph,
				elements,
				layout: { name: "cose-bilkent" },
				zoom: 0.4,
				minZoom: 0.2,
				maxZoom: 2,
				style: [
					{
						selector: "node",
						style: {
							color: this.theme === "dark" ? "#eeeeee" : "#666666",
							"background-color": "data(color)",
							label: "data(label)",
						},
					},
				],
			});
			this.graph.on("tap", "node", (ev) => this.open(ev.target.id()));
		} else {
			this.graph.json({ elements: [] });
			this.graph.add(elements);
			this.graph.layout({ name: "cose-bilkent" }).run();
		}
	},

	async open(id: string) {
		// 型チェック付きフェッチ
		const nodeRes = await fetch(`/api/node/${id}`);
		const jsonBody = await nodeRes.json();
		const data = NodeResponseSchema.parse(jsonBody);

		const processor = await createOrgHtmlProcessor(this.theme);
		const html = String(await processor.process(data.raw));
		this.selected = { ...data, html };
		this.detailsCanvas.show();
	},
}));

Alpine.start();
