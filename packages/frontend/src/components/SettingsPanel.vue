<template>
  <div
    id="offcanvasSettings"
    class="offcanvas offcanvas-start"
    tabindex="-1"
    aria-labelledby="offcanvasSettingsLabel"
    :class="{ show: open }"
  >
    <div class="offcanvas-header">
      <h4 id="offcanvasSettingsLabel" class="offcanvas-title">
        <i class="bi bi-gear-fill"></i>Settings
      </h4>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="$emit('close')"
      ></button>
    </div>
    <div class="offcanvas-body">
      <div class="mb-4">
        <h5>Theme</h5>
        <select v-model="themeModel" class="form-select">
          <option v-for="t in themes" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
      </div>
      <div class="mb-4">
        <h5>Renderer</h5>
        <select v-model="rendererModel" class="form-select">
          <option v-for="r in renderers" :key="r.value" :value="r.value">
            {{ r.label }}
          </option>
        </select>
      </div>
      <div v-show="rendererModel === 'cytoscape'" class="mb-4">
        <h5>Layout</h5>
        <select v-model="layoutModel" class="form-select">
          <option v-for="l in layouts" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
      <div class="mb-4">
        <h5>Node size</h5>
        <input v-model.number="nodeSizeModel" type="range" min="5" max="30" />
        <div>
          Current: <span>{{ nodeSizeModel }}</span
          >px
        </div>
      </div>
      <div v-show="rendererModel !== '3d-force-graph'" class="mb-4">
        <h5>Font size</h5>
        <input
          v-model.number="labelScaleModel"
          type="range"
          min="0.3"
          max="1.5"
          step="0.1"
        />
        <div>
          Current: <span>{{ labelScaleModel.toFixed(1) }}</span
          >em
        </div>
      </div>
      <div v-show="rendererModel !== '3d-force-graph'" class="mb-4">
        <h5>Show labels</h5>
        <div class="form-check form-switch">
          <input
            id="toggleLabels"
            v-model="showLabelsModel"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="toggleLabels"
            >Display labels</label
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Layout, Renderer, Theme } from "../graph-types.ts";

const props = defineProps<{
  open: boolean;
  themes: { value: Theme; label: string }[];
  renderers: { value: Renderer; label: string }[];
  layouts: Layout[];
  theme: Theme;
  renderer: Renderer;
  layout: Layout;
  nodeSize: number;
  labelScale: number;
  showLabels: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:theme", value: Theme): void;
  (e: "update:renderer", value: Renderer): void;
  (e: "update:layout", value: Layout): void;
  (e: "update:nodeSize", value: number): void;
  (e: "update:labelScale", value: number): void;
  (e: "update:showLabels", value: boolean): void;
}>();

const themeModel = computed({
  get: () => props.theme,
  set: (value: Theme) => emit("update:theme", value),
});

const rendererModel = computed({
  get: () => props.renderer,
  set: (value: Renderer) => emit("update:renderer", value),
});

const layoutModel = computed({
  get: () => props.layout,
  set: (value: Layout) => emit("update:layout", value),
});

const nodeSizeModel = computed({
  get: () => props.nodeSize,
  set: (value: number) => emit("update:nodeSize", value),
});

const labelScaleModel = computed({
  get: () => props.labelScale,
  set: (value: number) => emit("update:labelScale", value),
});

const showLabelsModel = computed({
  get: () => props.showLabels,
  set: (value: boolean) => emit("update:showLabels", value),
});
</script>
