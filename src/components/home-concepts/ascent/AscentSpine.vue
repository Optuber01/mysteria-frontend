<template>
  <nav
      :class="['a-spine', {'is-light': light, 'is-visible': visible}]"
      :aria-label="t('home.ascent.spine.label')"
  >
    <div class="a-spine__rail" aria-hidden="true">
      <span class="a-spine__fill"></span>
      <span class="a-spine__marker"></span>
    </div>
    <ol class="a-spine__rungs">
      <li
          v-for="n in RUNGS"
          :key="n"
          :class="['a-spine__rung', {'is-lit': climbed >= 9 - n, 'is-current': current === n}]"
          :style="{'--i': 9 - n}"
      >
        <a
            :href="`#${RUNG_TARGET[n]}`"
            :aria-current="current === n ? 'step' : undefined"
            @click="go($event, n)"
        >
          <span class="a-spine__name">{{ t(`home.ascent.spine.r${n}`) }}</span>
          <span class="a-spine__num">{{ n }}</span>
          <span class="a-spine__tick" aria-hidden="true"></span>
          <span class="sr-only">{{ t('home.ascent.spine.sequence').replace('{n}', String(n)) }}</span>
        </a>
      </li>
    </ol>
  </nav>

  <!-- Narrow screens: a quiet altimeter instead of the full ladder. -->
  <div :class="['a-alti', {'is-light': light, 'is-visible': visible}]" aria-hidden="true">
    <span class="a-alti__label">{{ current === null ? t('home.ascent.spine.ground') : t('home.ascent.spine.short') }}</span>
    <span class="a-alti__num">{{ current === null ? '—' : current }}</span>
    <span class="a-alti__bar"><span></span></span>
  </div>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';
import {prefersReducedMotion} from './useAscentScroll';
import {RUNG_TARGET} from './stages';

defineProps<{
  /** Whole rungs climbed so far (floor of the altitude). */
  climbed: number;
  /** Sequence currently on screen, or null on the ground. */
  current: number | null;
  light: boolean;
  visible: boolean;
}>();

const {t} = useI18n();
const RUNGS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const go = (event: MouseEvent, n: number) => {
  const target = document.getElementById(RUNG_TARGET[n]);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start'});
  history.replaceState(null, '', `#${RUNG_TARGET[n]}`);
};
</script>

<style scoped>
.a-spine {
  --rail-top: calc(var(--site-header-stack, 96px) + 40px);
  --rail-h: calc(100vh - var(--rail-top) - 56px);
  position: fixed;
  z-index: 40;
  top: var(--rail-top);
  right: 26px;
  width: 22px;
  height: var(--rail-h);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s ease, visibility 0s linear 0.5s;
  color: var(--a-ink);
}

.a-spine.is-visible {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.5s ease;
}

.a-spine__rail {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  width: 2px;
  background: rgba(242, 243, 245, 0.14);
}

.a-spine__fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, var(--a-accent), #fff);
  transform-origin: 50% 100%;
  transform: scaleY(clamp(0, calc(var(--alt, -1) / 9), 1));
  box-shadow: 0 0 14px var(--a-accent);
}

.a-spine__marker {
  position: absolute;
  left: -5px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(73, 226, 255, 0.35), 0 0 22px 4px var(--a-accent);
  transform: translateY(calc(clamp(0, var(--alt, -1), 9) / -9 * var(--rail-h))) rotate(45deg);
}

.a-spine__rungs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.a-spine__rung {
  position: absolute;
  right: 0;
  bottom: calc(var(--i) / 9 * 100%);
  transform: translateY(50%);
}

.a-spine__rung a {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 28px;
  padding-left: 8px;
  color: var(--a-ink-3);
  text-decoration: none;
}

.a-spine__num {
  width: 14px;
  font-family: var(--a-mono);
  font-size: 11px;
  text-align: right;
  transition: color 0.3s ease;
}

.a-spine__tick {
  width: 10px;
  height: 2px;
  margin-right: 1px;
  background: currentColor;
  opacity: 0.6;
  transition: width 0.3s ease, opacity 0.3s ease;
}

.a-spine__name {
  position: absolute;
  right: 44px;
  padding: 5px 10px;
  border: 1px solid var(--a-line-strong);
  background: rgba(10, 11, 13, 0.9);
  color: var(--a-ink);
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}

.a-spine__rung.is-lit a {
  color: var(--a-ink);
}

.a-spine__rung.is-current .a-spine__num {
  color: var(--a-accent);
}

.a-spine__rung.is-current .a-spine__name,
.a-spine__rung a:hover .a-spine__name,
.a-spine__rung a:focus-visible .a-spine__name {
  opacity: 1;
  transform: none;
}

.a-spine__rung a:hover .a-spine__tick,
.a-spine__rung a:focus-visible .a-spine__tick {
  opacity: 1;
}

.a-spine__rung a:focus-visible {
  outline: 2px solid var(--a-accent);
  outline-offset: 2px;
}

/* On the summit the spine is ink on light */
.a-spine.is-light {
  color: var(--l-ink);
}

.a-spine.is-light .a-spine__rail {
  background: rgba(11, 12, 14, 0.16);
}

.a-spine.is-light .a-spine__fill {
  background: linear-gradient(0deg, var(--l-accent), var(--l-ink));
  box-shadow: none;
}

.a-spine.is-light .a-spine__marker {
  background: var(--l-ink);
  box-shadow: 0 0 0 3px rgba(11, 12, 14, 0.15);
}

.a-spine.is-light .a-spine__rung a,
.a-spine.is-light .a-spine__rung.is-lit a {
  color: var(--l-ink);
}

.a-spine.is-light .a-spine__rung.is-current .a-spine__num {
  color: var(--l-accent);
}

.a-spine.is-light .a-spine__name {
  border-color: rgba(11, 12, 14, 0.2);
  background: rgba(255, 255, 255, 0.94);
  color: var(--l-ink);
}

.a-alti {
  display: none;
}

@media (max-width: 1099px) {
  .a-spine {
    display: none;
  }

  .a-alti {
    position: fixed;
    z-index: 40;
    right: 14px;
    bottom: 14px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    column-gap: 10px;
    padding: 8px 12px 8px 14px;
    border: 1px solid var(--a-line-strong);
    background: rgba(10, 11, 13, 0.82);
    color: var(--a-ink);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    pointer-events: none;
  }

  .a-alti.is-visible {
    opacity: 1;
    transform: none;
  }

  .a-alti__label {
    font-family: var(--a-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--a-ink-2);
  }

  .a-alti__num {
    grid-row: span 2;
    font-family: var(--a-display);
    font-size: 34px;
    font-weight: 700;
    line-height: 1;
    text-align: right;
  }

  .a-alti__bar {
    position: relative;
    height: 2px;
    background: rgba(242, 243, 245, 0.18);
  }

  .a-alti__bar span {
    position: absolute;
    inset: 0;
    background: var(--a-accent);
    transform-origin: 0 50%;
    transform: scaleX(clamp(0, calc(var(--alt, -1) / 9), 1));
  }

  .a-alti.is-light {
    border-color: rgba(11, 12, 14, 0.2);
    background: rgba(255, 255, 255, 0.88);
    color: var(--l-ink);
  }

  .a-alti.is-light .a-alti__label {
    color: var(--l-muted);
  }

  .a-alti.is-light .a-alti__bar span {
    background: var(--l-accent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .a-spine,
  .a-alti,
  .a-spine__name {
    transition: none;
  }
}
</style>
