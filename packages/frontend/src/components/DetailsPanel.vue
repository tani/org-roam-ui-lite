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
import type { components } from "../api.d.ts";

defineProps<{
	open: boolean;
	selected: components["schemas"]["Node"] & { html?: string };
}>();

defineEmits<{
	(e: "close"): void;
	(e: "openNode", id: string): void;
}>();
</script>
