<template>
  <!-- Persistent deck: your card, a redraw, and where you are in the reading -->
  <aside class="arc-dock" :class="{'is-shown': shown}" :aria-label="t('home.arcana.dock.label')" :inert="!shown || undefined">
    <nav class="arc-dock__spread" :aria-label="t('home.arcana.dock.spreadLabel')">
      <a
          v-for="spot in spread"
          :key="spot.id"
          :href="`#${spot.id}`"
          class="arc-dock__spot"
          :class="{'is-active': active === spot.id}"
          :aria-current="active === spot.id ? 'location' : undefined"
      >
        <span class="arc-dock__spot-card" aria-hidden="true">{{ spot.numeral }}</span>
        <span class="arc-dock__spot-name">{{ spot.label }}</span>
      </a>
    </nav>

    <div class="arc-dock__card-wrap">
      <a href="#reading" class="arc-dock__card" :aria-label="t('home.arcana.dock.yourCard').replace('{name}', reading.name)">
        <span :key="drawCount" class="arc-dock__mini">
          <img :src="sigilThumb(card.id)" alt="" width="64" height="64">
        </span>
      </a>
      <div class="arc-dock__text">
        <span class="arc-dock__label">{{ t('home.arcana.dock.your') }}</span>
        <span class="arc-dock__name">{{ reading.name }}</span>
      </div>
      <button
          type="button"
          class="arc-dock__draw"
          :aria-label="`${t('home.arcana.dock.draw')} - ${t('home.arcana.dock.yourCard').replace('{name}', reading.name)}`"
          @click="draw()"
      >
        <i class="fa-solid fa-layer-group arc-dock__draw-icon" aria-hidden="true"></i>
        <span class="arc-dock__draw-label" aria-hidden="true">{{ t('home.arcana.dock.draw') }}</span>
        <!-- small screens: the whole control collapses into this round sigil -->
        <span :key="drawCount" class="arc-dock__orb" aria-hidden="true">
          <img :src="sigilThumb(card.id)" alt="" width="64" height="64">
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {sigilThumb} from './arcana-data';
import {useArcana} from './useArcana';

const {t} = useI18n();
const {card, reading, drawCount, draw} = useArcana();

const spread = computed(() => [
  {id: 'past', numeral: 'I', label: t('home.arcana.past.position')},
  {id: 'present', numeral: 'II', label: t('home.arcana.present.position')},
  {id: 'forces', numeral: 'III', label: t('home.arcana.forces.position')},
  {id: 'future', numeral: 'IV', label: t('home.arcana.future.position')},
]);

const shown = ref(false);
const active = ref('');
let heroObserver: IntersectionObserver | null = null;
let sectionObserver: IntersectionObserver | null = null;

onMounted(() => {
  const hero = document.querySelector('.concept-arcana .arc-hero');
  heroObserver = new IntersectionObserver(([entry]) => {
    shown.value = !entry.isIntersecting;
  }, {rootMargin: '0px 0px -55% 0px'});
  if (hero) heroObserver.observe(hero);

  sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) active.value = entry.target.id;
      else if (active.value === entry.target.id) active.value = '';
    }
  }, {rootMargin: '-45% 0px -45% 0px'});
  spread.value.forEach(spot => {
    const el = document.getElementById(spot.id);
    if (el) sectionObserver?.observe(el);
  });
});

onUnmounted(() => {
  heroObserver?.disconnect();
  sectionObserver?.disconnect();
});
</script>

<style scoped>
.arc-dock {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 950;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  opacity: 0;
  transform: translateY(24px);
  pointer-events: none;
  transition: opacity .35s ease, transform .5s cubic-bezier(.2, .8, .2, 1);
}

.arc-dock.is-shown {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.arc-dock__card-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 10px;
  border-radius: 16px;
  background: color-mix(in oklab, #101014 88%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 35%, transparent), 0 18px 40px rgba(0, 0, 0, .5);
  backdrop-filter: blur(12px);
}

/* the spread: four small cards down the right edge */
.arc-dock__spread {
  position: fixed;
  right: 18px;
  top: 50%;
  translate: 0 -50%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.arc-dock__spot {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px;
  border-radius: 6px;
  color: var(--arc-muted);
  font-family: var(--arc-caps);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  transition: color .2s;
}

.arc-dock__spot:hover,
.arc-dock__spot:focus-visible {
  color: var(--arc-ink);
}

.arc-dock__spot.is-active {
  color: var(--acc);
}

.arc-dock__spot-card {
  display: grid;
  place-items: center;
  width: 20px;
  height: 32px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  background: rgba(11, 11, 14, .7);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 8.5px;
  letter-spacing: 0;
  transition: transform .4s cubic-bezier(.2, .8, .2, 1), background-color .3s, color .3s;
}

.arc-dock__spot.is-active .arc-dock__spot-card {
  background: var(--acc);
  border-color: var(--acc);
  color: var(--arc-on-acc);
  transform: rotate(-8deg) scale(1.15);
}

.arc-dock__spot-name {
  order: -1;
  padding: 5px 9px;
  border-radius: 99px;
  background: rgba(11, 11, 14, .88);
  white-space: nowrap;
  opacity: 0;
  translate: 6px 0;
  pointer-events: none;
  transition: opacity .25s, translate .3s;
}

.arc-dock__spot:hover .arc-dock__spot-name,
.arc-dock__spot:focus-visible .arc-dock__spot-name {
  opacity: 1;
  translate: 0 0;
}

.arc-dock__card {
  display: block;
  perspective: 400px;
  border-radius: 6px;
}

.arc-dock__mini {
  display: grid;
  place-items: center;
  width: 34px;
  height: 55px;
  border-radius: 5px;
  background: radial-gradient(circle at 50% 45%, color-mix(in oklab, var(--acc) 35%, #15151a), #0d0d10 75%);
  box-shadow: inset 0 0 0 1.5px var(--acc);
  animation: arc-mini-flip .7s cubic-bezier(.2, .8, .2, 1);
}

.arc-dock__mini img {
  width: 30px;
  height: 30px;
}

@keyframes arc-mini-flip {
  from { transform: rotateY(180deg) scale(.8); }
  to { transform: none; }
}

.arc-dock__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 150px;
}

.arc-dock__label {
  font-family: var(--arc-caps);
  font-size: 9.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.arc-dock__name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 14px;
  color: var(--arc-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arc-dock__draw {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 11px;
  background: var(--acc);
  color: var(--arc-on-acc);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: filter .2s;
}

.arc-dock__draw:hover {
  filter: brightness(1.1);
}

.arc-dock a:focus-visible,
.arc-dock__draw:focus-visible {
  outline: 2px solid var(--arc-ink);
  outline-offset: 2px;
}

@media (max-width: 1240px) {
  .arc-dock__spread {
    display: none;
  }
}

.arc-dock__orb {
  display: none;
}

/* tablets and phones: one small round sigil button that redraws */
@media (max-width: 1024px) {
  .arc-dock {
    right: 14px;
    bottom: 14px;
  }

  .arc-dock__card-wrap {
    padding: 0;
    background: none;
    box-shadow: none;
    backdrop-filter: none;
  }

  .arc-dock__card,
  .arc-dock__text,
  .arc-dock__draw-icon,
  .arc-dock__draw-label {
    display: none;
  }

  .arc-dock__draw {
    position: relative;
    width: 52px;
    height: 52px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 45%, color-mix(in oklab, var(--acc) 38%, #15151a), #0d0d10 78%);
    box-shadow: inset 0 0 0 1.5px var(--acc), 0 10px 26px rgba(0, 0, 0, .55), 0 0 22px color-mix(in oklab, var(--acc) 30%, transparent);
  }

  .arc-dock__orb {
    display: grid;
    place-items: center;
    animation: arc-mini-flip .7s cubic-bezier(.2, .8, .2, 1);
  }

  .arc-dock__orb img {
    width: 40px;
    height: 40px;
  }

  /* a tiny redraw badge so it reads as an action, not decoration */
  .arc-dock__draw::after {
    content: '';
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--acc) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230b0b0e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 11a8 8 0 1 0-2.3 5.7'/%3E%3Cpath d='M20 4v7h-7'/%3E%3C/svg%3E") center / 11px no-repeat;
    box-shadow: 0 0 0 2px #0b0b0e;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-dock,
  .arc-dock__mini,
  .arc-dock__orb {
    transition: none;
    animation: none;
  }
}
</style>
