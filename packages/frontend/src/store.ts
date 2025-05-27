import { defineStore } from "pinia";
import { ref, type VNode } from "vue";
import type { components } from "./api.d.ts";
import type { Layout, Renderer, Theme } from "./graph-types.ts";

/** Pinia store for shared UI state. */
export const useUiStore = defineStore(
  "ui",
  () => {
    const theme = ref<Theme>(
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
    const renderer = ref<Renderer>("force-graph");
    const layout = ref<Layout>("cose");
    const nodeSize = ref(10);
    const labelScale = ref(0.5);
    const showLabels = ref(true);
    const settingsOpen = ref(false);
    const detailsOpen = ref(false);
    const selected = ref<components["schemas"]["Node"] & { body?: VNode }>(
      {} as components["schemas"]["Node"] & { body?: VNode },
    );

    /** Change the current theme. */
    function setTheme(newTheme: Theme): void {
      theme.value = newTheme;
    }

    /** Select a different renderer. */
    function setRenderer(newRenderer: Renderer): void {
      renderer.value = newRenderer;
    }

    /** Update the graph layout. */
    function setLayout(newLayout: Layout): void {
      layout.value = newLayout;
    }

    /** Store the desired node size. */
    function setNodeSize(size: number): void {
      nodeSize.value = size;
    }

    /** Store the desired label scale. */
    function setLabelScale(scale: number): void {
      labelScale.value = scale;
    }

    /** Toggle label visibility. */
    function toggleLabels(value: boolean): void {
      showLabels.value = value;
    }

    /** Open the settings panel. */
    function openSettings(): void {
      settingsOpen.value = true;
    }

    /** Close the settings panel. */
    function closeSettings(): void {
      settingsOpen.value = false;
    }

    /** Open the details panel. */
    function openDetails(): void {
      detailsOpen.value = true;
    }

    /** Close the details panel. */
    function closeDetails(): void {
      detailsOpen.value = false;
    }

    return {
      theme,
      renderer,
      layout,
      nodeSize,
      labelScale,
      showLabels,
      settingsOpen,
      detailsOpen,
      selected,
      setTheme,
      setRenderer,
      setLayout,
      setNodeSize,
      setLabelScale,
      toggleLabels,
      openSettings,
      closeSettings,
      openDetails,
      closeDetails,
    };
  },
  {
    persist: {
      pick: [
        "theme",
        "renderer",
        "layout",
        "nodeSize",
        "labelScale",
        "showLabels",
      ],
    },
  },
);
