import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./app.css";
import "./code.css";
import * as bootstrap from "bootstrap";
import { z } from "zod";
import "@microflash/rehype-starry-night/css";
import type { RehypeMermaidOptions } from "rehype-mermaid";

// --- Zod schemas ---
const NodeDataSchema = z.object({
	id: z.string(),
	title: z.string(),
	file: z.string(),
});
const EdgeDataSchema = z.object({
	source: z.string(),
	dest: z.string(),
});
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

// --- HTML → rehype プロセッサ生成 ---
async function createOrgHtmlProcessor(theme: Theme) {
	const [
		{ unified },
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
		import("@microflash/rehype-starry-night"),
		import("@wooorm/starry-night"),
		import("rehype-stringify"),
	]);

	return unified()
		.use(uniorgParseModule.default)
		.use(uniorgRehypeModule.default)
		.use(rehypeMathjaxModule.default)
		.use(rehypeMermaidModule.default, {
			dark: theme === "dark",
		} as RehypeMermaidOptions)
		.use(rehypeStarryNightModule.default, {
			grammars: starryNightCoreModule.all,
		})
		.use(rehypeStringifyModule.default);
}

// --- Cytoscape 拡張 & ヘルパー関数 ---
cytoscape.use(coseBilkent);

function cssVar(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

const accentVarNames = [
	"--bs-primary",
	"--bs-secondary",
	"--bs-success",
	"--bs-info",
	"--bs-warning",
	"--bs-danger",
	"--bs-link-hover-color",
] as const;

function pickColor(key: string): string {
	let hash = 0;
	for (const ch of key)
		hash = (hash + ch.charCodeAt(0)) % accentVarNames.length;
	return cssVar(accentVarNames[hash]);
}

function dimOthers(graph: cytoscape.Core, focusId: string) {
	const focus = graph.$id(focusId);
	const neighborhood = focus.closedNeighborhood();
	graph.nodes().forEach((n) => {
		n.style(
			"opacity",
			neighborhood.contains(n) || n.id() === focusId ? 1 : 0.15,
		);
	});
	graph.edges().forEach((e) => {
		e.style(
			"opacity",
			e.source().id() === focusId || e.target().id() === focusId ? 1 : 0.05,
		);
	});
}

function resetHighlights(graph: cytoscape.Core) {
	graph.nodes().style("opacity", 1);
	graph.edges().style("opacity", 1);
}

// --- Alpine.js アプリ本体 ---
const prefersColorScheme = matchMedia("(prefers-color-scheme: dark)");

Alpine.data("app", () => ({
	theme: (prefersColorScheme.matches ? "dark" : "light") as Theme,
	nodeSize: 10,
	labelScale: 0.5,
	graph: null as cytoscape.Core | null,
	selected: {} as (NodeResponse & { html: string }) | Record<string, never>,
	detailsCanvas: new bootstrap.Offcanvas(
		document.getElementById("offcanvasDetails")!,
	),

	async init() {
		await this.refreshGraph();

		document
			.getElementById("offcanvasDetails")!
			.addEventListener("hidden.bs.offcanvas", () => {
				if (this.graph) resetHighlights(this.graph);
			});

		prefersColorScheme.addEventListener("change", (e) => {
			this.theme = e.matches ? "dark" : "light";
			this.refreshGraph();
		});
	},

	toggleTheme() {
		this.theme = this.theme === "dark" ? "light" : "dark";
		this.refreshGraph();
	},

	updateNodeSize() {
		this.graph
			?.nodes()
			.style("width", this.nodeSize)
			.style("height", this.nodeSize);
	},

	updateLabelScale() {
		this.graph?.nodes().style("font-size", `${this.labelScale}em`);
	},

	async refreshGraph() {
		const res = await fetch("/api/graph");
		const json = await res.json();
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
				minZoom: 0.5,
				maxZoom: 4,
				style: [
					{ selector: "edge", style: { width: 1 } },
					{
						selector: "node",
						style: {
							width: this.nodeSize,
							height: this.nodeSize,
							"font-size": `${this.labelScale}em`,
							label: "data(label)",
							color: cssVar("--bs-body-color"),
							"background-color": "data(color)",
						},
					},
				],
			});

			this.graph.on("tap", "node", (ev) => {
				const id = ev.target.id();
				void this.open(id);
				dimOthers(this.graph!, id);
			});
		} else {
			this.graph.json({
				elements: [],
				style: [
					{ selector: "edge", style: { width: 1 } },
					{
						selector: "node",
						style: {
							width: this.nodeSize,
							height: this.nodeSize,
							"font-size": `${this.labelScale}em`,
							label: "data(label)",
							color: cssVar("--bs-body-color"),
							"background-color": "data(color)",
						},
					},
				],
			});
			this.graph.add(elements);
			this.graph.layout({ name: "cose-bilkent" }).run();
		}
	},

	async open(id: string) {
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
