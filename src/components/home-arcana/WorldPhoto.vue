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
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
    >
    <figcaption v-if="credit !== 'none'" class="world-photo__credit">
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
  /** Load now instead of lazily (the drifting strip clips its tiles, which keeps lazy ones from loading early). */
  eager?: boolean;
}>(), {sizes: '(max-width: 900px) 100vw, 50vw', credit: 'br', eager: false});

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

/*
 * The credit is a quiet caption along the photo's edge: plain small text on a
 * soft scrim, no pill. It always sits on a photograph, so its ink and scrim
 * stay photo-dark/photo-light in either page theme.
 */
.world-photo__credit {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  display: flex;
  padding: 26px 14px 11px;
  background: linear-gradient(0deg, rgba(6, 6, 8, .74), rgba(6, 6, 8, .4) 55%, transparent);
  font-size: 11.5px;
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

.is-credit-br .world-photo__credit,
.is-credit-bl .world-photo__credit { bottom: 0; }

.is-credit-tr .world-photo__credit {
  top: 0;
  padding: 11px 14px 26px;
  background: linear-gradient(180deg, rgba(6, 6, 8, .74), rgba(6, 6, 8, .4) 55%, transparent);
}

.is-credit-br .world-photo__credit,
.is-credit-tr .world-photo__credit {
  justify-content: flex-end;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .world-photo img {
    transition: none;
  }
}
</style>
