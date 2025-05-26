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
