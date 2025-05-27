import { defineStore, type PiniaPluginContext } from "pinia";
import { watch, type VNode } from "vue";
import type { components } from "../api/api.d.ts";
import type { Layout, Renderer, Theme } from "../graph/graph-types.ts";

/** Pinia store for shared UI state. */
export interface UiState {
  theme: Theme;
  renderer: Renderer;
  layout: Layout;
  nodeSize: number;
  labelScale: number;
  showLabels: boolean;
  settingsOpen: boolean;
  detailsOpen: boolean;
  selected: components["schemas"]["Node"] & { body?: VNode };
}

export const useUiStore = defineStore("ui", {
  state: (): UiState => ({
    theme: matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    renderer: "force-graph",
    layout: "cose",
    nodeSize: 10,
    labelScale: 0.5,
    showLabels: true,
    settingsOpen: false,
    detailsOpen: false,
    selected: {} as components["schemas"]["Node"] & { body?: VNode },
  }),
  actions: {
    toggleSettings(): void {
      this.settingsOpen = !this.settingsOpen;
    },
    openDetails(): void {
      this.detailsOpen = true;
    },
    closeDetails(): void {
      this.detailsOpen = false;
    },
    toggleDetails(): void {
      this.detailsOpen = !this.detailsOpen;
    },
  },
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
});

export function uiStorePlugin({ store }: PiniaPluginContext): void {
  if (store.$id !== "ui") return;
  const ui = store as ReturnType<typeof useUiStore>;
  watch(
    () => ui.theme,
    (value) => {
      const doc = document.documentElement;
      doc.setAttribute("data-bs-theme", value.replace(/.*-/, ""));
      doc.setAttribute("data-theme", value);
    },
    { immediate: true },
  );
}
