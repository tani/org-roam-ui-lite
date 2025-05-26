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
 * Dim unrelated nodes and edges leaving the focused node opaque.
 *
 * @param graph - Graph instance
 * @param focusId - Node id to highlight
 */
export function dimOthers(
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
export function setElementsStyle(
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
export function setNodeStyle(
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
export function resetDim(graph: GraphInstance | undefined): void {
	if (!graph) return;
	if (typeof (graph as Core).elements === "function") {
		setElementsStyle(graph as Core, { opacity: 1 });
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

/**
 * Initialize or update a graph based on selected renderer.
 *
 * @param renderer - Rendering library
 * @param layoutName - Layout algorithm name (Cytoscape only)
 * @param container - DOM element hosting the graph
 * @param existingGraph - Previous graph instance
 * @param nodeSize - Node diameter in pixels
 * @param labelScale - Font scale for node labels
 * @returns The created or updated graph instance
 */
export async function renderGraph(
	renderer: Renderer,
	layoutName: Layout,
	container: HTMLElement,
	existingGraph: GraphInstance | undefined,
	nodeSize: number,
	labelScale: number,
): Promise<GraphInstance> {
	const { data, error } = await api.GET("/api/graph.json");

	if (error) throw new Error(`API error: ${error}`);

	const baseNodes: GraphNode[] = data.nodes.map((n) => ({
		id: n.id,
		label: n.title,
		color: pickColor(n.id),
	}));
	const radius = nodeSize / 2;
	const area = Math.PI * radius * radius;
	const volume = (4 / 3) * Math.PI * radius * radius * radius;
	const edgeColor = getCssVariable("--bs-secondary");
	const edges: GraphLink[] = data.edges.map((e) => ({
		source: e.source,
		target: e.dest,
		color: edgeColor,
	}));

	if (renderer === "cytoscape") {
		const { default: cytoscape } = await import("cytoscape");
		const elements = [
			...baseNodes.map((n) => ({ data: n })),
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
					label: "data(label)",
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
			animationDuration: 700,
		} as LayoutOptions;

		const cy = existingGraph as Core | undefined;
		if (!cy) {
			const graph = cytoscape({
				container,
				elements,
				layout,
				minZoom: 0.5,
				maxZoom: 4,
				style,
			});
			return graph;
		}
		cy.batch(() => {
			cy.elements().remove();
			cy.add(elements);
			cy.style(style);
			cy.layout(layout).run();
		});
		return cy;
	}

	if (renderer === "force-graph") {
		const { default: ForceGraphCtor } = await import("force-graph");
		const nodes = baseNodes.map((n) => ({ ...n, val: area }));
		let fg = existingGraph as ForceGraph<GraphNode, GraphLink> | undefined;
		if (!fg) fg = new ForceGraphCtor<GraphNode, GraphLink>(container);
		fg.nodeId("id")
			.nodeLabel("label")
			.nodeColor("color")
			.nodeVal("val")
			.nodeRelSize(1)
			.linkColor("color")
			.linkWidth(2)
			.graphData({ nodes, links: edges });
		return fg;
	}

	const nodes = baseNodes.map((n) => ({ ...n, val: volume }));
	const { default: ForceGraph3D } = await import("3d-force-graph");
	let fg3d = existingGraph as
		| ForceGraph3DInstance<GraphNode, GraphLink>
		| undefined;
	if (!fg3d)
		fg3d = new ForceGraph3D(container) as unknown as ForceGraph3DInstance<
			GraphNode,
			GraphLink
		>;
	fg3d
		.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes, links: edges });
	return fg3d;
}
