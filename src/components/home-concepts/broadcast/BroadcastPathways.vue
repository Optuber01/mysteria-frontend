<template>
  <section id="pathways" class="bc-pathways" aria-labelledby="bc-pathways-title">
    <div class="paths-backdrop" :style="{'--tint': tint}" aria-hidden="true"></div>
    <div class="bc-shell">
      <header class="paths-head">
        <div v-reveal>
          <p class="bc-label">{{ t('home.broadcast.pathways.label') }}</p>
          <h2 id="bc-pathways-title" class="bc-h2">{{ t('home.broadcast.pathways.title') }}</h2>
        </div>
        <p v-reveal="120" class="bc-lede">{{ t('home.broadcast.pathways.lede') }}</p>
      </header>

      <div class="paths-layout">
        <article v-reveal class="spotlight" :style="{'--tint': tint}">
          <div class="spot-art">
            <span class="spot-ring" aria-hidden="true"></span>
            <Transition name="spot">
              <img
                  :key="current"
                  :src="sigilLarge(current)"
                  :alt="t('home.broadcast.pathways.sigilAlt').replace('{name}', nameOf(current))"
                  width="512"
                  height="512"
                  loading="lazy"
                  decoding="async"
              >
            </Transition>
          </div>
          <div class="spot-copy">
            <p class="spot-index">
              {{ t('home.broadcast.pathways.index').replace('{n}', String(currentIndex + 1).padStart(2, '0')) }}
            </p>
            <h3 class="spot-name">{{ nameOf(current) || ' ' }}</h3>
            <ol class="spot-ladder" :aria-label="t('home.broadcast.pathways.ladderLabel')">
              <li v-for="rung in ladder" :key="rung.sequence" :class="{first: rung.sequence === 9, last: rung.sequence === 0}">
                <span class="rung-num">{{ rung.sequence }}</span>
                <span class="rung-name">{{ rung.name }}</span>
              </li>
            </ol>
            <RouterLink :to="$lp(`/pathways/${current}`)" class="bc-btn bc-btn-ghost spot-cta">
              {{ t('home.broadcast.pathways.open').replace('{name}', nameOf(current)) }}
              <span class="bc-arrow" aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </article>

        <ul class="paths-grid">
          <li v-for="(id, index) in CORE_IDS" :key="id" v-reveal="(index % 6) * 40">
            <RouterLink
                :to="$lp(`/pathways/${id}`)"
                :class="['path-tile', {active: id === current}]"
                :style="{'--tint': SIGIL_TINT[id]}"
                @mouseenter="current = id"
                @focus="current = id"
            >
              <img :src="sigilThumb(id)" alt="" width="256" height="256" loading="lazy" decoding="async">
              <span class="path-name">{{ nameOf(id) || ' ' }}</span>
              <span class="path-seq">{{ roleOf(id) || ' ' }}</span>
            </RouterLink>
          </li>
          <li class="grid-more">
            <RouterLink :to="$lp('/pathways')" class="more-tile">
              <span class="more-count">32</span>
              <span class="more-copy">{{ t('home.broadcast.pathways.archive') }} <span aria-hidden="true">→</span></span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div v-reveal class="boons">
        <div class="boons-head">
          <p class="boons-title"><span>+10</span> {{ t('home.broadcast.pathways.boonsTitle') }}</p>
          <p class="boons-body">{{ t('home.broadcast.pathways.boonsBody') }}</p>
        </div>
        <ul class="boons-row">
          <li v-for="id in BOON_IDS" :key="id">
            <RouterLink :to="$lp(`/pathways/${id}`)" class="boon" :style="{'--tint': SIGIL_TINT[id]}">
              <img :src="sigilThumb(id)" alt="" width="256" height="256" loading="lazy" decoding="async">
              <span>{{ nameOf(id) || ' ' }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {BOON_IDS, CORE_IDS, SIGIL_TINT, sigilLarge, sigilThumb, usePathwayData, vReveal} from './broadcast';

const {t, currentLanguage} = useI18n();
const {pathways} = usePathwayData();

const current = ref<string>('fool');
const currentIndex = computed(() => Math.max(0, (CORE_IDS as readonly string[]).indexOf(current.value)));
const tint = computed(() => SIGIL_TINT[current.value] ?? '#98abff');

const nameOf = (id: string) => pathways.value?.pathwayName(id, currentLanguage.value) ?? '';

/* Chinese names a pathway after its Sequence 9, so skip the role when it would repeat the name. */
const roleOf = (id: string) => {
  const module = pathways.value;
  if (!module) return '';
  const role = module.sequenceNineName(id, currentLanguage.value);
  const name = module.pathwayName(id, currentLanguage.value);
  const label = t('home.broadcast.pathways.seqNine');
  return role && role !== name ? `${label} · ${role}` : label;
};

const ladder = computed(() => {
  const module = pathways.value;
  if (!module) return Array.from({length: 10}, (_, index) => ({sequence: 9 - index, name: ' '}));
  const rungs = module.pathwayLadder(current.value, currentLanguage.value);
  // The data stops at Sequence 1; the summit is the pathway's god.
  if (!rungs.some(rung => rung.sequence === 0)) rungs.push({sequence: 0, name: module.deityName(current.value, currentLanguage.value)});
  return rungs;
});
</script>

<style scoped>
.bc-pathways {
  position: relative;
  padding: clamp(60px, 6.5vw, 96px) 0;
  overflow: hidden;
  isolation: isolate;
  background: var(--bc-night);
}

.paths-backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(ellipse 50% 45% at 22% 58%, color-mix(in srgb, var(--tint) 22%, transparent), transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 0%, rgba(49, 80, 245, 0.14), transparent 70%);
  transition: background .8s ease;
}

.paths-head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 24px 72px;
  align-items: end;
  margin-bottom: clamp(32px, 4vw, 52px);
}

.paths-head .bc-h2 {
  margin-top: 18px;
}

.paths-layout {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: clamp(24px, 3vw, 48px);
  align-items: stretch;
}

/* ── Spotlight ── */
.spotlight {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: clamp(24px, 2.4vw, 36px);
  border: 1px solid var(--bc-line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 80% 55% at 50% 30%, color-mix(in srgb, var(--tint) 18%, transparent), transparent 75%),
    linear-gradient(180deg, rgba(22, 25, 35, 0.75), rgba(7, 8, 12, 0.9));
  overflow: hidden;
}

.spot-art {
  position: relative;
  width: min(62%, 250px);
  aspect-ratio: 1;
  margin: 8px auto 4px;
}

.spot-ring {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--tint) 45%, transparent);
  animation: ring-spin 60s linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

.spot-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 40px color-mix(in srgb, var(--tint) 45%, transparent));
}

.spot-enter-active,
.spot-leave-active {
  transition: opacity .45s ease, transform .6s var(--bc-ease);
}

.spot-enter-from {
  opacity: 0;
  transform: scale(0.86) rotate(-8deg);
}

.spot-leave-to {
  opacity: 0;
  transform: scale(1.08) rotate(6deg);
}

.spot-copy {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.spot-index {
  margin: 12px 0 6px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-mute);
}

.spot-name {
  margin: 0 0 18px;
  font-family: var(--bc-font-display);
  font-weight: 600;
  font-size: clamp(28px, 2.8vw, 42px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.spot-ladder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-flow: column;
  grid-template-rows: repeat(5, auto);
  gap: 6px 20px;
  margin: 0 0 24px;
  padding: 16px 0 0;
  border-top: 1px solid var(--bc-line);
  list-style: none;
}

.spot-ladder li {
  display: flex;
  gap: 10px;
  min-width: 0;
  font-size: 14px;
  line-height: 1.4;
  color: #c9ccd8;
}

.rung-num {
  flex: none;
  width: 16px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  color: var(--bc-mute);
  line-height: 1.6;
}

.rung-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spot-ladder li.first .rung-name,
.spot-ladder li.last .rung-name {
  color: #fff;
  font-weight: 600;
}

.spot-ladder li.first .rung-num,
.spot-ladder li.last .rung-num {
  color: var(--tint);
}

.spot-cta {
  margin-top: auto;
  align-self: flex-start;
  white-space: normal;
  text-align: left;
}

/* ── Grid ── */
.paths-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.path-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 12px 6px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: rgba(243, 244, 248, 0.03);
  color: inherit;
  text-align: center;
  text-decoration: none;
  transition: background-color .3s ease, border-color .3s ease, transform .4s var(--bc-ease);
  box-sizing: border-box;
}

.path-tile img {
  width: 64%;
  max-width: 68px;
  aspect-ratio: 1;
  margin-bottom: 4px;
  transition: transform .5s var(--bc-ease), filter .5s ease;
}

.path-tile:hover,
.path-tile:focus-visible,
.path-tile.active {
  background: color-mix(in srgb, var(--tint) 10%, transparent);
  border-color: color-mix(in srgb, var(--tint) 40%, transparent);
}

.path-tile:hover img,
.path-tile.active img {
  transform: scale(1.1);
  filter: drop-shadow(0 0 16px color-mix(in srgb, var(--tint) 60%, transparent));
}

.path-name {
  font-family: var(--bc-font-display);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.path-seq {
  font-size: 12px;
  line-height: 1.3;
  color: var(--bc-mute);
}

.grid-more {
  grid-column: span 2;
}

.more-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 120px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--bc-blue);
  color: #fff;
  text-decoration: none;
  box-sizing: border-box;
  transition: background-color .3s ease;
}

.more-tile:hover {
  background: #2341e6;
}

.more-count {
  font-family: var(--bc-font-display);
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
}

.more-copy {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
}

/* ── Boons ── */
.boons {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 9fr);
  gap: 24px 48px;
  align-items: center;
  margin-top: clamp(32px, 4vw, 56px);
  padding-top: clamp(24px, 3vw, 36px);
  border-top: 1px solid var(--bc-line);
}

.boons-title {
  margin: 0 0 8px;
  font-family: var(--bc-font-display);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.02em;
}

.boons-title span {
  color: var(--bc-blue-hi);
}

.boons-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--bc-mute);
}

.boons-row {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.boon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 2px;
  border-radius: 10px;
  color: var(--bc-mute);
  font-size: 12px;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  transition: color .3s ease, background-color .3s ease;
}

.boon img {
  width: 100%;
  max-width: 64px;
  aspect-ratio: 1;
  opacity: 0.8;
  transition: opacity .3s ease, transform .4s var(--bc-ease);
}

.boon:hover,
.boon:focus-visible {
  color: var(--bc-snow);
  background: color-mix(in srgb, var(--tint) 10%, transparent);
}

.boon:hover img {
  opacity: 1;
  transform: translateY(-3px);
}

@media (max-width: 1100px) {
  .paths-layout {
    grid-template-columns: 1fr;
  }

  .spotlight {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 24px 36px;
    align-items: center;
  }

  .spot-art {
    width: 100%;
    max-width: 280px;
  }

  .boons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .paths-head {
    grid-template-columns: 1fr;
  }

  .paths-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .grid-more {
    grid-column: span 2;
  }

  .boons-row {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .spotlight {
    grid-template-columns: 1fr;
  }

  .spot-art {
    max-width: 200px;
  }

  .path-seq {
    display: none;
  }

  .path-name {
    font-size: 11px;
  }

  .path-tile {
    padding: 10px 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spot-ring {
    animation: none;
  }
}
</style>
