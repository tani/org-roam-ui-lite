import createClient from "openapi-fetch";
import type { paths } from "./api.d.ts";
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
import renderCytoscape from "./renderers/cytoscape.ts";
import renderForceGraph from "./renderers/force-graph.ts";
import renderForceGraph3D from "./renderers/force-graph-3d.ts";
import { getCssVariable, pickColor } from "./style.ts";

const api = createClient<paths>();

export { Layouts, Renderers, Themes };
export type { Layout, Renderer, Theme, GraphInstance, GraphNode, GraphLink };

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

const rendererMap: Record<Renderer, RendererFunction> = {
  cytoscape: renderCytoscape,
  "force-graph": renderForceGraph,
  "3d-force-graph": renderForceGraph3D,
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

  return rendererMap[renderer](
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
