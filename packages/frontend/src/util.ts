import type { LayoutOptions } from "cytoscape";
import cytoscape, { type Core } from "cytoscape";
import createClient from "openapi-fetch";
import type { components, paths } from "./api.d.ts";

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

// --- Utility Functions ---
/**
 * Read a CSS variable value.
 *
 * @param name - CSS custom property name
 * @returns Resolved value
 */
export function getCssVariable(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

const ACCENT_VARIABLES = [
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

/**
 * Deterministically pick a color based on a string key.
 *
 * @param key - String used for color selection
 * @returns CSS variable value
 */
export function pickColor(key: string): string {
	let sum = 0;
	for (const ch of key)
		sum = (sum + ch.charCodeAt(0)) % ACCENT_VARIABLES.length;
	return getCssVariable(ACCENT_VARIABLES[sum]);
}

/**
 * Dim unrelated nodes and edges leaving the focused node opaque.
 *
 * @param graph - Cytoscape instance
 * @param focusId - Node id to highlight
 */
export function dimOthers(graph: Core | undefined, focusId: string): void {
	if (graph) {
		const focus = graph.$id(focusId);
		const neighborhood = focus?.closedNeighborhood();
		graph.elements().forEach((el) => {
			const isNeighbor = neighborhood.has(el);
			el.style("opacity", isNeighbor ? 1 : el.isNode() ? 0.15 : 0.05);
		});
	}
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
export async function renderGraph(
	layoutName: Layout,
	container: HTMLElement,
	existingGraph: Core | undefined,
	nodeSize: number,
	labelScale: number,
): Promise<Core> {
	const { data, error } = await api.GET("/api/graph.json");

	if (error) throw new Error(`API error: ${error}`);

	const nodes = data.nodes;
	const edges = data.edges;

	const elements = [
		...nodes.map((n) => ({
			data: { id: n.id, label: n.title, color: pickColor(n.id) },
		})),
		...edges.map((e) => ({ data: { source: e.source, target: e.dest } })),
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
				color: getCssVariable("--bs-body-color"),
				"background-color": "data(color)",
			},
		},
	];

	/*
  Since we removed fcose, we now automatically fall back to cose.
  However, starting with Cytoscape v4, cose may be dropped;
  if that happens, we might bring fcose back.
   */
	layoutName = layoutName === "fcose" ? "cose" : layoutName;

	const layout = {
		name: layoutName,
		tile: false,
		animate: "end",
		animationDuration: 700,
	} as LayoutOptions;

	if (!existingGraph) {
		const cy = cytoscape({
			container,
			elements,
			layout,
			minZoom: 0.5,
			maxZoom: 4,
			style,
		});
		return cy;
	}
	existingGraph.batch(() => {
		existingGraph.elements().remove();
		existingGraph.add(elements);
		existingGraph.style(style);
		existingGraph.layout(layout).run();
	});
	return existingGraph;
}

/**
 * Fetch a single node and convert its Org content to HTML.
 *
 * @param theme - Color theme
 * @param nodeId - Node identifier
 * @returns Node information with rendered HTML
 */
export async function openNode(
	theme: Theme,
	nodeId: string,
): Promise<components["schemas"]["Node"] & { html: string }> {
	const { data, error } = await api.GET("/api/node/{id}.json", {
		params: { path: { id: nodeId } },
	});

	if (error) {
		throw error;
	}

	const { createOrgHtmlProcessor } = await import("./processor.ts");
	const process = createOrgHtmlProcessor(theme, nodeId);
	const html = String(await process(data.raw));
	return { ...data, html };
}
