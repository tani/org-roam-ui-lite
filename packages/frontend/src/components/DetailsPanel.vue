<template>
  <div
    class="offcanvas offcanvas-end responsive-wide"
    tabindex="-1"
    id="offcanvasDetails"
    aria-labelledby="offcanvasDetailsLabel"
    :class="{ show: open }"
  >
    <div class="offcanvas-header">
      <h4 class="offcanvas-title" id="offcanvasDetailsLabel">
        <i class="bi bi-file-earmark-text"></i>
        <span>{{ selected.title ?? 'Click a node to view details' }}</span>
      </h4>
      <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body">
      <div v-html="selected.html ?? ''" ref="rendered"></div>
      <div v-show="selected.backlinks?.length" class="mt-3">
        <h5><i class="bi bi-link-45deg"></i>Backlinks</h5>
        <ul class="list-unstyled">
          <li v-for="b in selected.backlinks" :key="b.source">
            <button class="btn btn-sm btn-link p-0" @click="$emit('openNode', b.source)">
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
import { onMounted, ref, watch } from "vue";
import type { components } from "../api.d.ts";
import type { Theme } from "../graph-types.ts";
import { openNode } from "../node.ts";

const props = defineProps<{
	open: boolean;
	selected: components["schemas"]["Node"] & { html?: string };
	theme: Theme;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "openNode", id: string): void;
}>();

const rendered = ref<HTMLElement>();
const previewEl = ref<HTMLElement>();
const previewAnchor = ref<HTMLAnchorElement>();

/** Attach click and hover events to the rendered HTML. */
function attachEvents(): void {
	rendered.value?.addEventListener("click", (ev) => {
		const a = (ev.target as HTMLElement).closest("a");
		if (!a || !a.href.startsWith("id:")) return;
		ev.preventDefault();
		emit("openNode", a.href.replace("id:", ""));
	});
	rendered.value?.addEventListener("mouseover", (ev) => {
		const anchor = (ev.target as HTMLElement).closest("a");
		if (!anchor || !anchor.href.startsWith("id:")) return;
		if (previewAnchor.value === anchor) return;
		void showPreview(anchor as HTMLAnchorElement, ev);
	});
	rendered.value?.addEventListener("mouseout", (ev) => {
		if (!previewAnchor.value) return;
		const related = ev.relatedTarget as Node | null;
		if (
			related &&
			(previewAnchor.value.contains(related) ||
				previewEl.value?.contains(related))
		)
			return;
		hidePreview();
	});
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
	const div = document.createElement("div");
	div.className = "card position-fixed p-2 preview-popover responsive-wide";
	div.innerHTML = node.html;
	div.style.visibility = "hidden";
	document.body.appendChild(div);
	const offset = 20;
	div.style.left = `${ev.clientX - div.offsetWidth - offset}px`;
	div.style.top = `${ev.clientY + offset}px`;
	div.style.visibility = "visible";
	previewEl.value = div;
	div.addEventListener("mouseleave", () => {
		hidePreview();
	});
}

/** Remove the preview element if present. */
function hidePreview(): void {
	previewEl.value?.remove();
	previewEl.value = undefined;
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

onMounted(() => {
	attachEvents();
});
</script>
