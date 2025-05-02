import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
// import "bootswatch/dist/united/bootstrap.min.css";
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
	// Load Rehype & friends in parallel
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

	return unified()
		.use(uniorgParse)
		.use(uniorgRehype)
		.use(rehypeMathjax)
		.use(rehypeMermaid, { dark: theme === "dark" } as RehypeMermaidOptions)
		.use(rehypeStarryNight, { grammars })
		.use(rehypeStringify);
}

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
	// Deterministic hash → index into accent palette
	let hash = 0;
	for (let i = 0; i < key.length; i++)
		hash = (hash + key.charCodeAt(i)) % accentVarNames.length;

	const varName = accentVarNames[hash];
	return cssVar(varName);
}

function dimOthers(graph: cytoscape.Core, focusId: string) {
	const focus = graph.$id(focusId);
	const neighbourhood = focus.closedNeighborhood();

	graph.nodes().forEach((n) => {
		const highlight = n.id() === focusId || neighbourhood.contains(n);
		n.style("opacity", highlight ? 1 : 0.15);
	});

	graph.edges().forEach((e) => {
		const highlight =
			e.source().id() === focusId || e.target().id() === focusId;
		e.style("opacity", highlight ? 1 : 0.05);
	});
}

function resetHighlights(graph: cytoscape.Core) {
	graph.nodes().forEach((n) => {
		n.style("opacity", 1);
	});
	graph.edges().forEach((e) => {
		e.style("opacity", 1);
	});
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

		// Restore full colour when the off‑canvas is hidden
		document
			.getElementById("offcanvasDetails")!
			.addEventListener("hidden.bs.offcanvas", () => {
				if (this.graph) resetHighlights(this.graph);
			});
	},

	async refreshGraph() {
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
				minZoom: 0.5,
				maxZoom: 4,
				style: [
					{
						selector: "edge",
						style: {
							width: 1,
						},
					},
					{
						selector: "node",
						style: {
							width: 10,
							height: 10,
							color: cssVar("--bs-body-color"),
							"background-color": "data(color)",
							label: "data(label)",
							"font-size": "0.5em",
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
			this.graph.json({ elements: [] });
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
