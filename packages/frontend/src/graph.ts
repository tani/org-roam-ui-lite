import type { ForceGraph3DInstance } from "3d-force-graph";
import type { Core, LayoutOptions } from "cytoscape";
import type ForceGraph from "force-graph";
import type { LinkObject, NodeObject } from "force-graph";
import createClient from "openapi-fetch";
import type { paths } from "./api.d.ts";
import { alphaColor, getCssVariable, pickColor } from "./style.ts";

const api = createClient<paths>();

export const Layouts = [
	"cose",
	"grid",
	"circle",
	"concentric",
	"random",
	"breadthfirst",
];

export type Layout = (typeof Layouts)[number];

export const Themes = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "nord-dark", label: "Nord Dark" },
	{ value: "gruvbox-dark", label: "Gruvbox Dark" },
	{ value: "dracula-dark", label: "Dracula Dark" },
] as const;

export type Theme = (typeof Themes)[number]["value"];

export const Renderers = [
	{ value: "cytoscape", label: "Cytoscape" },
	{ value: "force-graph", label: "Force Graph" },
	{ value: "3d-force-graph", label: "3D Force Graph" },
] as const;

export type Renderer = (typeof Renderers)[number]["value"];

export interface GraphNode extends NodeObject {
	id: string;
	label: string;
	color: string;
}

export interface GraphLink extends LinkObject<GraphNode> {
	color: string;
}

/**
 * Highlight the neighborhood of the given node while dimming others.
 *
 * @param graph - Graph instance
 * @param focusId - Node id to highlight
 */
export function highlightNeighborhood(
	graph: GraphInstance | undefined,
	focusId: string,
): void {
	if (!graph) return;

	// Cytoscape graph handling
	if (typeof (graph as Core).elements === "function") {
		const cy = graph as Core;
		const focus = cy.$id(focusId);
		const neighborhood = focus?.closedNeighborhood();
		cy.elements().forEach((el) => {
			const isNeighbor = neighborhood.has(el);
			el.style("opacity", isNeighbor ? 1 : el.isNode() ? 0.15 : 0.05);
		});
		return;
	}

	// Force graph handling
	const fg = graph as
		| ForceGraph<GraphNode, GraphLink>
		| ForceGraph3DInstance<GraphNode, GraphLink>;
	const data = fg.graphData();
	const neighbors = new Set<string>([focusId]);
	data.links.forEach((l) => {
		const s = typeof l.source === "object" ? l.source.id : l.source;
		const t = typeof l.target === "object" ? l.target.id : l.target;
		if (String(s) === focusId) neighbors.add(String(t));
		if (String(t) === focusId) neighbors.add(String(s));
	});
	fg.nodeColor((node: GraphNode) =>
		neighbors.has(String(node.id)) ? node.color : alphaColor(node.color, 0.15),
	);
	fg.linkColor((link: GraphLink) => {
		const s = typeof link.source === "object" ? link.source.id : link.source;
		const t = typeof link.target === "object" ? link.target.id : link.target;
		const related = neighbors.has(String(s)) && neighbors.has(String(t));
		return related ? link.color : alphaColor(link.color, 0.05);
	});
}

/**
 * Apply style properties to all elements in the graph.
 *
 * @param graph - Cytoscape instance
 * @param style - CSS properties to apply
 */
export function applyElementsStyle(
	graph: Core | undefined,
	style: Record<string, unknown>,
): void {
	for (const [key, value] of Object.entries(style)) {
		graph?.elements().style(key, value);
	}
}

/**
 * Apply style properties to all nodes in the graph.
 *
 * @param graph - Cytoscape instance
 * @param style - CSS properties to apply
 */
export function applyNodeStyle(
	graph: Core | undefined,
	style: Record<string, unknown>,
): void {
	graph?.nodes().style(style);
}

/**
 * Restore default opacity and colors for all graph elements.
 *
 * @param graph - Graph instance
 */
export function resetHighlight(graph: GraphInstance | undefined): void {
	if (!graph) return;
	if (typeof (graph as Core).elements === "function") {
		applyElementsStyle(graph as Core, { opacity: 1 });
		return;
	}
	const fg = graph as
		| ForceGraph<GraphNode, GraphLink>
		| ForceGraph3DInstance<GraphNode, GraphLink>;
	fg.nodeColor("color");
	fg.linkColor("color");
}

/**
 * Graph instance for any renderer.
 */
export type GraphInstance =
	| Core
	| ForceGraph<GraphNode, GraphLink>
	| ForceGraph3DInstance<GraphNode, GraphLink>;

interface GraphData {
	nodes: GraphNode[];
	edges: GraphLink[];
}

/** Fetch graph data from the backend API. */
async function fetchGraphData(): Promise<GraphData> {
	const { data, error } = await api.GET("/api/graph.json");

	if (error) throw new Error(`API error: ${error}`);

	const nodes: GraphNode[] = data.nodes.map((n) => ({
		id: n.id,
		label: n.title,
		color: pickColor(n.id),
	}));
	const edgeColor = getCssVariable("--bs-secondary");
	const edges: GraphLink[] = data.edges.map((e) => ({
		source: e.source,
		target: e.dest,
		color: edgeColor,
	}));

	return { nodes, edges };
}

/** Render or update the graph using Cytoscape. */
async function renderWithCytoscape(
	nodes: GraphNode[],
	edges: GraphLink[],
	layoutName: Layout,
	container: HTMLElement,
	existing: Core | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<Core> {
	const { default: cytoscape } = await import("cytoscape");
	const elements = [
		...nodes.map((n) => ({ data: n })),
		...edges.map((e) => ({ data: e })),
	];

	const style = [
		{ selector: "edge", style: { width: 1 } },
		{
			selector: "node",
			style: {
				width: nodeSize,
				height: nodeSize,
				"font-size": `${labelScale}em`,
				label: showLabels ? "data(label)" : "",
				"font-family": getCssVariable("--bs-font-sans-serif"),
				color: getCssVariable("--bs-body-color"),
				"background-color": "data(color)",
			},
		},
	];

	layoutName = layoutName === "fcose" ? "cose" : layoutName;

	const layout = {
		name: layoutName,
		tile: false,
		animate: "end",
	} as LayoutOptions;

	if (!existing) {
		return cytoscape({
			container,
			elements,
			layout,
			minZoom: 0.5,
			maxZoom: 4,
			style,
		});
	}

	existing.batch(() => {
		existing.elements().remove();
		existing.add(elements);
		existing.style(style);
		existing.layout(layout).run();
	});

	return existing;
}

/** Render or update the graph using force-graph. */
async function renderWithForceGraph(
	nodes: GraphNode[],
	edges: GraphLink[],
	container: HTMLElement,
	existing: ForceGraph<GraphNode, GraphLink> | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<ForceGraph<GraphNode, GraphLink>> {
	const { default: ForceGraphCtor } = await import("force-graph");
	const radius = nodeSize / 2;
	const area = Math.PI * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: area }));
	if (!existing) existing = new ForceGraphCtor<GraphNode, GraphLink>(container);
	const fontSize = 12 * labelScale;
	existing
		.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes: fgNodes, links: edges });

	if (showLabels)
		existing
			.nodeCanvasObject((node: GraphNode, ctx, scale) => {
				const label = String(node.label);
				const size = fontSize / scale;
				ctx.font = `${size}px ${getCssVariable("--bs-font-sans-serif")}`;
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillStyle = getCssVariable("--bs-body-color");
				if (typeof node.x === "number" && typeof node.y === "number")
					ctx.fillText(label, node.x, node.y + radius + 2);
			})
			.nodeCanvasObjectMode(() => "after");
	else existing.nodeCanvasObject(() => undefined);

	return existing;
}

/** Render or update the graph using 3d-force-graph. */
async function renderWith3DForceGraph(
	nodes: GraphNode[],
	edges: GraphLink[],
	container: HTMLElement,
	existing: ForceGraph3DInstance<GraphNode, GraphLink> | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<ForceGraph3DInstance<GraphNode, GraphLink>> {
	void labelScale;
	const { default: ForceGraph3D } = await import("3d-force-graph");
	const radius = nodeSize / 2;
	const volume = (4 / 3) * Math.PI * radius * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: volume }));
	if (!existing)
		existing = new ForceGraph3D(container) as unknown as ForceGraph3DInstance<
			GraphNode,
			GraphLink
		>;
	existing.backgroundColor(getCssVariable("--bs-body-bg"));
	existing
		.nodeId("id")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes: fgNodes, links: edges });

	existing.nodeLabel(showLabels ? "label" : "");
	if (!showLabels) existing.nodeThreeObject(null).nodeThreeObjectExtend(false);
	return existing;
}

/**
 * Initialize or update a graph based on the selected renderer.
 */
export async function drawGraph(
	renderer: Renderer,
	layoutName: Layout,
	container: HTMLElement,
	existingGraph: GraphInstance | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<GraphInstance> {
	const { nodes, edges } = await fetchGraphData();

	if (renderer === "cytoscape")
		return renderWithCytoscape(
			nodes,
			edges,
			layoutName,
			container,
			existingGraph as Core | undefined,
			nodeSize,
			labelScale,
			showLabels,
		);

	if (renderer === "force-graph")
		return renderWithForceGraph(
			nodes,
			edges,
			container,
			existingGraph as ForceGraph<GraphNode, GraphLink> | undefined,
			nodeSize,
			labelScale,
			showLabels,
		);

	return renderWith3DForceGraph(
		nodes,
		edges,
		container,
		existingGraph as ForceGraph3DInstance<GraphNode, GraphLink> | undefined,
		nodeSize,
		labelScale,
		showLabels,
	);
}
