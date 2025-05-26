import type { Core, LayoutOptions } from "cytoscape";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	RendererFunction,
} from "../graph-types.ts";
import { getCssVariable } from "../style.ts";

/**
 * Render or update a graph using Cytoscape.
 *
 * @param nodes - Graph nodes to render
 * @param edges - Graph links to render
 * @param layout - Layout algorithm name
 * @param container - Target element for rendering
 * @param existing - Existing Cytoscape instance to update
 * @param nodeSize - Display size for nodes
 * @param labelScale - Relative scale for labels
 * @param showLabels - Whether to display labels
 * @returns The Cytoscape instance used for rendering
 */
const renderCytoscape: RendererFunction = async (
	nodes: GraphNode[],
	edges: GraphLink[],
	layout: Layout,
	container: HTMLElement,
	existing: GraphInstance | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<GraphInstance> => {
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

	layout = (layout as string) === "fcose" ? "cose" : layout;

	const cyLayout = {
		name: layout,
		tile: false,
		animate: "end",
	} as LayoutOptions;

	const cyExisting = existing as Core | undefined;

	if (!cyExisting) {
		return cytoscape({
			container,
			elements,
			layout: cyLayout,
			minZoom: 0.5,
			maxZoom: 4,
			style,
		});
	}

	cyExisting.batch(() => {
		cyExisting.elements().remove();
		cyExisting.add(elements);
		cyExisting.style(style);
		cyExisting.layout(cyLayout).run();
	});

	return cyExisting;
};

export default renderCytoscape;
