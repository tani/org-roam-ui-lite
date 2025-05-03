// --- Imports & Setup ---
import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import * as bootstrap from "bootstrap";
import cytoscape, { Core, ElementDefinition } from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import { z } from "zod";
import "./app.css";
import "./code.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@microflash/rehype-starry-night/css";
import type { RehypeMermaidOptions } from "rehype-mermaid";

Alpine.plugin(persist);

// Register Cytoscape extensions
cytoscape.use(coseBilkent);

// --- Schemas ---
const NodeDataSchema = z.object({
	id: z.string(),
	title: z.string(),
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
	raw: z.string(),
	backlinks: z.array(BacklinkSchema).optional(),
});

// Types
type NodeResponse = z.infer<typeof NodeResponseSchema>;
const Themes = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "nord-dark", label: "Nord Dark" },
	{ value: "gruvbox-dark", label: "Gruvbox Dark" },
] as const;

type Theme = typeof Themes[number]["value"];

// --- Utility Functions ---
/** Read CSS variable value */
function getCssVar(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

const ACCENT_VARS = [
  "--bs-blue",
  "--bs-indigo",
  "--bs-purple",
  "--bs-pink",
  "--bs-red",
  "--bs-orange",
  "--bs-yellow",
  "--bs-green",
  "--bs-teal",
  "--bs-cyan",
] as const;

/** Deterministic color picker based on id key */
function pickColor(key: string): string {
	let sum = 0;
	for (const ch of key) sum = (sum + ch.charCodeAt(0)) % ACCENT_VARS.length;
	return getCssVar(ACCENT_VARS[sum]);
}

/** Dim unrelated nodes/edges */
function dimOthers(graph: Core, focusId: string): void {
	const focus = graph.$id(focusId);
	const neighborhood = focus.closedNeighborhood();
	graph.elements().forEach((el) => {
		const isNeighbor = neighborhood.has(el);
		el.style("opacity", isNeighbor ? 1 : el.isNode() ? 0.15 : 0.05);
	});
}

/** Reset all styles */
function resetHighlights(graph: Core): void {
	graph.elements().style("opacity", 1);
}

// --- Processor Factory ---
/** Create unified processor for Org → HTML */
async function createOrgHtmlProcessor(theme: Theme) {
	const [
		{ unified },
		parse,
		rehypeOrg,
		mathjax,
		mermaid,
		starryNight,
		starryCore,
		stringify,
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
		.use(parse.default)
		.use(rehypeOrg.default)
		.use(mathjax.default)
		.use(mermaid.default, {
			strategy: "img-svg",
			dark: theme.endsWith("dark")
		} as RehypeMermaidOptions)
		.use(starryNight.default, { grammars: starryCore.all })
		.use(stringify.default);
}

// --- Graph Data & Rendering ---
/** Fetch and parse graph JSON */
async function fetchGraph(): Promise<ElementDefinition[]> {
	const res = await fetch("/api/graph");
	const json = await res.json();
	const { nodes, edges } = GraphResponseSchema.parse(json);

	// Map to Cytoscape elements
	return [
		...nodes.map((n) => ({
			data: { id: n.id, label: n.title, color: pickColor(n.id) },
		})),
		...edges.map((e) => ({ data: { source: e.source, target: e.dest } })),
	];
}

/** Initialize or update the Cytoscape graph */
async function renderGraph(
	container: HTMLElement,
	existingGraph: Core | null,
	nodeSize: number,
	labelScale: number,
): Promise<Core> {
	const elements = await fetchGraph();

	const style = [
		{ selector: "edge", style: { width: 1 } },
		{
			selector: "node",
			style: {
				width: nodeSize,
				height: nodeSize,
				"font-size": `${labelScale}em`,
				label: "data(label)",
				color: getCssVar("--bs-body-color"),
				"background-color": "data(color)",
			},
		},
	];

	if (!existingGraph) {
		return cytoscape({
			container,
			elements,
			layout: { name: "cose-bilkent" },
			minZoom: 0.5,
			maxZoom: 4,
			style,
		});
	}

	existingGraph.json({ elements: [], style });
	existingGraph.add(elements);
	existingGraph.layout({ name: "cose-bilkent" }).run();
	return existingGraph;
}

// --- Alpine App ---
Alpine.data("app", () => ({
  themes: Themes,
  theme: Alpine.$persist<Theme>(
	  matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  ),
	nodeSize: 10,
	labelScale: 0.5,
	graph: null as Core | null,
	selected: {} as NodeResponse & { html: string },
	offcanvas: null as bootstrap.Offcanvas | null,
  

	async init() {
		this.offcanvas = new bootstrap.Offcanvas(
			document.getElementById("offcanvasDetails")!,
		);

		// Initial graph render
		this.graph = await renderGraph(
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);

		// Event bindings
		this.graph.on("tap", "node", ({ target }) => {
			const id = target.id();
			void this.openNode(id);
			dimOthers(this.graph!, id);
		});

		document
			.getElementById("offcanvasDetails")!
			.addEventListener(
				"hidden.bs.offcanvas",
				() => this.graph && resetHighlights(this.graph),
			);
	},

	// Refresh graph with current settings
	async refresh() {
		this.graph = await renderGraph(
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);
	},

	// Toggle between dark/light theme
  setTheme(newTheme: Theme) {
	  this.theme = newTheme;
	  void this.refresh();
  },
  
	// Called when node size slider changes
	onSizeChange() {
		this.graph?.nodes().style({ width: this.nodeSize, height: this.nodeSize });
	},

	// Called when label scale slider changes
	onScaleChange() {
		this.graph?.nodes().style("font-size", `${this.labelScale}em`);
	},

	// Fetch node details and render
	async openNode(id: string) {
		const res = await fetch(`/api/node/${id}`);
		const json = await res.json();
		const data = NodeResponseSchema.parse(json);

		const processor = await createOrgHtmlProcessor(this.theme);
		const html = String(await processor.process(data.raw));
		this.selected = { ...data, html };
		this.offcanvas?.show();
	},
}));

Alpine.start();
