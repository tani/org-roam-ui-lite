import { defineStore } from "pinia";
import { ref, watch, type VNode } from "vue";
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

    function toggleSettings(): void {
      settingsOpen.value = !settingsOpen.value;
    }

    function openDetails(): void {
      detailsOpen.value = true;
    }

    function closeDetails(): void {
      detailsOpen.value = false;
    }

    function toggleDetails(): void {
      detailsOpen.value = !detailsOpen.value;
    }

    watch(
      theme,
      (value) => {
        const doc = document.documentElement;
        doc.setAttribute("data-bs-theme", value.replace(/.*-/, ""));
        doc.setAttribute("data-theme", value);
      },
      { immediate: true },
    );

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
      toggleSettings,
      openDetails,
      closeDetails,
      toggleDetails,
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
