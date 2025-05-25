import ForceGraph3D from "3d-force-graph";
import cytoscape, { type Core, type LayoutOptions } from "cytoscape";
import ForceGraph from "force-graph";
import createClient from "openapi-fetch";
import type { paths } from "./api.d.ts";
import { getCssVariable, pickColor } from "./style.ts";

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

/**
 * Dim unrelated nodes and edges leaving the focused node opaque.
 *
 * @param graph - Cytoscape instance
 * @param focusId - Node id to highlight
 */
export function dimOthers(graph: Core | undefined, focusId: string): void {
	if (!graph) return;
	const focus = graph.$id(focusId);
	const neighborhood = focus?.closedNeighborhood();
	graph.elements().forEach((el) => {
		const isNeighbor = neighborhood.has(el);
		el.style("opacity", isNeighbor ? 1 : el.isNode() ? 0.15 : 0.05);
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
 * Initialize or update the Cytoscape graph.
 *
 * @param layoutName - Layout algorithm name
 * @param container - DOM element hosting the graph
 * @param existingGraph - Previous Cytoscape instance
 * @param nodeSize - Node diameter in pixels
 * @param labelScale - Font scale for node labels
 * @returns The created or updated Cytoscape instance
 */
export type GraphInstance =
	| Core
	| InstanceType<typeof ForceGraph>
	| InstanceType<typeof ForceGraph3D>;

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

	const nodes = data.nodes.map((n) => ({
		id: n.id,
		label: n.title,
		color: pickColor(n.id),
	}));
	const edges = data.edges.map((e) => ({ source: e.source, target: e.dest }));

	if (renderer === "cytoscape") {
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
		let fg = existingGraph as InstanceType<typeof ForceGraph> | undefined;
		if (!fg) fg = new ForceGraph(container);
		fg.nodeId("id")
			.nodeLabel("label")
			.nodeColor("color")
			.nodeRelSize(nodeSize / 10)
			.linkWidth(1)
			.graphData({ nodes, links: edges });
		return fg;
	}

	let fg3d = existingGraph as InstanceType<typeof ForceGraph3D> | undefined;
	if (!fg3d) fg3d = new ForceGraph3D(container);
	fg3d
		.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeRelSize(nodeSize / 10)
		.linkWidth(1)
		.graphData({ nodes, links: edges });
	return fg3d;
}
