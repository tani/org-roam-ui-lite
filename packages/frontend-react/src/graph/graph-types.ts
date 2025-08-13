import type { ForceGraph3DInstance } from "3d-force-graph";
import type { Core } from "cytoscape";
import type ForceGraph from "force-graph";
import type { LinkObject, NodeObject } from "force-graph";

export const Layouts = [
  "cose",
  "grid",
  "circle",
  "concentric",
  "random",
  "breadthfirst",
] as const;

export type Layout = (typeof Layouts)[number];

export const Themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "nord-dark", label: "Nord Dark" },
  { value: "gruvbox-dark", label: "Gruvbox Dark" },
  { value: "dracula-dark", label: "Dracula Dark" },
] as const;

export type Theme = (typeof Themes)[number]["value"];

export const Renderers = [
  { value: "cytoscape", label: "Cytoscape" },
  { value: "force-graph", label: "Force Graph" },
  { value: "3d-force-graph", label: "3D Force Graph" },
] as const;

export type Renderer = (typeof Renderers)[number]["value"];

export interface GraphNode extends NodeObject {
  id: string;
  label: string;
  color: string;
}

export interface GraphLink extends LinkObject<GraphNode> {
  color: string;
}

export type GraphInstance =
  | Core
  | ForceGraph<GraphNode, GraphLink>
  | ForceGraph3DInstance<GraphNode, GraphLink>;

export type RendererFunction = (
  nodes: GraphNode[],
  edges: GraphLink[],
  layout: Layout,
  container: HTMLElement,
  existing: GraphInstance | undefined,
  nodeSize: number,
  labelScale: number,
  showLabels: boolean,
) => GraphInstance;
