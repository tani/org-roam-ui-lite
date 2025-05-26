<template>
  <div
    class="offcanvas offcanvas-start"
    tabindex="-1"
    id="offcanvasSettings"
    aria-labelledby="offcanvasSettingsLabel"
    :class="{ show: open }"
  >
    <div class="offcanvas-header">
      <h4 class="offcanvas-title" id="offcanvasSettingsLabel">
        <i class="bi bi-gear-fill"></i>Settings
      </h4>
      <button
        type="button"
        class="btn-close"
        @click="$emit('close')"
        aria-label="Close"
      ></button>
    </div>
    <div class="offcanvas-body">
      <div class="mb-4">
        <h5>Theme</h5>
        <select class="form-select" :value="theme" @change="onThemeChange">
          <option v-for="t in themes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="mb-4">
        <h5>Renderer</h5>
        <select class="form-select" :value="renderer" @change="onRendererChange">
          <option v-for="r in renderers" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <div class="mb-4" v-show="renderer === 'cytoscape'">
        <h5>Layout</h5>
        <select class="form-select" :value="layout" @change="onLayoutChange">
          <option v-for="l in layouts" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
      <div class="mb-4">
        <h5>Node size</h5>
        <input type="range" min="5" max="30" :value="nodeSize" @input="onNodeSize" />
        <div>
          Current: <span>{{ nodeSize }}</span>px
        </div>
      </div>
      <div class="mb-4" v-show="renderer !== '3d-force-graph'">
        <h5>Font size</h5>
        <input type="range" min="0.3" max="1.5" step="0.1" :value="labelScale" @input="onLabelScale" />
        <div>
          Current: <span>{{ labelScale.toFixed(1) }}</span>em
        </div>
      </div>
      <div class="mb-4" v-show="renderer !== '3d-force-graph'">
        <h5>Show labels</h5>
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="toggleLabels"
            :checked="showLabels"
            @change="onShowLabels"
          />
          <label class="form-check-label" for="toggleLabels">Display labels</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Layout, Renderer, Theme } from "../graph-types.ts";

defineProps<{
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

/** Emit theme update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onThemeChange(ev: Event): void {
	emit("update:theme", (ev.target as HTMLSelectElement).value as Theme);
}

/** Emit renderer update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onRendererChange(ev: Event): void {
	emit("update:renderer", (ev.target as HTMLSelectElement).value as Renderer);
}

/** Emit layout update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onLayoutChange(ev: Event): void {
	emit("update:layout", (ev.target as HTMLSelectElement).value as Layout);
}

/** Emit node size update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onNodeSize(ev: Event): void {
	emit("update:nodeSize", Number((ev.target as HTMLInputElement).value));
}

/** Emit label scale update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onLabelScale(ev: Event): void {
	emit("update:labelScale", Number((ev.target as HTMLInputElement).value));
}

/** Emit show labels update event. */
// biome-ignore lint/correctness/noUnusedVariables: used in template
function onShowLabels(ev: Event): void {
	emit("update:showLabels", (ev.target as HTMLInputElement).checked);
}
</script>
