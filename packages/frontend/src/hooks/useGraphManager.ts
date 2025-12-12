import type { Core } from "cytoscape";
import { useCallback, useRef } from "react";
import { destroyGraph, drawGraph } from "../graph/graph.ts";
import {
	applyNodeStyle,
	highlightNeighborhood,
	resetHighlight,
} from "../graph/graph-style.ts";
import type {
	GraphInstance,
	Layout,
	Renderer,
	Theme,
} from "../graph/graph-types.ts";
import { openNode } from "../graph/node.ts";
import { useUiDispatch } from "../store/hooks.ts";

interface GraphConfig {
	renderer: Renderer;
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	showLabels: boolean;
}

interface UseGraphManagerProps extends GraphConfig {
	theme: Theme;
}

export function useGraphManager(initialConfig: UseGraphManagerProps) {
	const dispatch = useUiDispatch();
	const graphElementRef = useRef<HTMLDivElement | null>(null);
	const graphInstanceRef = useRef<GraphInstance | undefined>(undefined);
	const configRef = useRef<GraphConfig>({
		renderer: initialConfig.renderer,
		layout: initialConfig.layout,
		nodeSize: initialConfig.nodeSize,
		labelScale: initialConfig.labelScale,
		showLabels: initialConfig.showLabels,
	});
	const themeRef = useRef<Theme>(initialConfig.theme);

	const highlightNode = useCallback((nodeId: string) => {
		highlightNeighborhood(graphInstanceRef.current, nodeId);
	}, []);

	const resetNodeHighlight = useCallback(() => {
		resetHighlight(graphInstanceRef.current);
	}, []);

	const openNodeAction = useCallback(
		async (nodeId: string) => {
			const node = await openNode(themeRef.current, nodeId);
			dispatch({ type: "SET_STATE", payload: { selected: node } });
			dispatch({ type: "OPEN_DETAILS" });
			highlightNode(nodeId);
		},
		[dispatch, highlightNode],
	);

	const bindGraphEvents = useCallback(() => {
		const graph = graphInstanceRef.current;
		if (!graph) return;
		if (configRef.current.renderer === "cytoscape") {
			const cy = graph as Core;
			if (typeof cy.off === "function" && typeof cy.on === "function") {
				cy.off("tap", "node");
				cy.on("tap", "node", (evt) => {
					void openNodeAction(evt.target.id());
				});
			}
			return;
		}

		interface ClickableGraph {
			onNodeClick(cb: (node: { id: string }) => void): void;
		}
		const fg = graph as ClickableGraph;
		if (typeof fg.onNodeClick === "function") {
			fg.onNodeClick((node: { id: string }) => {
				void openNodeAction(node.id);
			});
		}
	}, [openNodeAction]);

	const refreshGraph = useCallback(async () => {
		const container = graphElementRef.current;
		if (!container) return;
		graphInstanceRef.current = await drawGraph(
			configRef.current.renderer,
			configRef.current.layout,
			container,
			graphInstanceRef.current,
			configRef.current.nodeSize,
			configRef.current.labelScale,
			configRef.current.showLabels,
		);
		bindGraphEvents();
	}, [bindGraphEvents]);

	const graphRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (node) {
				graphElementRef.current = node;
				void refreshGraph();
				return;
			}

			if (graphElementRef.current) {
				destroyGraph(graphInstanceRef.current, graphElementRef.current);
			}
			graphInstanceRef.current = undefined;
			graphElementRef.current = null;
		},
		[refreshGraph],
	);

	const setTheme = useCallback((theme: Theme) => {
		themeRef.current = theme;
	}, []);

	const setRenderer = useCallback(
		async (renderer: Renderer) => {
			configRef.current = {
				...configRef.current,
				renderer,
			};
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setLayout = useCallback(
		async (layout: Layout) => {
			configRef.current = { ...configRef.current, layout };
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setNodeSize = useCallback(
		async (nodeSize: number) => {
			configRef.current = { ...configRef.current, nodeSize };
			if (configRef.current.renderer === "cytoscape") {
				applyNodeStyle(graphInstanceRef.current as Core, {
					width: nodeSize,
					height: nodeSize,
				});
				return;
			}
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setLabelScale = useCallback(
		async (labelScale: number) => {
			configRef.current = { ...configRef.current, labelScale };
			if (configRef.current.renderer === "cytoscape") {
				applyNodeStyle(graphInstanceRef.current as Core, {
					"font-size": `${labelScale}em`,
				});
				return;
			}
			await refreshGraph();
		},
		[refreshGraph],
	);

	const setShowLabels = useCallback(
		async (showLabels: boolean) => {
			configRef.current = { ...configRef.current, showLabels };
			await refreshGraph();
		},
		[refreshGraph],
	);

	return {
		graphRef,
		openNodeAction,
		highlightNode,
		resetNodeHighlight,
		setTheme,
		setRenderer,
		setLayout,
		setNodeSize,
		setLabelScale,
		setShowLabels,
		refreshGraph,
	};
}
