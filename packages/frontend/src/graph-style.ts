import type { ForceGraph3DInstance } from "3d-force-graph";
import type { Core } from "cytoscape";
import type ForceGraph from "force-graph";
import type { GraphInstance, GraphLink, GraphNode } from "./graph-types.ts";
import { alphaColor } from "./style.ts";

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
