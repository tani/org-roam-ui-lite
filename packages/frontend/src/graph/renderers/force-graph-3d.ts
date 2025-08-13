import type { ForceGraph3DInstance } from "3d-force-graph";
import ForceGraph3D from "3d-force-graph";
import { getCssVariable } from "../../utils/style.ts";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	RendererFunction,
} from "../graph-types.ts";

/**
 * Render or update a graph using 3d-force-graph.
 *
 * @param nodes - Graph nodes to render
 * @param edges - Graph links to render
 * @param _layout - Layout algorithm (unused)
 * @param container - Target element for rendering
 * @param existing - Existing 3d-force-graph instance to update
 * @param nodeSize - Display size for nodes
 * @returns The 3d-force-graph instance used for rendering
 */
const renderForceGraph3D: RendererFunction = (
	nodes: GraphNode[],
	edges: GraphLink[],
	_layout: Layout,
	container: HTMLElement,
	existing: GraphInstance | undefined,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): GraphInstance => {
	void labelScale;
	void showLabels;
	const radius = nodeSize / 2;
	const volume = (4 / 3) * Math.PI * radius * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: volume }));
	let fg = existing as ForceGraph3DInstance<GraphNode, GraphLink> | undefined;
	if (!fg) {
		fg = new ForceGraph3D(container) as unknown as ForceGraph3DInstance<
			GraphNode,
			GraphLink
		>;
	}
	fg.backgroundColor(getCssVariable("--bs-body-bg"));
	fg.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes: fgNodes, links: edges });

	return fg as unknown as GraphInstance;
};

export default renderForceGraph3D;
