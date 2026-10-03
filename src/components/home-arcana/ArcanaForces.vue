<template>
  <section id="forces" class="arc-section arc-forces" aria-labelledby="arc-forces-title">
    <div class="arc-shell">
      <ArcanaSectionHead numeral="III" :position="t('home.arcana.forces.position')" title-id="arc-forces-title">
        <template #title>{{ t('home.arcana.forces.titleA') }} <em>{{ t('home.arcana.forces.titleB') }}</em></template>
        {{ t('home.arcana.forces.lede') }}
      </ArcanaSectionHead>

      <ul class="arc-forces__grid">
        <li
            v-for="force in forces"
            :key="force.key"
            class="arc-force"
            :class="`is-${force.key}`"
            @pointermove="onTilt"
            @pointerleave="onTiltEnd"
        >
          <div class="arc-force__media">
            <img :src="force.image" :alt="force.alt" loading="lazy" decoding="async" :width="force.w" :height="force.h">
          </div>
          <div class="arc-force__copy">
            <p class="arc-force__tag">{{ force.tag }}</p>
            <h3>{{ force.title }}</h3>
            <p>{{ force.body }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import rift from '@/assets/images/home-library/captures/hero-eye-rift.webp';
import guardian from '@/assets/images/home-library/community-archive/events/guardians/guardian-dragon-encounter.webp';
import moon from '@/assets/images/home-library/crimson-moon.webp';
import church from '@/assets/images/home-library/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import towns from '@/assets/images/home-library/captures/wiki/agora-plots.webp';
import emporium from '@/assets/images/home-library/captures/wiki/emporium.webp';

const {t} = useI18n();

const forces = computed(() => [
  {key: 'rifts', image: rift, w: 1920, h: 1042},
  {key: 'guardians', image: guardian, w: 1600, h: 868},
  {key: 'moon', image: moon, w: 640, h: 640},
  {key: 'churches', image: church, w: 1600, h: 841},
  {key: 'towns', image: towns, w: 953, h: 487},
  {key: 'emporium', image: emporium, w: 1920, h: 1080},
].map(force => ({
  ...force,
  tag: t(`home.arcana.forces.items.${force.key}.tag`),
  title: t(`home.arcana.forces.items.${force.key}.title`),
  body: t(`home.arcana.forces.items.${force.key}.body`),
  alt: t(`home.arcana.forces.items.${force.key}.alt`),
})));

/* A light card-like tilt on hover; transforms only. */
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function onTilt(event: PointerEvent) {
  if (reduced || event.pointerType !== 'mouse') return;
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  el.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
  el.style.setProperty('--px', `${(x * -14).toFixed(1)}px`);
  el.style.setProperty('--py', `${(y * -10).toFixed(1)}px`);
}
function onTiltEnd(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement;
  ['--rx', '--ry', '--px', '--py'].forEach(name => el.style.removeProperty(name));
}
</script>

<style scoped>
.arc-forces__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(214px, auto));
  gap: clamp(12px, 1.4vw, 20px);
}

.is-rifts { grid-column: 1 / 3; grid-row: 1 / 3; }
.is-guardians { grid-column: 3 / 5; grid-row: 1; }
.is-moon { grid-column: 3; grid-row: 2; }
.is-churches { grid-column: 4; grid-row: 2; }
.is-towns { grid-column: 1 / 3; grid-row: 3; }
.is-emporium { grid-column: 3 / 5; grid-row: 3; }

.arc-force {
  --rx: 0deg;
  --ry: 0deg;
  --px: 0px;
  --py: 0px;
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 230px;
  overflow: hidden;
  border-radius: 16px;
  background: #0d0d10;
  box-shadow: inset 0 0 0 1px var(--arc-line);
  transform: perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform .5s cubic-bezier(.2, .8, .2, 1), box-shadow .3s;
  isolation: isolate;
}

.arc-force:hover {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 70%, transparent), 0 24px 60px rgba(0, 0, 0, .45);
}

.arc-force__media {
  position: absolute;
  inset: -16px;
  z-index: -1;
  transform: translate(var(--px), var(--py));
  transition: transform .6s cubic-bezier(.2, .8, .2, 1);
}

.arc-force__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.arc-force::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(8, 8, 10, 0) 25%, rgba(8, 8, 10, .82) 68%, rgba(8, 8, 10, .95));
}

.arc-force__copy {
  position: relative;
  z-index: 1;
  padding: 22px 24px 22px;
  max-width: 34em;
}

.arc-force__tag {
  display: inline-block;
  margin: 0 0 10px;
  padding: 4px 9px;
  border-radius: 99px;
  background: color-mix(in oklab, var(--acc) 22%, rgba(8, 8, 10, .7));
  font-family: var(--arc-caps);
  font-size: 10.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #fff;
}

.arc-force h3 {
  margin: 0 0 6px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(18px, 1.5vw, 22px);
  line-height: 1.2;
  color: #fff;
}

.arc-force p:last-child {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.55;
  color: #d4d3dc;
}

.is-rifts h3 {
  font-size: clamp(24px, 2.4vw, 34px);
}

.is-rifts p:last-child {
  font-size: 16px;
}

/* the Crimson Moon is a moon, not a photo: give it a sky */
.is-moon {
  background: radial-gradient(circle at 50% 30%, #3a0c10, #0b0405 70%);
}

.is-moon .arc-force__media {
  inset: auto;
  top: 8%;
  left: 50%;
  width: 70%;
  aspect-ratio: 1;
  translate: -50% 0;
  filter: drop-shadow(0 0 40px rgba(255, 40, 40, .45));
}

.is-moon .arc-force__media img {
  object-fit: contain;
}

@media (max-width: 1024px) {
  .arc-forces__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }

  .is-rifts { grid-column: 1 / 3; grid-row: auto; min-height: 340px; }
  .is-guardians, .is-towns, .is-emporium { grid-column: 1 / 3; grid-row: auto; }
  .is-moon, .is-churches { grid-column: auto; grid-row: auto; }
}

@media (max-width: 600px) {
  .arc-forces__grid {
    grid-template-columns: 1fr;
  }

  .arc-force,
  .is-rifts,
  .is-guardians,
  .is-towns,
  .is-emporium,
  .is-moon,
  .is-churches {
    grid-column: auto;
    min-height: 280px;
  }

  .is-moon .arc-force__media {
    top: 6%;
    width: 44%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-force,
  .arc-force__media {
    transition: none;
    transform: none;
  }
}
</style>
