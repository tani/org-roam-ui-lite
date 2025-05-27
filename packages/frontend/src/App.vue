<template>
  <div class="vh-100 vw-100">
    <div ref="graphRef" class="h-100 w-100"></div>

    <SettingsPanel
      :open="settingsOpen"
      :themes="themes"
      :theme="theme"
      :renderers="renderers"
      :renderer="renderer"
      :layouts="layouts"
      :layout="layout"
      :node-size="nodeSize"
      :label-scale="labelScale"
      :show-labels="showLabels"
      @close="settingsOpen = false"
      @update:theme="setTheme"
      @update:renderer="setRenderer"
      @update:layout="setLayout"
      @update:node-size="onSizeChange"
      @update:label-scale="onScaleChange"
      @update:show-labels="onShowLabelsChange"
    />

    <button
      type="button"
      class="btn btn-outline-secondary position-fixed"
      style="top: 1rem; left: 1rem; z-index: 1"
      @click="toggleSettings"
    >
      <i class="bi bi-gear"></i>
    </button>

    <DetailsPanel
      :theme="theme"
      :selected="selected"
      :open="detailsOpen"
      @close="closeDetails"
      @open-node="openNodeAction"
    />

    <button
      type="button"
      class="btn btn-outline-secondary position-fixed"
      style="top: 1rem; right: 1rem; z-index: 1"
      @click="toggleDetails"
    >
      <i class="bi bi-chevron-left"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Core } from "cytoscape";
import { storeToRefs } from "pinia";
import { onMounted, ref, watch } from "vue";
import { useUiStore } from "./store.ts";
import DetailsPanel from "./components/DetailsPanel.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import { drawGraph } from "./graph.ts";
import {
  applyNodeStyle,
  highlightNeighborhood,
  resetHighlight,
} from "./graph-style.ts";
import {
  type GraphInstance,
  type Layout,
  Layouts,
  type Renderer,
  Renderers,
  type Theme,
  Themes,
} from "./graph-types.ts";
import { openNode } from "./node.ts";

void SettingsPanel;
void DetailsPanel;

const themes = Themes;
const layouts = Layouts;
const renderers = Renderers;
const graph = ref<GraphInstance>();
const graphRef = ref<HTMLElement>();
const store = useUiStore();
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
} = storeToRefs(store);

function bindGraphEvents(): void {
  if (!graph.value) return;
  if (renderer.value === "cytoscape") {
    const cy = graph.value as Core;
    cy.off("tap", "node");
    cy.on("tap", "node", ({ target }) => {
      void openNodeAction(target.id());
    });
  } else {
    interface ClickableGraph {
      onNodeClick(cb: (node: { id: string }) => void): void;
    }
    const fg = graph.value as ClickableGraph;
    fg.onNodeClick((node: { id: string }) => {
      void openNodeAction(node.id);
    });
  }
}

/**
 * Initialize the application and render the graph.
 */
async function init(): Promise<void> {
  graph.value = await drawGraph(
    renderer.value,
    layout.value,
    graphRef.value as HTMLElement,
    graph.value,
    nodeSize.value,
    labelScale.value,
    showLabels.value,
  );
  bindGraphEvents();
}

/**
 * Re-render the graph with current settings.
 */
async function refresh(): Promise<void> {
  graph.value = await drawGraph(
    renderer.value,
    layout.value,
    graphRef.value as HTMLElement,
    graph.value,
    nodeSize.value,
    labelScale.value,
    showLabels.value,
  );
  bindGraphEvents();
}

/** Change layout and refresh the graph. */
function setLayout(newLayout: Layout): void {
  store.layout = newLayout;
  void refresh();
}

/** Change renderer and refresh. */
function setRenderer(newRenderer: Renderer): void {
  store.renderer = newRenderer;
  graph.value = undefined;
}

/** Switch between themes and refresh. */
function setTheme(newTheme: Theme): void {
  store.theme = newTheme;
  void refresh();
}

/** Adjust node size in the graph. */
function onSizeChange(value: number): void {
  store.nodeSize = value;
  if (renderer.value === "cytoscape")
    applyNodeStyle(graph.value as Core, {
      width: value,
      height: value,
    });
  else void refresh();
}

/** Adjust label scale in the graph. */
function onScaleChange(value: number): void {
  store.labelScale = value;
  if (renderer.value === "cytoscape")
    applyNodeStyle(graph.value as Core, {
      "font-size": `${value}em`,
    });
  else void refresh();
}

/** Toggle label visibility. */
function onShowLabelsChange(value: boolean): void {
  store.showLabels = value;
  void refresh();
}

/** Fetch and display details for node ID. */
async function openNodeAction(nodeId: string): Promise<void> {
  const node = await openNode(theme.value, nodeId);
  selected.value = node;
  openDetails();
}

/** Show the details pane and dim other nodes. */
function openDetails(): void {
  store.detailsOpen = true;
  highlightNeighborhood(graph.value, selected.value.id);
}

/** Hide the details pane and restore styles. */
function closeDetails(): void {
  store.detailsOpen = false;
  resetHighlight(graph.value);
}

/** Toggle the details pane. */
function toggleDetails(): void {
  if (detailsOpen.value) {
    closeDetails();
  } else {
    openDetails();
  }
}

/** Toggle the settings pane. */
function toggleSettings(): void {
  if (settingsOpen.value) {
    store.settingsOpen = false;
  } else {
    store.settingsOpen = true;
  }
}

watch(renderer, () => {
  graph.value = undefined;
  void refresh();
});

onMounted(init);

watch(
  theme,
  (value) => {
    const doc = document.documentElement;
    doc.setAttribute("data-bs-theme", value.replace(/.*-/, ""));
    doc.setAttribute("data-theme", value);
  },
  { immediate: true },
);
</script>
