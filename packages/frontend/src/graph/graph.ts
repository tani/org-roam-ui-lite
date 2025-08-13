import createClient from "openapi-fetch";
import type { paths } from "../api/api.d.ts";
import type {
  GraphInstance,
  GraphLink,
  GraphNode,
  Layout,
  Renderer,
  RendererFunction,
  Theme,
} from "./graph-types.ts";
import { Layouts, Renderers, Themes } from "./graph-types.ts";
import { getCssVariable, pickColor } from "../utils/style.ts";

const api = createClient<paths>();

export { Layouts, Renderers, Themes };
export type { GraphInstance, GraphLink, GraphNode, Layout, Renderer, Theme };

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

const rendererMap: Record<
  Renderer,
  () => Promise<{ default: RendererFunction }>
> = {
  cytoscape: () => import("./renderers/cytoscape.ts"),
  "force-graph": () => import("./renderers/force-graph.ts"),
  "3d-force-graph": () => import("./renderers/force-graph-3d.ts"),
};

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
  const rendererMod = await rendererMap[renderer]();

  return rendererMod.default(
    nodes,
    edges,
    layoutName,
    container,
    existingGraph,
    nodeSize,
    labelScale,
    showLabels,
  );
}

/**
 * Stop and remove the given graph instance.
 *
 * @param instance - Graph instance to destroy
 * @param container - Container element holding the graph
 */
export function destroyGraph(
  instance: GraphInstance | undefined,
  container: HTMLElement,
): void {
  if (!instance) return;
  if (typeof (instance as { destroy?: () => void }).destroy === "function") {
    (instance as unknown as { destroy: () => void }).destroy();
  } else if (
    typeof (instance as { pauseAnimation?: () => void }).pauseAnimation ===
      "function"
  ) {
    (instance as unknown as { pauseAnimation: () => void }).pauseAnimation();
  }
  container.replaceChildren();
}
