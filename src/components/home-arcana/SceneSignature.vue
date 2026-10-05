<template>
  <!--
    The drawn Pathway's signature moment in the hero's night (see pathwayScenes.ts and
    signatures/*.vue): played once per draw, then settled. Mounted twice by the scene,
    once behind the castle and once in front of it; each signature fills the layers it
    needs. Keyed on the card, so a new draw plays its moment from the start.
  -->
  <component :is="signature" v-if="signature" :key="id" :layer="layer" :boon="boonId" class="signature" :class="`signature--${layer}`"/>
</template>

<script setup lang="ts">
import {computed, defineAsyncComponent, type Component} from 'vue';
import {cardById} from './arcana-data';

const props = defineProps<{
  /** The drawn card ('undrawn' before a draw). */
  id: string;
  layer: 'back' | 'front';
}>();

/* one file per Pathway, loaded only when that card is drawn */
const files = import.meta.glob<{default: Component}>('./signatures/*.vue');
const cache = new Map<string, Component>();
function load(name: string): Component | null {
  const path = `./signatures/${name}.vue`;
  if (!files[path]) return null;
  if (!cache.has(name)) cache.set(name, defineAsyncComponent(files[path] as () => Promise<{default: Component}>));
  return cache.get(name) ?? null;
}

const isBoon = computed(() => props.id !== 'undrawn' && cardById(props.id).boon);
/* every Boon shares the Outer God's treatment (signatures/boon.vue), with its own twist */
const boonId = computed(() => (isBoon.value ? props.id : undefined));
const signature = computed(() => (props.id === 'undrawn' ? null : load(isBoon.value ? 'boon' : props.id)));
</script>

<style scoped>
.signature {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
