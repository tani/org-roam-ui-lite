<template>
  <div class="vh-100 vw-100">
    <div ref="graphRef" class="h-100 w-100"></div>

    <SettingsPanel
      v-model:theme="theme"
      v-model:renderer="renderer"
      v-model:layout="layout"
      v-model:node-size="nodeSize"
      v-model:label-scale="labelScale"
      v-model:show-labels="showLabels"
      :open="settingsOpen"
      :themes="themes"
      :renderers="renderers"
      :layouts="layouts"
      @update:layout="setLayout"
      @close="store.toggleSettings()"
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
import { useUiStore } from "./store/ui.ts";
import DetailsPanel from "./components/DetailsPanel.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import { drawGraph } from "./graph/graph.ts";
import {
  applyNodeStyle,
  highlightNeighborhood,
  resetHighlight,
} from "./graph/graph-style.ts";
import {
  type GraphInstance,
  type Layout,
  Layouts,
  Renderers,
  Themes,
} from "./graph/graph-types.ts";
import { openNode } from "./graph/node.ts";

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

/** Fetch and display details for node ID. */
async function openNodeAction(nodeId: string): Promise<void> {
  const node = await openNode(theme.value, nodeId);
  selected.value = node;
  openDetails();
}

/** Show the details pane and dim other nodes. */
function openDetails(): void {
  store.openDetails();
  highlightNeighborhood(graph.value, selected.value.id);
}

/** Hide the details pane and restore styles. */
function closeDetails(): void {
  store.closeDetails();
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
  store.toggleSettings();
}

watch(renderer, () => {
  graph.value = undefined;
  void refresh();
});
watch(theme, () => {
  void refresh();
});
watch(nodeSize, (value) => {
  if (renderer.value === "cytoscape")
    applyNodeStyle(graph.value as Core, {
      width: value,
      height: value,
    });
  else void refresh();
});

watch(labelScale, (value) => {
  if (renderer.value === "cytoscape")
    applyNodeStyle(graph.value as Core, {
      "font-size": `${value}em`,
    });
  else void refresh();
});

watch(showLabels, () => {
  void refresh();
});
onMounted(init);
</script>
