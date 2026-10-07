<template>
  <!-- One player screenshot: cover crop, the drawn card's tint, and a quiet credit. -->
  <figure class="world-photo">
    <img
        :src="shot.small || shot.src"
        :srcset="srcset"
        :sizes="sizes"
        :alt="alt"
        :width="shot.w"
        :height="shot.h"
        :style="{objectPosition: shot.focus}"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        @load="emit('loaded')"
        @error="emit('loaded')"
    >
    <figcaption v-if="shot.author" class="world-photo__credit">
      <span>{{ creditText }}</span>
      <!-- the season it was taken in (gallery tiles only; the topic photos are current) -->
      <span v-if="epochLabel" class="world-photo__epoch">{{ epochLabel }}</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {WorldShot} from './WorldShots';

const props = withDefaults(defineProps<{
  shot: WorldShot;
  alt: string;
  sizes?: string;
  /** Load now instead of lazily (the drifting strip clips its tiles, which keeps lazy ones from loading early). */
  eager?: boolean;
  /** Show the season it was taken in. */
  epoch?: boolean;
}>(), {sizes: '(max-width: 900px) 100vw, 50vw', eager: false, epoch: false});
/** The image is in (or failed): the gallery strip loads its tiles in turns. */
const emit = defineEmits<{loaded: []}>();

const {t} = useI18n();

const srcset = computed(() => {
  const {small, src, w} = props.shot;
  if (!small || small === src || w <= 960) return undefined;
  return `${small} 960w, ${src} ${w}w`;
});

/* Credit only: the place is the card's title or the photo's alt, never repeated here. */
const creditText = computed(() => t('home.world.credit').replace('{author}', props.shot.author));
const epochLabel = computed(() => (props.epoch ? t('home.world.gallery.epoch').replace('{n}', props.shot.epoch === 1 ? 'I' : 'II') : ''));
</script>

<style scoped>
.world-photo {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: var(--arc-surface);
}

.world-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .9s cubic-bezier(.2, .8, .2, 1);
}

/* The drawn card's colour, barely, on the floor; the page's hairline around the edge. */
.world-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(0deg, color-mix(in oklab, var(--acc) 16%, rgba(11, 11, 14, .5)), transparent 38%);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

/*
 * The credit is a quiet caption along the photo's top right edge (one place on every photo): plain small text on a
 * soft scrim, no pill. It always sits on a photograph, so its ink and scrim
 * stay photo-dark/photo-light in either page theme.
 */
.world-photo__credit {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  justify-content: flex-end;
  text-align: right;
  padding: 11px 14px 26px;
  background: linear-gradient(180deg, rgba(6, 6, 8, .74), rgba(6, 6, 8, .4) 55%, transparent);
  font-size: var(--arc-fs-caption);
  line-height: 1.3;
  color: #e4e3ea;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .55);
  pointer-events: none;
}

.world-photo__credit span {
  min-width: 0;
  text-align: inherit;
  text-wrap: balance;
}

/* the season, after the credit: quieter, the same line */
.world-photo__epoch {
  flex: none;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(228, 227, 234, .4);
  color: rgba(228, 227, 234, .78);
}

@media (prefers-reduced-motion: reduce) {
  .world-photo img {
    transition: none;
  }
}
</style>
