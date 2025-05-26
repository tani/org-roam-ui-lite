import ForceGraph3D from "3d-force-graph";
import cytoscape, { type Core, type LayoutOptions } from "cytoscape";
import ForceGraph from "force-graph";
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
		| InstanceType<typeof ForceGraph>
		| InstanceType<typeof ForceGraph3D>;
	const data = fg.graphData();
	const neighbors = new Set<string>([focusId]);
	// biome-ignore lint/suspicious/noExplicitAny: external library types
	(data.links as any[]).forEach((l: any) => {
		const s = typeof l.source === "object" ? l.source.id : l.source;
		const t = typeof l.target === "object" ? l.target.id : l.target;
		if (s === focusId) neighbors.add(String(t));
		if (t === focusId) neighbors.add(String(s));
	});
	const edgeColor = getCssVariable("--bs-secondary");
	// biome-ignore lint/suspicious/noExplicitAny: external library types
	const fgAny = fg as any;
	fgAny.nodeColor(
		// biome-ignore lint/suspicious/noExplicitAny: library callback
		(node: any) =>
			neighbors.has(String(node.id))
				? node.color
				: alphaColor(node.color, 0.15),
	);
	fgAny.linkColor(
		// biome-ignore lint/suspicious/noExplicitAny: library callback
		(link: any) => {
			const s = typeof link.source === "object" ? link.source.id : link.source;
			const t = typeof link.target === "object" ? link.target.id : link.target;
			const related = neighbors.has(String(s)) && neighbors.has(String(t));
			return related ? edgeColor : alphaColor(edgeColor, 0.1);
		},
	);
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
		| InstanceType<typeof ForceGraph>
		| InstanceType<typeof ForceGraph3D>;
	const edgeColor = getCssVariable("--bs-secondary");
	// biome-ignore lint/suspicious/noExplicitAny: external library types
	const fgAny = fg as any;
	fgAny.nodeColor("color");
	fgAny.linkColor(edgeColor);
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

	const baseNodes = data.nodes.map((n) => ({
		id: n.id,
		label: n.title,
		color: pickColor(n.id),
	}));
	const radius = nodeSize / 2;
	const area = Math.PI * radius * radius;
	const volume = (4 / 3) * Math.PI * radius * radius * radius;
	const edgeColor = getCssVariable("--bs-secondary");
	const edges = data.edges.map((e) => ({
		source: e.source,
		target: e.dest,
		color: edgeColor,
	}));

	if (renderer === "cytoscape") {
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
		const nodes = baseNodes.map((n) => ({ ...n, val: area }));
		let fg = existingGraph as InstanceType<typeof ForceGraph> | undefined;
		if (!fg) fg = new ForceGraph(container);
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
	let fg3d = existingGraph as InstanceType<typeof ForceGraph3D> | undefined;
	if (!fg3d) fg3d = new ForceGraph3D(container);
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
