import { useEffect, useRef, useCallback } from "react";
import type { Core } from "cytoscape";
import { useUiState, useUiDispatch } from "./store/hooks.ts";
import { DetailsPanel } from "./components/DetailsPanel.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { drawGraph, destroyGraph } from "./graph/graph.ts";
import {
  applyNodeStyle,
  highlightNeighborhood,
  resetHighlight,
} from "./graph/graph-style.ts";
import {
  type GraphInstance,
  Layouts,
  Renderers,
  Themes,
} from "./graph/graph-types.ts";
import { openNode } from "./graph/node.ts";

function App() {
  const state = useUiState();
  const dispatch = useUiDispatch();
  const {
    theme,
    renderer,
    layout,
    nodeSize,
    labelScale,
    showLabels,
    settingsOpen,
    detailsOpen,
    selected,
  } = state;

  const graphRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<GraphInstance | undefined>(undefined);

  const openNodeAction = useCallback(async (nodeId: string) => {
    const node = await openNode(theme, nodeId);
    dispatch({ type: "SET_STATE", payload: { selected: node } });
    dispatch({ type: "OPEN_DETAILS" });
  }, [theme, dispatch]);

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
      showLabels
    );
    bindGraphEvents();
  }, [renderer, layout, nodeSize, labelScale, showLabels, bindGraphEvents]);

  const closeDetails = () => {
    dispatch({ type: "CLOSE_DETAILS" });
    resetHighlight(graphInstanceRef.current);
  };

  const toggleDetails = () => {
    if (detailsOpen) {
      closeDetails();
    } else {
      dispatch({ type: "OPEN_DETAILS" });
      if (selected.id) {
        highlightNeighborhood(graphInstanceRef.current, selected.id);
      }
    }
  };

  useEffect(() => {
    const graphElement = graphRef.current;
    refreshGraph();

    return () => {
      if (graphElement) {
        destroyGraph(graphInstanceRef.current, graphElement);
        graphInstanceRef.current = undefined;
      }
    };
  }, [renderer, refreshGraph]);

  useEffect(() => {
    refreshGraph();
  }, [theme, showLabels, layout, refreshGraph]);

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

  useEffect(() => {
    if (renderer === "cytoscape") {
      applyNodeStyle(graphInstanceRef.current as Core, {
        "font-size": `${labelScale}em`,
      });
    } else {
      refreshGraph();
    }
  }, [labelScale, renderer, refreshGraph]);

  useEffect(() => {
    if (detailsOpen && selected.id) {
        highlightNeighborhood(graphInstanceRef.current, selected.id);
    }
  }, [detailsOpen, selected.id])

  return (
    <div className="vh-100 vw-100">
      <div ref={graphRef} className="h-100 w-100" />

      <SettingsPanel
        open={settingsOpen}
        themes={Themes}
        renderers={Renderers}
        layouts={Layouts}
        theme={theme}
        renderer={renderer}
        layout={layout}
        nodeSize={nodeSize}
        labelScale={labelScale}
        showLabels={showLabels}
        onThemeChange={(t) => dispatch({ type: "SET_STATE", payload: { theme: t } })}
        onRendererChange={(r) => dispatch({ type: "SET_STATE", payload: { renderer: r } })}
        onLayoutChange={(l) => dispatch({ type: "SET_STATE", payload: { layout: l } })}
        onNodeSizeChange={(s) => dispatch({ type: "SET_STATE", payload: { nodeSize: s } })}
        onLabelScaleChange={(s) => dispatch({ type: "SET_STATE", payload: { labelScale: s } })}
        onShowLabelsChange={(s) => dispatch({ type: "SET_STATE", payload: { showLabels: s } })}
        onClose={() => dispatch({ type: "TOGGLE_SETTINGS" })}
      />

      <button
        type="button"
        className="btn btn-outline-secondary position-fixed"
        style={{ top: "1rem", left: "1rem", zIndex: 1 }}
        onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
      >
        <i className="bi bi-gear"></i>
      </button>

      <DetailsPanel
        theme={theme}
        selected={selected}
        open={detailsOpen}
        onClose={closeDetails}
        onOpenNode={openNodeAction}
      />

      <button
        type="button"
        className="btn btn-outline-secondary position-fixed"
        style={{ top: "1rem", right: "1rem", zIndex: 1 }}
        onClick={toggleDetails}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
    </div>
  );
}

export default App;
