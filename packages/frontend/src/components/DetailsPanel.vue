<template>
  <div
    id="offcanvasDetails"
    class="offcanvas offcanvas-end responsive-wide"
    tabindex="-1"
    aria-labelledby="offcanvasDetailsLabel"
    :class="{ show: open }"
  >
    <div class="offcanvas-header">
      <h4 id="offcanvasDetailsLabel" class="offcanvas-title">
        <i class="bi bi-file-earmark-text"></i>
        <span>{{ selected.title ?? "Click a node to view details" }}</span>
      </h4>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="$emit('close')"
      ></button>
    </div>
    <div class="offcanvas-body">
      <div
        @click="_onRenderedClick"
        @mouseover="_onRenderedMouseOver"
        @mouseout="_onRenderedMouseOut"
      >
        <component :is="selected.body" />
      </div>
      <PreviewPopover
        v-if="preview"
        ref="previewComponent"
        :content="preview.body"
        :x="preview.x"
        :y="preview.y"
        @leave="hidePreview"
      />
      <div v-show="selected.backlinks?.length" class="mt-3">
        <h5><i class="bi bi-link-45deg"></i>Backlinks</h5>
        <ul class="list-unstyled">
          <li v-for="b in selected.backlinks" :key="b.source">
            <button
              class="btn btn-sm btn-link p-0"
              @click="$emit('openNode', b.source)"
            >
              <i class="bi bi-chevron-right"></i>
              <span>{{ b.title }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type VNode, watch } from "vue";
import type { components } from "../api/api.d.ts";
import type { Theme } from "../graph/graph-types.ts";
import { openNode } from "../graph/node.ts";
import PreviewPopover from "./PreviewPopover.vue";

void PreviewPopover;

const props = defineProps<{
  open: boolean;
  selected: components["schemas"]["Node"] & { body?: VNode };
  theme: Theme;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "openNode", id: string): void;
}>();

const preview = ref<{ body: VNode; x: number; y: number }>();
const previewComponent = ref<{ el: HTMLElement } | null>(null);
const previewAnchor = ref<HTMLAnchorElement>();

/** Handle user interactions on the rendered HTML. */
function _onRenderedClick(ev: MouseEvent): void {
  const a = (ev.target as HTMLElement).closest("a");
  if (!a || !a.href.startsWith("id:")) return;
  ev.preventDefault();
  emit("openNode", a.href.replace("id:", ""));
}

function _onRenderedMouseOver(ev: MouseEvent): void {
  const anchor = (ev.target as HTMLElement).closest("a");
  if (!anchor || !anchor.href.startsWith("id:")) return;
  if (previewAnchor.value === anchor) return;
  void showPreview(anchor as HTMLAnchorElement, ev);
}

function _onRenderedMouseOut(ev: MouseEvent): void {
  if (!previewAnchor.value) return;
  const related = ev.relatedTarget as Node | null;
  const previewEl = previewComponent.value?.el;
  if (
    related &&
    (previewAnchor.value.contains(related) || previewEl?.contains(related))
  )
    return;
  hidePreview();
}

/**
 * Display a preview for the hovered link.
 *
 * @param anchor - Anchor element being hovered
 * @param ev - Mouse event
 */
async function showPreview(
  anchor: HTMLAnchorElement,
  ev: MouseEvent,
): Promise<void> {
  previewAnchor.value = anchor;
  const node = await openNode(props.theme, anchor.href.replace("id:", ""));
  if (previewAnchor.value !== anchor) return;
  preview.value = { body: node.body, x: ev.clientX, y: ev.clientY };
}

/** Remove the preview element if present. */
function hidePreview(): void {
  preview.value = undefined;
  previewAnchor.value = undefined;
}

watch(
  () => props.open,
  (value) => {
    if (!value) hidePreview();
  },
);

watch(
  () => props.selected,
  () => {
    hidePreview();
  },
);
</script>

<style scoped>
.offcanvas.offcanvas-end.responsive-wide {
  width: 90vw;
}

@media (min-width: 576px) {
  .offcanvas.offcanvas-end.responsive-wide {
    width: 85vw;
  }
}

@media (min-width: 768px) {
  .offcanvas.offcanvas-end.responsive-wide {
    width: 70vw;
  }
}

@media (min-width: 992px) {
  .offcanvas.offcanvas-end.responsive-wide {
    width: 60vw;
  }
}

@media (min-width: 1200px) {
  .offcanvas.offcanvas-end.responsive-wide {
    width: 50vw;
    max-width: 800px;
  }
}
</style>
