import type { Core } from "cytoscape";
import { useCallback, useEffect, useRef } from "react";
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

interface UseGraphManagerProps {
	theme: Theme;
	renderer: Renderer;
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	showLabels: boolean;
	detailsOpen: boolean;
	selectedId: string;
}

export function useGraphManager({
	theme,
	renderer,
	layout,
	nodeSize,
	labelScale,
	showLabels,
	detailsOpen,
	selectedId,
}: UseGraphManagerProps) {
	const dispatch = useUiDispatch();
	const graphRef = useRef<HTMLDivElement>(null);
	const graphInstanceRef = useRef<GraphInstance | undefined>(undefined);

	const openNodeAction = useCallback(
		async (nodeId: string) => {
			const node = await openNode(theme, nodeId);
			dispatch({ type: "SET_STATE", payload: { selected: node } });
			dispatch({ type: "OPEN_DETAILS" });
		},
		[theme, dispatch],
	);

	const bindGraphEvents = useCallback(() => {
		const graph = graphInstanceRef.current;
		if (!graph) return;

		if (renderer === "cytoscape") {
			const cy = graph as Core;
			cy.off("tap", "node");
			cy.on("tap", "node", (evt) => {
				void openNodeAction(evt.target.id());
			});
		} else {
			interface ClickableGraph {
				onNodeClick(cb: (node: { id: string }) => void): void;
			}
			const fg = graph as ClickableGraph;
			fg.onNodeClick((node: { id: string }) => {
				void openNodeAction(node.id);
			});
		}
	}, [renderer, openNodeAction]);

	const refreshGraph = useCallback(async () => {
		if (!graphRef.current) return;
		graphInstanceRef.current = await drawGraph(
			renderer,
			layout,
			graphRef.current,
			graphInstanceRef.current,
			nodeSize,
			labelScale,
			showLabels,
		);
		bindGraphEvents();
	}, [renderer, layout, nodeSize, labelScale, showLabels, bindGraphEvents]);

	const highlightNode = useCallback((nodeId: string) => {
		highlightNeighborhood(graphInstanceRef.current, nodeId);
	}, []);

	const resetNodeHighlight = useCallback(() => {
		resetHighlight(graphInstanceRef.current);
	}, []);

	// Graph lifecycle management
	useEffect(() => {
		const graphElement = graphRef.current;
		refreshGraph();

		return () => {
			if (graphElement) {
				destroyGraph(graphInstanceRef.current, graphElement);
				graphInstanceRef.current = undefined;
			}
		};
	}, [refreshGraph]);

	// Refresh graph when settings change
	useEffect(() => {
		refreshGraph();
	}, [refreshGraph]);

	// Apply node size changes
	useEffect(() => {
		if (renderer === "cytoscape") {
			applyNodeStyle(graphInstanceRef.current as Core, {
				width: nodeSize,
				height: nodeSize,
			});
		} else {
			refreshGraph();
		}
	}, [nodeSize, renderer, refreshGraph]);

	// Apply label scale changes
	useEffect(() => {
		if (renderer === "cytoscape") {
			applyNodeStyle(graphInstanceRef.current as Core, {
				"font-size": `${labelScale}em`,
			});
		} else {
			refreshGraph();
		}
	}, [labelScale, renderer, refreshGraph]);

	// Handle node highlighting when details panel opens
	useEffect(() => {
		if (detailsOpen && selectedId) {
			highlightNode(selectedId);
		}
	}, [detailsOpen, selectedId, highlightNode]);

	return {
		graphRef,
		openNodeAction,
		highlightNode,
		resetNodeHighlight,
	};
}
