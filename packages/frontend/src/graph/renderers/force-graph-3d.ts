import type { ForceGraph3DInstance } from "3d-force-graph";
import ForceGraph3D from "3d-force-graph";
import type { LinkObject, NodeObject } from "force-graph";
import { getCssVariable } from "../../utils/style.ts";
import type {
	GraphInstance,
	GraphLink,
	GraphNode,
	Layout,
	RendererFunction,
} from "../graph-types.ts";

/**
 * Type guard to check if a GraphInstance is a ForceGraph3DInstance
 */
function isForceGraph3DInstance(
	instance: GraphInstance | Record<string, unknown>,
): instance is ForceGraph3DInstance<NodeObject, LinkObject<NodeObject>> {
	if (!instance) return false;

	// Check if instance has the required methods for ForceGraph3D
	const obj = instance as {
		graphData?: unknown;
		backgroundColor?: unknown;
		nodeId?: unknown;
	};

	return (
		typeof obj.graphData === "function" &&
		typeof obj.backgroundColor === "function" &&
		typeof obj.nodeId === "function"
	);
}

/**
 * Safely create a ForceGraph3D instance with proper typing
 * Returns the base instance which works with NodeObject/LinkObject types
 */
function createForceGraph3DInstance(
	container: HTMLElement,
): ForceGraph3DInstance<NodeObject, LinkObject<NodeObject>> {
	return new ForceGraph3D(container);
}

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
	existing: GraphInstance | undefined | Record<string, unknown>,
	nodeSize: number,
	labelScale: number,
	showLabels: boolean,
): GraphInstance => {
	void labelScale;
	void showLabels;

	let fg: ForceGraph3DInstance<NodeObject, LinkObject<NodeObject>>;
	if (existing && isForceGraph3DInstance(existing)) {
		fg = existing;
	} else {
		fg = createForceGraph3DInstance(container);
	}

	// Configure with custom node size
	const radius = nodeSize / 2;
	const volume = (4 / 3) * Math.PI * radius * radius * radius;
	const fgNodes = nodes.map((n) => ({ ...n, val: volume }));

	fg.backgroundColor(getCssVariable("--bs-body-bg"));
	fg.nodeId("id")
		.nodeLabel("label")
		.nodeColor("color")
		.nodeVal("val")
		.nodeRelSize(1)
		.linkColor("color")
		.linkWidth(2)
		.graphData({ nodes: fgNodes, links: edges });

	return fg;
};

export default renderForceGraph3D;
