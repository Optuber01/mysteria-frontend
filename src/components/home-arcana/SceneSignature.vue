<template>
  <!--
    The drawn Pathway's signature moment in the hero's night (see pathwayScenes.ts and
    signatures/*.vue): played once per draw, then settled. Mounted twice by the scene,
    once behind the castle and once in front of it; each signature fills the layers it
    needs. Keyed on the card, so a new draw plays its moment from the start.
  -->
  <!-- the old moment fades out under the new one, never cut -->
  <Transition v-bind="SIGNATURE_FADE">
    <component :is="signature" v-if="signature" :key="id" :layer="layer" :boon="boonId" :from="from" class="signature" :class="`signature--${layer}`"/>
  </Transition>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {cardById} from './arcana-data';
import {signatureFor} from './signatureLoader';
import {fade} from './fade';

const SIGNATURE_FADE = fade({duration: 600});

const props = defineProps<{
  /** The drawn card ('undrawn' before a draw). */
  id: string;
  layer: 'back' | 'front';
  /** What hung in the sky before this card: 'moon' | 'sun' | 'dusk' | 'hidden'. */
  from?: string;
}>();

const isBoon = computed(() => props.id !== 'undrawn' && cardById(props.id).boon);
/* every Boon shares the Outer God's treatment (signatures/boon.vue), with its own twist */
const boonId = computed(() => (isBoon.value ? props.id : undefined));
const signature = computed(() => (props.id === 'undrawn' ? null : signatureFor(props.id)));
</script>

<style scoped>
.signature {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
