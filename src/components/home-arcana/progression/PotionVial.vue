<template>
  <!-- The Sequence potion as a 16 px sprite, filled with the drawn Pathway's colour. -->
  <canvas ref="canvas" class="potion-vial" width="16" height="16" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { drawVial, hexToRgb, vialRows } from './art';

const props = withDefaults(defineProps<{ accent: string; level?: number }>(), { level: 1 });
const canvas = ref<HTMLCanvasElement | null>(null);

function paint() {
  const context = canvas.value?.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  drawVial(context, hexToRgb(props.accent), props.level);
}

onMounted(paint);
// Repaint only when a whole texel row of liquid changes.
watch(() => [props.accent, vialRows(props.level)] as const, paint);
</script>

<style scoped>
.potion-vial {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
</style>
