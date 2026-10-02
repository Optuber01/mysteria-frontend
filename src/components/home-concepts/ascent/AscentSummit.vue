<template>
  <section id="sequence-0" ref="rootRef" class="summit" aria-labelledby="ascent-summit-title">
    <div class="summit__stage">
      <div class="summit__light" aria-hidden="true">
        <span class="summit__flood"></span>
        <span class="summit__white"></span>
        <span class="summit__cloud summit__cloud--l"></span>
        <span class="summit__cloud summit__cloud--r"></span>
        <span class="summit__rays"></span>
        <span class="summit__numeral">0</span>
      </div>

      <div class="a-shell summit__grid">
        <div class="summit__copy">
          <p class="a-eyebrow a-eyebrow--ink"><span class="a-seq a-seq--ink">0</span>{{ t('home.ascent.summit.eyebrow') }}</p>
          <h2 id="ascent-summit-title" class="a-h2 a-h2--xl a-h2--ink summit__title">
            <span>{{ t('home.ascent.summit.titleA') }}</span>
            <span>{{ t('home.ascent.summit.titleB') }}</span>
          </h2>
          <p class="summit__lede">{{ t('home.ascent.summit.lede') }}</p>
          <RouterLink :to="$lp('/ascension')" class="a-btn a-btn--ink summit__cta">
            {{ t('home.ascent.summit.registry') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </div>

        <figure class="seats">
          <figcaption class="seats__caption">{{ t('home.ascent.summit.seatsLabel') }}</figcaption>
          <ol class="seats__rows">
            <li v-for="(row, rowIndex) in rows" :key="row.seq" class="seats__row" :style="{'--row': rowIndex}">
              <span class="seats__label">
                <b>{{ row.seq }}</b>
                <span>{{ row.rank }}</span>
              </span>
              <span class="seats__dots" aria-hidden="true">
                <i v-for="n in row.cap" :key="n" :style="{'--n': n}"></i>
              </span>
              <span class="seats__count">{{ row.capText }}</span>
            </li>
          </ol>
          <p class="seats__note">{{ heldText }}</p>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useScene} from './useAscentScroll';

type SeatOccupancy = { pathway: string; counts: number[] };
const props = defineProps<{ highSeats: readonly SeatOccupancy[] }>();

/* Mirrors HIGH_SEAT_LIMITS in src/data/pathways.ts (kept local so this
   chapter does not pull the pathway dataset). */
const LIMITS: Record<number, number> = {0: 1, 1: 3, 2: 9, 3: 18};
const CORE_COUNT = 22;

const {t, intlLocale} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
useScene(rootRef, 2400);

const rows = computed(() => [0, 1, 2, 3].map(seq => ({
  seq,
  rank: t(`home.ascent.summit.rank${seq}`),
  cap: LIMITS[seq],
  capText: (LIMITS[seq] === 1 ? t('home.ascent.summit.seatOne') : t('home.ascent.summit.seatMany'))
      .replace('{n}', String(LIMITS[seq])),
})));

const heldText = computed(() => {
  if (!props.highSeats.length) return t('home.ascent.summit.seatsNote');
  const held = props.highSeats.reduce((sum, entry) => sum + [0, 1, 2, 3].reduce((acc, seq) => acc + (entry.counts[seq] ?? 0), 0), 0);
  const total = CORE_COUNT * (LIMITS[0] + LIMITS[1] + LIMITS[2] + LIMITS[3]);
  const format = new Intl.NumberFormat(intlLocale.value);
  return t('home.ascent.summit.seatsHeld').replace('{n}', format.format(held)).replace('{total}', format.format(total));
});
</script>

<style scoped>
.summit {
  --p: 0;
  --flood: clamp(0, calc(var(--p) / 0.26), 1);
  --show: clamp(0, calc((var(--p) - 0.16) / 0.16), 1);
  --seat: clamp(0, calc((var(--p) - 0.28) / 0.36), 1);
  position: relative;
  height: 115vh;
  background: #353c46;
}

.summit__stage {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 100vh;
  padding-top: var(--site-header-stack, 96px);
  overflow: hidden;
  color: var(--l-ink);
}

.summit__light {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* The break through the clouds: white floods out from the summit */
.summit__flood {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 260vmax;
  height: 260vmax;
  margin: -130vmax 0 0 -130vmax;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, rgba(255, 255, 255, 0.96) 6%, rgba(240, 251, 255, 0.7) 16%, rgba(220, 244, 252, 0.36) 28%, rgba(220, 240, 250, 0.12) 40%, rgba(242, 245, 248, 0) 50%);
  transform: scale(calc(0.08 + var(--flood) * 0.92));
  will-change: transform;
}

.summit__white {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 70% at 50% 46%, #ffffff 0%, #f6f9fb 55%, #e9eef2 100%);
  opacity: clamp(0, calc((var(--flood) - 0.45) / 0.45), 1);
}

.summit__cloud {
  position: absolute;
  top: -10%;
  width: 90vw;
  height: 120%;
  will-change: transform, opacity;
  opacity: calc(1 - var(--flood) * 0.9);
}

.summit__cloud--l {
  left: -18vw;
  background:
      radial-gradient(ellipse 50% 30% at 60% 30%, rgba(222, 230, 238, 0.55), transparent 70%),
      radial-gradient(ellipse 45% 26% at 40% 62%, rgba(200, 210, 222, 0.5), transparent 70%),
      radial-gradient(ellipse 40% 22% at 76% 86%, rgba(232, 238, 244, 0.45), transparent 70%);
  transform: translate3d(calc(var(--flood) * -55vw), 0, 0);
}

.summit__cloud--r {
  right: -18vw;
  background:
      radial-gradient(ellipse 50% 28% at 40% 40%, rgba(226, 232, 240, 0.55), transparent 70%),
      radial-gradient(ellipse 42% 26% at 62% 72%, rgba(206, 214, 226, 0.5), transparent 70%),
      radial-gradient(ellipse 36% 20% at 28% 12%, rgba(236, 240, 246, 0.42), transparent 70%);
  transform: translate3d(calc(var(--flood) * 55vw), 0, 0);
}

.summit__rays {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 180vmax;
  height: 180vmax;
  margin: -90vmax 0 0 -90vmax;
  background: repeating-conic-gradient(from 0deg, rgba(120, 150, 175, 0.07) 0deg 4deg, transparent 4deg 12deg);
  -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 60%);
  mask-image: radial-gradient(circle, #000 0%, transparent 60%);
  opacity: var(--flood);
  animation: ascent-rays 120s linear infinite;
}

@keyframes ascent-rays {
  to {
    transform: rotate(360deg);
  }
}

.summit__numeral {
  position: absolute;
  right: calc(var(--spine-space) + 2vw);
  top: 50%;
  font-family: var(--a-display);
  font-size: min(130vh, 76vw);
  font-weight: 900;
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 2px rgba(11, 12, 14, 0.07);
  text-shadow: 0 0 120px rgba(73, 226, 255, 0.25);
  transform: translate3d(0, calc(-50% + (1 - var(--flood)) * 10vh), 0) scale(calc(0.9 + 0.1 * var(--flood)));
  opacity: var(--flood);
}

.summit__grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(32px, 5vw, 96px);
  align-items: center;
  opacity: var(--show);
  transform: translate3d(0, calc((1 - var(--show)) * 40px), 0);
}

.summit__title {
  margin-top: 14px;
  color: var(--l-ink);
}

.summit__title span {
  display: block;
}

.summit__lede {
  max-width: 34em;
  margin: 26px 0 0;
  font-size: clamp(17px, 1.3vw, 19px);
  line-height: 1.65;
  color: var(--l-muted);
}

.summit__cta {
  margin-top: 36px;
}

/* ---- the seat pyramid ---- */
.seats {
  margin: 0;
  padding: clamp(24px, 3vw, 40px);
  border: 1px solid rgba(11, 12, 14, 0.12);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 40px 100px rgba(80, 110, 140, 0.18);
}

.seats__caption {
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--l-muted);
}

.seats__rows {
  display: grid;
  gap: 18px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.seats__row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 70px;
  gap: 16px;
  align-items: center;
}

.seats__label {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.seats__label b {
  font-family: var(--a-display);
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
}

.seats__label span {
  font-size: 13px;
  font-weight: 600;
  color: var(--l-muted);
}

.seats__dots {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.seats__dots i {
  --size: calc(30px - var(--row) * 6px);
  --lit: clamp(0, calc((var(--seat) * 4 - var(--row)) * 1.2), 1);
  width: var(--size);
  height: var(--size);
  background: var(--l-ink);
  opacity: calc(0.12 + 0.88 * var(--lit));
  transform: scale(calc(0.6 + 0.4 * var(--lit)));
}

.seats__row:first-child .seats__dots i {
  background: var(--l-accent);
  box-shadow: 0 0 24px rgba(0, 150, 180, 0.55);
}

.seats__count {
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-align: right;
  color: var(--l-muted);
}

.seats__note {
  margin: 26px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(11, 12, 14, 0.1);
  font-size: 14px;
  line-height: 1.55;
  color: var(--l-muted);
}

@media (max-width: 899px) {
  .summit__grid {
    grid-template-columns: 1fr;
  }

  .seats {
    max-width: 560px;
  }
}

@media (max-width: 1099px) and (min-width: 900px) {
  .summit__title {
    font-size: clamp(56px, 7.4vw, 84px);
  }

  .seats__row {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .seats__count {
    display: none;
  }
}

@media (max-width: 899px), (prefers-reduced-motion: reduce) {
  .summit {
    height: auto;
    background: #f2f5f8;
  }

  .summit__stage {
    position: relative;
    height: auto;
    padding: clamp(96px, 14vh, 150px) 0;
  }

  .summit__flood {
    top: 0;
  }
}

@media (max-width: 899px) {
  .summit__numeral {
    top: 20%;
    right: -10vw;
  }

  .seats__row {
    grid-template-columns: 92px minmax(0, 1fr);
  }

  .seats__count {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summit__white {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 70% at 50% 46%, #ffffff 0%, #f6f9fb 55%, #e9eef2 100%);
  opacity: clamp(0, calc((var(--flood) - 0.45) / 0.45), 1);
}

.summit__cloud {
  position: absolute;
  top: -10%;
  width: 90vw;
  height: 120%;
  will-change: transform, opacity;
  opacity: calc(1 - var(--flood) * 0.9);
}

.summit__cloud--l {
  left: -18vw;
  background:
      radial-gradient(ellipse 50% 30% at 60% 30%, rgba(222, 230, 238, 0.55), transparent 70%),
      radial-gradient(ellipse 45% 26% at 40% 62%, rgba(200, 210, 222, 0.5), transparent 70%),
      radial-gradient(ellipse 40% 22% at 76% 86%, rgba(232, 238, 244, 0.45), transparent 70%);
  transform: translate3d(calc(var(--flood) * -55vw), 0, 0);
}

.summit__cloud--r {
  right: -18vw;
  background:
      radial-gradient(ellipse 50% 28% at 40% 40%, rgba(226, 232, 240, 0.55), transparent 70%),
      radial-gradient(ellipse 42% 26% at 62% 72%, rgba(206, 214, 226, 0.5), transparent 70%),
      radial-gradient(ellipse 36% 20% at 28% 12%, rgba(236, 240, 246, 0.42), transparent 70%);
  transform: translate3d(calc(var(--flood) * 55vw), 0, 0);
}

.summit__rays {
    animation: none;
  }
}
</style>
