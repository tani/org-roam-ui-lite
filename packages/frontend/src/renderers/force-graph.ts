import type ForceGraph from "force-graph";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	RendererFunction,
} from "../graph-types.ts";
import { getCssVariable } from "../style.ts";

/**
 * Render or update a graph using force-graph.
 *
 * @param nodes - Graph nodes to render
 * @param edges - Graph links to render
 * @param _layout - Layout algorithm (unused)
 * @param container - Target element for rendering
 * @param existing - Existing force-graph instance to update
 * @param nodeSize - Display size for nodes
 * @param labelScale - Relative scale for labels
 * @param showLabels - Whether to display labels
 * @returns The force-graph instance used for rendering
 */
const renderForceGraph: RendererFunction = async (
	nodes: GraphNode[],
	edges: GraphLink[],
	_layout: Layout,
	container: HTMLElement,
	existing: GraphInstance | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): Promise<GraphInstance> => {
	const { default: ForceGraphCtor } = await import("force-graph");
	const radius = nodeSize / 2;
	const area = Math.PI * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: area }));
	let fg = existing as ForceGraph<GraphNode, GraphLink> | undefined;
	if (!fg) fg = new ForceGraphCtor<GraphNode, GraphLink>(container);
	const fontSize = 36 * labelScale;
	fg.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes: fgNodes, links: edges });

	if (showLabels)
		fg.nodeCanvasObject((node: GraphNode, ctx, scale) => {
			const label = String(node.label);
			const size = fontSize / scale;
			ctx.font = `${size}px ${getCssVariable("--bs-font-sans-serif")}`;
			ctx.textAlign = "center";
			ctx.textBaseline = "top";
			ctx.fillStyle = getCssVariable("--bs-body-color");
			if (typeof node.x === "number" && typeof node.y === "number")
				ctx.fillText(label, node.x, node.y + radius + 2);
		}).nodeCanvasObjectMode(() => "after");
	else fg.nodeCanvasObject(() => undefined).nodeCanvasObjectMode(() => "after");

	return fg;
};

export default renderForceGraph;
