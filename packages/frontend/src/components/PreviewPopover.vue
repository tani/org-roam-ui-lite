<template>
  <Teleport to="body">
    <div
      ref="el"
      class="card position-fixed p-2 preview-popover responsive-wide"
      style="visibility: hidden"
      @mouseleave="$emit('leave')"
    >
      <component :is="content" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, type VNode } from "vue";

const props = defineProps<{ content: VNode; x: number; y: number }>();

type Emits = (e: "leave") => void;
defineEmits<Emits>();

const el = ref<HTMLElement>();

onMounted(() => {
  nextTick(() => {
    const offset = 20;
    const div = el.value as HTMLElement;
    div.style.left = `${props.x - div.offsetWidth - offset}px`;
    div.style.top = `${props.y + offset}px`;
    div.style.visibility = "visible";
  });
});
</script>

<style scoped>
.preview-popover {
position: fixed;
z-index: 1070;
max-height: 75vh;
overflow: auto;
}

.preview-popover.responsive-wide {
width: 90vw;
}

@media (min-width: 576px) {
.preview-popover.responsive-wide {
width: min(calc(100% - 85vw), 85vw);
}
}

@media (min-width: 768px) {
.preview-popover.responsive-wide {
width: min(calc(100% - 70vw), 70vw);
}
}

@media (min-width: 992px) {
.preview-popover.responsive-wide {
width: min(calc(100% - 60vw), 60vw);
}
}

@media (min-width: 1200px) {
.preview-popover.responsive-wide {
width: min(calc(100% - 50vw), 50vw);
max-width: 800px;
}
}
</style>
