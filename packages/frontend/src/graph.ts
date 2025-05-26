import type { ForceGraph3DInstance } from "3d-force-graph";
import type { Core } from "cytoscape";
import type ForceGraph from "force-graph";
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
import { alphaColor, getCssVariable, pickColor } from "./style.ts";

const api = createClient<paths>();

export { Layouts, Renderers, Themes };
export type { Layout, Renderer, Theme, GraphInstance, GraphNode, GraphLink };

/**
 * Highlight the neighborhood of the given node while dimming others.
 *
 * @param graph - Graph instance
 * @param focusId - Node id to highlight
 */
export function highlightNeighborhood(
  graph: GraphInstance | undefined,
  focusId: string,
): void {
  if (!graph) return;

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

  const fg = graph as
    | ForceGraph<GraphNode, GraphLink>
    | ForceGraph3DInstance<GraphNode, GraphLink>;
  const data = fg.graphData();
  const neighbors = new Set<string>([focusId]);
  data.links.forEach((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    if (String(s) === focusId) neighbors.add(String(t));
    if (String(t) === focusId) neighbors.add(String(s));
  });
  fg.nodeColor((node: GraphNode) =>
    neighbors.has(String(node.id)) ? node.color : alphaColor(node.color, 0.15),
  );
  fg.linkColor((link: GraphLink) => {
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    const related = neighbors.has(String(s)) && neighbors.has(String(t));
    return related ? link.color : alphaColor(link.color, 0.05);
  });
}

/**
 * Apply style properties to all elements in the graph.
 *
 * @param graph - Cytoscape instance
 * @param style - CSS properties to apply
 */
export function applyElementsStyle(
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
export function applyNodeStyle(
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
export function resetHighlight(graph: GraphInstance | undefined): void {
  if (!graph) return;
  if (typeof (graph as Core).elements === "function") {
    applyElementsStyle(graph as Core, { opacity: 1 });
    return;
  }
  const fg = graph as
    | ForceGraph<GraphNode, GraphLink>
    | ForceGraph3DInstance<GraphNode, GraphLink>;
  fg.nodeColor("color");
  fg.linkColor("color");
}

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
