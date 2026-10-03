<template>
  <!-- One player screenshot: cover crop, the drawn card's tint, and a quiet credit. -->
  <figure class="world-photo" :class="`is-credit-${credit}`">
    <img
        :src="shot.small || shot.src"
        :srcset="srcset"
        :sizes="sizes"
        :alt="alt"
        :width="shot.w"
        :height="shot.h"
        :style="{objectPosition: shot.focus}"
        loading="lazy"
        decoding="async"
    >
    <figcaption v-if="credit !== 'none'" class="world-photo__credit">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.6 2.5h4.8l1 1.6H14a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5.1a1 1 0 0 1 1-1h2.6zM8 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="currentColor"/></svg>
      <span>{{ creditText }}</span>
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
  credit?: 'br' | 'tr' | 'bl' | 'none';
}>(), {sizes: '(max-width: 900px) 100vw, 50vw', credit: 'br'});

const {t} = useI18n();

const srcset = computed(() => {
  const {small, src, w} = props.shot;
  if (!small || small === src || w <= 960) return undefined;
  return `${small} 960w, ${src} ${w}w`;
});

const creditText = computed(() => {
  const by = props.shot.author
      ? t('home.world.credit').replace('{author}', props.shot.author)
      : t('home.world.creditWiki');
  return props.shot.place ? `${props.shot.place} · ${by}` : by;
});
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

/* The drawn card's colour, barely: a tinted floor and a hairline ring. */
.world-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(0deg, color-mix(in oklab, var(--acc) 16%, rgba(11, 11, 14, .5)), transparent 38%);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 18%, rgba(255, 255, 255, .06));
}

.world-photo__credit {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: calc(100% - 24px);
  padding: 5px 10px;
  border-radius: 99px;
  background: rgba(8, 8, 10, .72);
  backdrop-filter: blur(6px);
  font-size: 11.5px;
  line-height: 1.3;
  color: #d9d8e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.world-photo__credit svg {
  flex: none;
  width: 11px;
  height: 11px;
  color: var(--acc);
}

.world-photo__credit span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-credit-br .world-photo__credit { right: 12px; bottom: 12px; }
.is-credit-bl .world-photo__credit { left: 12px; bottom: 12px; }
.is-credit-tr .world-photo__credit { right: 12px; top: 12px; }

@media (prefers-reduced-motion: reduce) {
  .world-photo img {
    transition: none;
  }
}
</style>
