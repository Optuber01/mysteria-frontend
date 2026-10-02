<template>
  <section id="pathways" ref="rootRef" class="paths" aria-labelledby="ascent-paths-title">
    <div class="a-shell">
      <header class="paths__head">
        <div>
          <p class="a-eyebrow" data-rv>{{ t('home.ascent.paths.eyebrow') }}</p>
          <h2 id="ascent-paths-title" class="a-h2 paths__title" data-rv>
            <span>{{ t('home.ascent.paths.titleA') }}</span>
            <span class="paths__title-b">{{ t('home.ascent.paths.titleB') }}</span>
          </h2>
        </div>
        <div class="paths__intro" data-rv>
          <p class="a-lede">{{ t('home.ascent.paths.lede') }}</p>
          <RouterLink :to="$lp('/pathways')" class="a-link">
            {{ t('home.ascent.paths.all') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </div>
      </header>

      <div class="paths__field" data-rv @pointerleave="active = pinned">
        <ul class="paths__ladders" :aria-label="t('home.ascent.paths.listLabel')">
          <li
              v-for="(id, index) in CORE"
              :key="id"
              :class="['ladder', {'is-active': active === id}]"
              :style="{'--hue': HUES[id], '--n': index}"
          >
            <RouterLink
                :to="$lp(`/pathways/${id}`)"
                class="ladder__link"
                :aria-label="ladderLabel(id)"
                @pointerenter="active = id"
                @focus="active = id"
            >
              <span class="ladder__name" aria-hidden="true">{{ nameOf(id) }}</span>
              <span class="ladder__frame" aria-hidden="true">
                <i v-for="r in 10" :key="r" class="ladder__rung" :style="{'--r': r - 1}"></i>
              </span>
              <span class="ladder__sigil" aria-hidden="true">
                <img :src="sigil(id)" alt="" width="64" height="64" loading="lazy" decoding="async">
              </span>
              <span class="ladder__first" aria-hidden="true">{{ data[id]?.first ?? '' }}</span>
            </RouterLink>
          </li>
        </ul>

        <div class="paths__detail" :style="{'--hue': HUES[active]}" aria-hidden="true">
          <p class="paths__detail-kicker">{{ t('home.ascent.paths.reading') }}</p>
          <p class="paths__detail-name">{{ nameOf(active) }}</p>
          <ol class="paths__detail-ladder">
            <li v-for="rung in data[active]?.ladder ?? []" :key="rung.sequence">
              <b>{{ rung.sequence }}</b>{{ rung.name }}
            </li>
          </ol>
        </div>
      </div>

      <div class="paths__boons" data-rv>
        <div class="paths__boons-copy">
          <p class="paths__boons-title">{{ t('home.ascent.paths.boonsTitle') }}</p>
          <p class="paths__boons-body">{{ t('home.ascent.paths.boonsBody') }}</p>
        </div>
        <ul class="paths__boons-list" :aria-label="t('home.ascent.paths.boonsLabel')">
          <li v-for="id in BOONS" :key="id">
            <RouterLink :to="$lp(`/pathways/${id}`)" class="boon" :aria-label="nameOf(id)">
              <img :src="sigil(id)" alt="" width="44" height="44" loading="lazy" decoding="async">
              <span class="boon__name" aria-hidden="true">{{ nameOf(id) }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReveals} from './useAscentScroll';

/* The 22, in the novel's canonical order (Seer first). */
const CORE = [
  'fool', 'door', 'error', 'visionary', 'sun', 'tyrant', 'tower', 'hanged', 'darkness', 'death', 'giant',
  'demoness', 'priest', 'hermit', 'paragon', 'fortune', 'mother', 'moon', 'abyss', 'chained', 'emperor', 'justiciar',
] as const;
const BOONS = ['aeon', 'chaos', 'chaosmist', 'condenser', 'devouring', 'edict', 'everlasting', 'patriarch', 'secondlaw', 'sublunary'];

/* Each ladder lights in its own sigil's colour. */
const HUES: Record<string, string> = {
  fool: '#c9c2f0', door: '#5fe6ec', error: '#e9e9ef', visionary: '#c6d6f4', sun: '#ffd23f', tyrant: '#4ea2ff',
  tower: '#86a8ff', hanged: '#ff5050', darkness: '#a9c2ff', death: '#e4f2c4', giant: '#ff8048', demoness: '#ff70d8',
  priest: '#ff5e3a', hermit: '#b08cff', paragon: '#ffab45', fortune: '#c6eeee', mother: '#74e0a0', moon: '#ff6f80',
  abyss: '#ff4a36', chained: '#cbbcff', emperor: '#9eb0d4', justiciar: '#f4f4f4',
};

/* English labels until the localized pathway data arrives. */
const FALLBACK_NAMES: Record<string, string> = {
  fool: 'Fool', door: 'Door', error: 'Error', visionary: 'Visionary', sun: 'Sun', tyrant: 'Tyrant',
  tower: 'White Tower', hanged: 'Hanged Man', darkness: 'Darkness', death: 'Death', giant: 'Twilight Giant',
  demoness: 'Demoness', priest: 'Red Priest', hermit: 'Hermit', paragon: 'Paragon', fortune: 'Wheel of Fortune',
  mother: 'Mother', moon: 'Moon', abyss: 'Abyss', chained: 'Chained', emperor: 'Black Emperor', justiciar: 'Justiciar',
  aeon: 'Eternal Aeon', chaos: 'Chaos', chaosmist: 'Chaos Mist', condenser: 'Condenser', devouring: 'Devouring',
  edict: 'Edict', everlasting: 'Everlasting', patriarch: 'Patriarch', secondlaw: 'Second Law', sublunary: 'Sublunary',
};

type PathwayInfo = { name: string; first: string; last: string; ladder: Array<{ sequence: number; name: string }> };

const {t, currentLanguage} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const active = ref<string>('fool');
const pinned = 'fool';
const data = reactive<Record<string, PathwayInfo>>({});

useReveals(rootRef);

const sigil = (id: string) => `/pathway-art/avif/thumbs/${id === 'aeon' ? 'eternalaeon' : id}.avif`;
const nameOf = (id: string) => data[id]?.name ?? FALLBACK_NAMES[id] ?? id;

const ladderLabel = (id: string) => {
  const info = data[id];
  if (!info) return t('home.ascent.paths.ladderShort').replace('{name}', nameOf(id));
  return t('home.ascent.paths.ladderLabel')
      .replace('{name}', info.name)
      .replace('{first}', info.first)
      .replace('{last}', info.last);
};

/* The pathway module carries every ability (~1.3 MB), so it is only fetched
   as the visitor approaches this section. */
let loaded = false;
let observer: IntersectionObserver | null = null;

async function load() {
  const module = await import('@/data/pathways');
  const language = currentLanguage.value;
  for (const id of [...CORE, ...BOONS]) {
    const ladder = module.pathwayLadder(id, language);
    data[id] = {
      name: module.pathwayName(id, language),
      first: ladder[0]?.name ?? '',
      last: ladder[ladder.length - 1]?.name ?? '',
      ladder,
    };
  }
  loaded = true;
}

onMounted(() => {
  if (!rootRef.value) return;
  observer = new IntersectionObserver(records => {
    if (records.some(record => record.isIntersecting)) {
      observer?.disconnect();
      void load();
    }
  }, {rootMargin: '1200px 0px'});
  observer.observe(rootRef.value);
});

onUnmounted(() => observer?.disconnect());

watch(currentLanguage, () => {
  if (loaded) void load();
});
</script>

<style scoped>
.paths {
  position: relative;
  padding: clamp(64px, 9vh, 100px) 0 clamp(32px, 5vh, 56px);
  background:
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(73, 226, 255, 0.06), transparent 70%),
      linear-gradient(180deg, var(--a-ground) 0%, var(--a-stone) 100%);
}

.paths__head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 40px 64px;
  align-items: end;
}

.paths__title span {
  display: block;
}

.paths__title-b {
  color: var(--a-ink-3);
}

.paths__intro .a-lede {
  margin: 0 0 22px;
}

/* ---------- the 22 ladders ---------- */
.paths__field {
  position: relative;
  margin-top: clamp(28px, 4vh, 48px);
}

.paths__ladders {
  display: grid;
  grid-template-columns: repeat(22, minmax(0, 1fr));
  gap: 0 clamp(4px, 0.5vw, 10px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ladder {
  --lift: 0px;
  min-width: 0;
}

.ladder__link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 10px 0 8px;
  color: var(--a-ink-3);
  text-decoration: none;
  transform: translateY(var(--lift));
  transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.1, 1), color 0.3s ease;
}

.ladder.is-active .ladder__link,
.ladder__link:hover,
.ladder__link:focus-visible {
  --lift: -14px;
  color: var(--a-ink);
}

.ladder.is-active .ladder__link {
  transform: translateY(-14px);
}

.ladder__link:focus-visible {
  outline: 2px solid var(--hue);
  outline-offset: 4px;
}

.ladder__name {
  height: 104px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: left;
  overflow: hidden;
}

.ladder.is-active .ladder__name {
  color: var(--hue);
}

/* two rails, ten rungs: Sequence 0 at the top */
.ladder__frame {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: min(100%, 30px);
  height: clamp(120px, 16vh, 170px);
  padding: 4px 0;
  border-inline: 1px solid rgba(242, 243, 245, 0.16);
  transition: border-color 0.4s ease;
}

.ladder__rung {
  display: block;
  height: 2px;
  background: rgba(242, 243, 245, 0.14);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  /* rungs light bottom-up: Sequence 9 first */
  transition-delay: calc((9 - var(--r)) * 34ms);
}

.ladder.is-active .ladder__frame {
  border-color: color-mix(in srgb, var(--hue) 55%, transparent);
}

.ladder.is-active .ladder__rung {
  background: var(--hue);
  box-shadow: 0 0 10px color-mix(in srgb, var(--hue) 70%, transparent);
}

.ladder__sigil {
  position: relative;
  display: block;
  width: min(100%, 60px);
  aspect-ratio: 1;
}

.ladder__sigil::before {
  content: '';
  position: absolute;
  inset: -30%;
  background: radial-gradient(circle, color-mix(in srgb, var(--hue) 45%, transparent), transparent 66%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.ladder.is-active .ladder__sigil::before {
  opacity: 1;
}

.ladder__sigil img {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  filter: saturate(0.25) brightness(0.8);
  transition: filter 0.4s ease, transform 0.45s cubic-bezier(0.2, 0.7, 0.1, 1);
}

.ladder.is-active .ladder__sigil img {
  filter: none;
  transform: scale(1.18);
}

.ladder__first {
  display: none;
}

/* rising in, column by column */
.rv-ready .paths__field[data-rv] .ladder {
  opacity: 0;
  transform: translate3d(0, 60px, 0);
  transition: opacity 0.8s ease, transform 1s cubic-bezier(0.2, 0.7, 0.1, 1);
  transition-delay: calc(var(--n) * 28ms);
}

.rv-ready .paths__field[data-rv].is-in .ladder {
  opacity: 1;
  transform: none;
}

/* the reading of the active ladder */
.paths__detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 40px;
  align-items: baseline;
  min-height: 100px;
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--a-line);
}

.paths__detail-kicker {
  grid-column: 1 / -1;
  margin: 0;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-ink-3);
}

.paths__detail-name {
  margin: 0;
  font-family: var(--a-display);
  font-size: clamp(44px, 4.6vw, 76px);
  font-weight: 700;
  letter-spacing: 0;
  color: var(--hue);
  white-space: nowrap;
  transition: color 0.3s ease;
}

.paths__detail-ladder {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--a-ink-2);
}

.paths__detail-ladder b {
  margin-right: 6px;
  font-family: var(--a-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--hue);
}

/* ---------- Boons ---------- */
.paths__boons {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 28px 56px;
  align-items: center;
  margin-top: clamp(24px, 3.5vh, 40px);
  padding: 20px 28px;
  border: 1px solid var(--a-line);
  background: rgba(255, 255, 255, 0.02);
}

.paths__boons-title {
  margin: 0 0 8px;
  font-family: var(--a-head);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.paths__boons-body {
  margin: 0;
  color: var(--a-ink-2);
  font-size: 15px;
  line-height: 1.6;
}

.paths__boons-list {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.boon {
  position: relative;
  display: block;
  border-radius: 50%;
}

.boon img {
  display: block;
  width: 100%;
  height: auto;
  filter: saturate(0.3) brightness(0.85);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.boon:hover img,
.boon:focus-visible img {
  filter: none;
  transform: scale(1.12);
}

.boon:focus-visible {
  outline: 2px solid var(--a-accent);
  outline-offset: 3px;
}

.boon__name {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  padding: 4px 8px;
  background: rgba(10, 11, 13, 0.94);
  border: 1px solid var(--a-line-strong);
  font-family: var(--a-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--a-ink);
  opacity: 0;
  transform: translate(-50%, 4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}

.boon:hover .boon__name,
.boon:focus-visible .boon__name {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 1099px) {
  .paths__head {
    grid-template-columns: 1fr;
  }

  .paths__ladders {
    grid-template-columns: repeat(11, minmax(0, 1fr));
    gap: 28px 8px;
  }

  .ladder__name {
    height: 120px;
  }

  .ladder__frame {
    height: 150px;
  }

  .paths__boons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 699px) {
  .paths__field {
    margin-inline: calc(var(--gutter) * -1);
  }

  .paths__ladders {
    display: flex;
    gap: 6px;
    padding: 4px var(--gutter) 14px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--gutter);
    scrollbar-width: thin;
    -webkit-mask-image: linear-gradient(90deg, #000 85%, transparent);
    mask-image: linear-gradient(90deg, #000 85%, transparent);
  }

  .ladder {
    flex: 0 0 76px;
    scroll-snap-align: start;
  }

  .ladder__link {
    gap: 10px;
    padding: 10px 4px;
    border: 1px solid var(--a-line);
    transform: none !important;
    color: var(--a-ink);
  }

  .ladder__name {
    order: 2;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    height: 2.7em;
    writing-mode: horizontal-tb;
    transform: none;
    font-size: 9.5px;
    letter-spacing: 0.06em;
    white-space: normal;
    line-height: 1.3;
    text-align: center;
  }

  .ladder__frame {
    display: none;
  }

  .ladder__sigil {
    flex-shrink: 0;
    order: 1;
    width: 48px;
  }

  .ladder__sigil img {
    filter: none;
    transform: none !important;
  }

  .ladder.is-active .ladder__name {
    color: var(--a-ink);
  }

  .ladder.is-active .ladder__sigil::before {
    opacity: 0;
  }

  .paths__detail {
    display: none;
  }

  .paths__boons {
    padding: 22px 18px;
  }

  .paths__boons-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .rv-ready .paths__field[data-rv] .ladder {
    transition-delay: calc(var(--n) * 14ms);
    transform: translate3d(0, 20px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ladder__link,
  .ladder__rung,
  .ladder__sigil img {
    transition: none;
  }
}
</style>
