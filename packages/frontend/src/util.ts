import type { LayoutOptions } from "cytoscape";
import cytoscape, { type Core } from "cytoscape";
import createClient from "openapi-fetch";
import type { paths } from "./api.d.ts";

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
/** Read CSS variable value */
export function getCssVar(name: string): string {
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
export function pickColor(key: string): string {
	let sum = 0;
	for (const ch of key) sum = (sum + ch.charCodeAt(0)) % ACCENT_VARS.length;
	return getCssVar(ACCENT_VARS[sum]);
}

/** Dim unrelated nodes/edges */
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

export function setElementsStyle(
	graph: Core | undefined,
	style: Record<string, unknown>,
): void {
	for (const [key, value] of Object.entries(style)) {
		graph?.elements().style(key, value);
	}
}

export function setNodeStyle(
	graph: Core | undefined,
	style: Record<string, unknown>,
): void {
	graph?.nodes().style(style);
}

/** Initialize or update the Cytoscape graph */
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
				color: getCssVar("--bs-body-color"),
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

export async function openNode(theme: Theme, id: string) {
	const { data, error } = await api.GET("/api/node/{id}.json", {
		params: { path: { id } },
	});

	if (error) {
		throw error;
	}

	const { createOrgHtmlProcessor } = await import("./processor.ts");
	const process = createOrgHtmlProcessor(theme, id);
	const html = String(await process(data.raw));
	return { ...data, html };
}
