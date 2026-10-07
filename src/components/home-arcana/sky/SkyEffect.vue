<template>
  <!--
    The drawn Pathway's effect in the hero's sky (effects/<id>.vue), on one side of the
    castle: the scene mounts it twice, behind the city and in front of it. Keyed on the
    card, so a new draw plays its moment from the start while the old one fades.
  -->
  <Transition v-bind="FADE">
    <component :is="effect" v-if="effect" :key="id" :layer="layer" :body="body" :from="from" class="sky-effect" :class="`sky-effect--${layer}`"/>
  </Transition>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {fade} from './fade';
import {effectFor} from './effectLoader';
import type {Body} from './skyScenes';

const FADE = fade(700, 550);

const props = defineProps<{
  /** The drawn card ('' before a draw, or a card without an effect). */
  id: string;
  layer: 'back' | 'front';
  /** What hangs in the sky now, and what hung there before this card. */
  body: Body;
  from: Body;
}>();

const effect = computed(() => effectFor(props.id));
</script>

<style scoped>
.sky-effect {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
