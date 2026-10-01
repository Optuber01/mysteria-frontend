<template>
  <section
    id="world"
    ref="section"
    class="world-story"
    :class="[staticMode ? 'world-story--static' : 'world-story--scroll', `world-story--${activeId}`]"
    aria-labelledby="world-title"
  >
    <div class="world-frame">
      <header class="world-heading" :class="{ 'is-hidden': !staticMode && !introVisible }">
        <p>{{ t('home.world.eyebrow') }}</p>
        <h2 id="world-title">{{ t('home.world.title') }}</h2>
      </header>

      <div class="world-rail">
        <article
          v-for="(feature, index) in features"
          :key="feature.id"
          class="world-beat"
          :class="[`world-beat--${feature.id}`, beatClass(index)]"
          :data-side="index % 2 === 0 ? 'right' : 'left'"
          :style="beatStyle(index)"
          :aria-hidden="isBeatHidden(index) ? 'true' : undefined"
        >
          <div class="world-media-box">
            <figure class="world-media">
              <video
                v-if="feature.video && !staticMode && inView && activeIndex === index"
                :src="feature.video"
                :poster="feature.image"
                :aria-label="featureText(feature.id, 'alt')"
                autoplay
                muted
                loop
                playsinline
                preload="metadata"
              />
              <img
                v-else
                :src="feature.image"
                :alt="featureText(feature.id, 'alt')"
                :width="feature.width"
                :height="feature.height"
                loading="lazy"
                decoding="async"
              >
              <div class="world-grade" />
            </figure>

            <template v-if="!staticMode">
              <div v-if="index < features.length - 1" class="next-chip" aria-hidden="true">
                <img :src="features[index + 1].image" alt="" loading="lazy" decoding="async">
                <span>{{ stageName(index + 1) }}</span>
                <i>→</i>
              </div>

              <figure
                v-for="(shot, shotIndex) in feature.gallery"
                :key="shot"
                class="world-shot"
                :class="`world-shot--${shotIndex + 1}`"
                aria-hidden="true"
              >
                <img :src="shot" alt="" loading="lazy" decoding="async">
              </figure>

              <div
                class="scene-marker"
                :class="[`scene-marker--${feature.pin}`, { 'is-dormant': !isHotspotLive(index) }]"
              >
                <button
                  type="button"
                  :aria-expanded="selectedMarker === index"
                  :aria-controls="`world-note-${feature.id}`"
                  :tabindex="isHotspotLive(index) ? 0 : -1"
                  @click="toggleMarker(index)"
                >
                  <i aria-hidden="true" />
                  <span>{{ featureText(feature.id, 'marker') }}</span>
                </button>
                <p :id="`world-note-${feature.id}`" :class="{ 'is-open': selectedMarker === index }">
                  {{ featureText(feature.id, 'note') }}
                </p>
              </div>
            </template>
          </div>

          <div class="world-copy">
            <span>{{ fieldNoteLabel(index) }}</span>
            <p>{{ featureText(feature.id, 'kicker') }}</p>
            <h3>{{ featureText(feature.id, 'title') }}</h3>
            <p class="world-body">{{ featureText(feature.id, 'copy') }}</p>
            <p class="world-proof">{{ featureText(feature.id, 'proof') }}</p>
          </div>
        </article>

        <article
          class="world-beat world-beat--live"
          :class="beatClass(LIVE_INDEX)"
          :style="beatStyle(LIVE_INDEX)"
          :aria-hidden="isBeatHidden(LIVE_INDEX) ? 'true' : undefined"
        >
          <div v-if="!staticMode" class="live-landscape" aria-hidden="true">
            <img :src="townsImage" alt="" width="1600" height="841" loading="lazy" decoding="async">
          </div>

          <div class="living-panel">
            <div class="living-intro">
              <span>{{ t('home.world.live.eyebrow') }}</span>
              <h3>{{ t('home.world.live.title') }}</h3>
              <p>{{ t('home.world.live.lede') }}</p>

              <div v-if="latestUpdate" class="living-update">
                <small>{{ t('home.world.live.latestUpdate') }}</small>
                <RouterLink
                  :to="$lp(`/news/${latestUpdate.slug}`)"
                  :lang="latestUpdate.language === 'UK' ? 'uk' : 'en'"
                  :tabindex="liveTabIndex"
                >
                  {{ latestUpdate.title }} <span aria-hidden="true">↗</span>
                </RouterLink>
              </div>
            </div>

            <div class="living-data" :aria-busy="statsPending ? 'true' : undefined">
              <dl class="living-tiles">
                <div v-for="tile in liveTiles" :key="tile.id" class="living-tile" :class="`living-tile--${tile.id}`">
                  <dt>
                    <i v-if="tile.id === 'server'" class="status-orb" :class="`status-orb--${status.state}`" aria-hidden="true" />
                    {{ tile.label }}
                  </dt>
                  <dd>
                    <strong v-if="tile.valueLabel"><span aria-hidden="true">{{ tile.value }}</span><span class="sr-only">{{ tile.valueLabel }}</span></strong>
                    <strong v-else>{{ tile.value }}</strong>
                    <span v-if="tile.detail">{{ tile.detail }}</span>
                  </dd>
                </div>
                <template v-if="statsPending">
                  <div v-for="slot in 3" :key="`pending-${slot}`" class="living-tile living-tile--pending" aria-hidden="true">
                    <dt><b /></dt>
                    <dd><b /></dd>
                  </div>
                </template>
              </dl>
              <p v-if="statsPending" class="sr-only" role="status">{{ t('home.world.live.statsLoading') }}</p>

              <div v-if="topPathways.length" class="living-pathways">
                <h4>{{ t('home.world.live.topPathways') }}</h4>
                <ol>
                  <li v-for="pathway in topPathways" :key="pathway.id">
                    <RouterLink :to="$lp(`/pathways/${pathway.id}`)" :tabindex="liveTabIndex">
                      <img v-if="pathway.image" :src="pathway.image" alt="" width="28" height="28" loading="lazy" decoding="async">
                      <span>{{ pathway.name }}</span>
                      <i aria-hidden="true"><b :style="{ width: `${pathway.share}%` }" /></i>
                      <strong>{{ pathway.count }}</strong>
                    </RouterLink>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </article>
      </div>

      <template v-if="!staticMode">
        <nav
          class="world-index"
          :class="{ 'is-visible': pinned }"
          :aria-label="t('home.world.railLabel')"
        >
          <button
            v-for="index in STAGE_COUNT"
            :key="index"
            type="button"
            :class="{ 'is-active': activeIndex === index - 1, 'is-live': index - 1 === LIVE_INDEX }"
            :aria-current="activeIndex === index - 1 ? 'step' : undefined"
            :aria-label="t('home.world.goTo').replace('{name}', stageName(index - 1))"
            @click="goToStage(index - 1)"
          >
            <span v-if="index - 1 === LIVE_INDEX" class="world-index__live" :class="`is-${status.state}`" aria-hidden="true" />
            <span v-else aria-hidden="true">{{ String(index).padStart(2, '0') }}</span>
            <strong aria-hidden="true">{{ stageName(index - 1) }}</strong>
          </button>
        </nav>

        <p class="world-direction" :class="{ 'is-hidden': !introVisible }" aria-hidden="true">
          <span>{{ t('home.world.scrollHint') }}</span><i />
        </p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useBeyonderStats } from '@/composables/useBeyonderStats';
import type { ServerStatus } from '@/composables/useSharedServerStatus';
import { corePathways, pathwayImage, pathwayName } from '@/data/pathways';
import creatureChamber from '@/assets/images/home/world/creature-chamber.webp';
import dungeonGate from '@/assets/images/community-archive/dungeons/twin-tree-rift/twin-tree-rift-wide.webp';
import dungeonEntranceVideo from '@/assets/images/community-archive/dungeons/twin-tree-rift/twin-tree-rift-entrance.mp4';
import eyeRift from '@/assets/images/community-archive/dungeons/eye-rift/eye-rift-front.webp';
import snowRingRift from '@/assets/images/community-archive/dungeons/snow-ring-rift/snow-ring-rift-clear-front.webp';
import guardianDragon from '@/assets/images/community-archive/events/guardians/guardian-dragon-encounter.webp';
import guardianRadiantWide from '@/assets/images/community-archive/events/guardians/guardian-radiant-encounter-wide.webp';
import guardianRadiantClose from '@/assets/images/community-archive/events/guardians/guardian-radiant-encounter-close.webp';
import cliffsideStreet from '@/assets/images/community-archive/towns/cliffside-harbor/cliffside-street.webp';
import townsImage from '@/assets/images/community-archive/towns/aurora-cliffside/aurora-waterfront.webp';
import eyeCanopy from '@/assets/images/community-archive/towns/eye-canopy/eye-canopy.webp';
import cathedralExterior from '@/assets/images/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import fogCathedralNave from '@/assets/images/community-archive/churches/fog-cathedral/cathedral-nave.webp';
import sanctuaryCeiling from '@/assets/images/community-archive/churches/black-gold-sanctuary/sanctuary-ceiling.webp';

type FeatureId = 'dungeons' | 'creatures' | 'events' | 'towns' | 'churches';
type FeatureField = 'short' | 'kicker' | 'title' | 'copy' | 'proof' | 'marker' | 'note' | 'alt';

type WorldFeature = {
  id: FeatureId;
  pin: 'high' | 'middle' | 'low';
  image: string;
  width: number;
  height: number;
  video?: string;
  gallery?: string[];
};

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string; language: 'EN' | 'UK' } | null;
}>();

/**
 * Pinned scrollytelling needs room for copy, media and the rail side by side.
 * Narrow, short and reduced-motion viewports get the same content in document
 * flow instead. DeferredHomeChapter reserves height with the same query.
 */
const STATIC_QUERY = '(max-width: 900px), (max-height: 700px), (prefers-reduced-motion: reduce)';

const features: WorldFeature[] = [
  {
    id: 'dungeons', pin: 'middle', image: dungeonGate, video: dungeonEntranceVideo, width: 1600, height: 868,
    gallery: [eyeRift, snowRingRift],
  },
  { id: 'creatures', pin: 'high', image: creatureChamber, width: 1075, height: 503 },
  {
    id: 'events', pin: 'middle', image: guardianDragon, width: 1600, height: 868,
    gallery: [guardianRadiantWide, guardianRadiantClose],
  },
  {
    id: 'towns', pin: 'low', image: townsImage, width: 1600, height: 841,
    gallery: [cliffsideStreet, eyeCanopy],
  },
  {
    id: 'churches', pin: 'middle', image: cathedralExterior, width: 1600, height: 841,
    gallery: [fogCathedralNave, sanctuaryCeiling],
  },
];

const LIVE_INDEX = features.length;
const STAGE_COUNT = features.length + 1;
const SPAN = STAGE_COUNT - 1;
/** Extra scroll (in stage units) the first and last stage rest for. */
const EDGE_REST = 0.3;
/** Share of each half-segment a stage holds still before the handoff starts. */
const HOLD = 0.28;

const { t, intlLocale, currentLanguage } = useI18n();
const { stats, loading: statsLoading } = useBeyonderStats();

const section = ref<HTMLElement | null>(null);
/** Continuous stage position, 0…SPAN; integers are resting scenes. */
const position = ref(0);
const pinned = ref(false);
const inView = ref(false);
const selectedMarker = ref<number | null>(null);
const staticQuery = window.matchMedia(STATIC_QUERY);
const staticMode = ref(staticQuery.matches);
let observer: IntersectionObserver | null = null;
let frame = 0;
const preloaded = new Set<string>();

const activeIndex = computed(() => Math.round(position.value));
const atRest = computed(() => Math.abs(position.value - activeIndex.value) < 0.04);
const introVisible = computed(() => activeIndex.value === 0 && atRest.value);
const activeId = computed(() => features[activeIndex.value]?.id ?? 'live');
const liveTabIndex = computed(() => (staticMode.value || activeIndex.value === LIVE_INDEX ? 0 : -1));

const numberFormat = computed(() => new Intl.NumberFormat(intlLocale.value));

function featureText(id: FeatureId, field: FeatureField) {
  return t(`home.world.features.${id}.${field}`);
}

function stageName(index: number) {
  return index === LIVE_INDEX ? t('home.world.liveStage') : featureText(features[index].id, 'short');
}

function fieldNoteLabel(index: number) {
  return t('home.world.fieldNote')
    .replace('{number}', String(index + 1).padStart(2, '0'))
    .replace('{name}', featureText(features[index].id, 'short'));
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

/** Maps raw section progress to a stage position with a resting hold per stage. */
function stagePosition(raw: number) {
  const scaled = Math.min(SPAN, Math.max(0, raw * (SPAN + EDGE_REST * 2) - EDGE_REST));
  const base = Math.min(Math.floor(scaled), SPAN - 1);
  const handoff = clamp01((scaled - base - HOLD) / (1 - HOLD * 2));
  return base + smoothstep(handoff);
}

function stageScrollTop(index: number) {
  if (!section.value) return 0;
  const raw = (index + EDGE_REST) / (SPAN + EDGE_REST * 2);
  const top = section.value.getBoundingClientRect().top + window.scrollY;
  return top + Math.max(0, section.value.offsetHeight - window.innerHeight) * raw;
}

function beatDistance(index: number) {
  return position.value - index;
}

function beatClass(index: number) {
  if (staticMode.value) return undefined;
  return {
    'is-active': activeIndex.value === index,
    'is-off': Math.abs(beatDistance(index)) >= 1,
  };
}

function isBeatHidden(index: number) {
  return !staticMode.value && activeIndex.value !== index;
}

function beatStyle(index: number) {
  if (staticMode.value) return undefined;
  const distance = beatDistance(index);
  const away = Math.min(1, Math.abs(distance));
  return {
    '--d': distance.toFixed(4),
    '--copy-alpha': (1 - smoothstep(clamp01(away / 0.42))).toFixed(3),
    '--media-alpha': (1 - away * 0.45).toFixed(3),
  };
}

function isHotspotLive(index: number) {
  return activeIndex.value === index && atRest.value;
}

function toggleMarker(index: number) {
  selectedMarker.value = selectedMarker.value === index ? null : index;
}

function goToStage(index: number) {
  window.scrollTo({ top: stageScrollTop(index), behavior: 'smooth' });
}

function measure() {
  frame = 0;
  const element = section.value;
  if (!element || staticMode.value) return;
  const rect = element.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  position.value = stagePosition(clamp01(-rect.top / travel));
  pinned.value = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
}

function update() {
  if (!inView.value || staticMode.value || frame) return;
  frame = requestAnimationFrame(measure);
}

function onStaticChange(event: MediaQueryListEvent) {
  staticMode.value = event.matches;
  selectedMarker.value = null;
  if (!event.matches) update();
}

function preloadStage(index: number) {
  const feature = features[index];
  if (!feature) return;
  for (const src of [feature.image, ...(feature.gallery ?? [])]) {
    if (preloaded.has(src)) continue;
    preloaded.add(src);
    new Image().src = src;
  }
}

watch(activeIndex, (index) => {
  selectedMarker.value = null;
  preloadStage(index + 1);
});

watch(atRest, (resting) => {
  if (!resting) selectedMarker.value = null;
});

const statsPending = computed(() => statsLoading.value && !stats.value);

const serverStateText = computed(() => {
  if (props.status.state === 'online') return t('home.world.live.online');
  if (props.status.state === 'offline') return t('home.world.live.offline');
  return t('home.world.live.checking');
});

const checkedTime = computed(() =>
  props.status.checkedAt?.toLocaleTimeString(intlLocale.value, { hour: '2-digit', minute: '2-digit' }) ?? '',
);

type LiveTile = { id: string; label: string; value: string; valueLabel?: string; detail?: string };

const liveTiles = computed<LiveTile[]>(() => {
  const { state, playersOnline } = props.status;
  const hasPlayers = state === 'online' && playersOnline !== null;
  const tiles: LiveTile[] = [
    {
      id: 'server',
      label: t('home.world.live.server'),
      value: serverStateText.value,
      detail: checkedTime.value ? t('home.world.live.checkedAt').replace('{time}', checkedTime.value) : undefined,
    },
    {
      id: 'players',
      label: t('home.world.live.playersOnline'),
      value: hasPlayers ? numberFormat.value.format(playersOnline) : '—',
      valueLabel: hasPlayers ? undefined : t('home.world.live.noCount'),
      detail: hasPlayers
        ? t('home.world.live.playersNow')
        : t(state === 'loading' ? 'home.world.live.playersLoading' : 'home.world.live.playersOffline'),
    },
  ];

  const data = stats.value;
  if (data && data.totalBeyonders > 0) {
    tiles.push(
      { id: 'beyonders', label: t('home.world.live.beyonders'), value: numberFormat.value.format(data.totalBeyonders) },
      { id: 'advanced', label: t('home.world.live.advanced'), value: numberFormat.value.format(data.advancedBeyonders) },
      {
        id: 'pathways',
        label: t('home.world.live.pathways'),
        value: t('home.world.live.pathwaysValue')
          .replace('{count}', numberFormat.value.format(data.uniquePathways))
          .replace('{total}', numberFormat.value.format(corePathways.length)),
      },
    );
  }
  return tiles;
});

const topPathways = computed(() => {
  const list = stats.value?.topPathways.slice(0, 3) ?? [];
  const max = Math.max(1, ...list.map((pathway) => pathway.count));
  return list.map((pathway) => ({
    id: pathway.name.toLowerCase(),
    name: pathwayName(pathway.name, currentLanguage.value),
    image: pathwayImage(pathway.name),
    count: numberFormat.value.format(pathway.count),
    share: Math.round((pathway.count / max) * 100),
  }));
});

onMounted(() => {
  staticQuery.addEventListener('change', onStaticChange);
  observer = new IntersectionObserver(([entry]) => {
    inView.value = entry.isIntersecting;
    if (entry.isIntersecting) update();
  }, { rootMargin: '10% 0px' });
  if (section.value) observer.observe(section.value);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
});

onUnmounted(() => {
  staticQuery.removeEventListener('change', onStaticChange);
  observer?.disconnect();
  window.removeEventListener('scroll', update);
  window.removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.world-story {
  position: relative;
  z-index: 2;
  isolation: isolate;
  color: var(--ink);
  background: var(--journey-mid);
}

.world-heading p,
.world-copy > span,
.world-copy > p:first-of-type,
.living-intro > span {
  margin: 0;
  color: var(--primary);
  font: 800 .68rem/1 "Manrope", sans-serif;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.world-heading h2 {
  margin: 12px 0 0;
  font: 700 clamp(2rem, 2.7vw, 2.6rem)/1 var(--font-display);
  letter-spacing: -.025em;
  text-wrap: balance;
}

.world-copy h3 {
  margin: 14px 0 0;
  font: 700 clamp(2rem, 3vw, 3rem)/.98 var(--font-display);
  letter-spacing: -.025em;
  text-wrap: balance;
}

.world-body {
  max-width: 46ch;
  margin: 18px 0 0;
  color: var(--ink-muted);
  font-size: clamp(.84rem, 1.05vw, 1rem);
  font-weight: 500;
  line-height: 1.65;
}

.world-proof {
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--hairline);
  color: var(--ink-muted);
  font: 600 .72rem/1.55 "Manrope", sans-serif;
}

.world-media {
  margin: 0;
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 0 0 1px var(--hairline), 0 32px 80px rgba(34, 28, 20, .16);
}

.world-media img,
.world-media video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.world-beat--dungeons .world-media :is(img, video) { object-position: 52% 52%; }
.world-beat--events .world-media img { object-position: 47% center; }
.world-beat--towns .world-media img { object-position: 54% 40%; }
.world-beat--churches .world-media img { object-position: 54% 45%; }

/* ---------- Living panel (shared by both layouts) ---------- */

.living-panel {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: 28px clamp(32px, 4vw, 64px);
  padding: clamp(28px, 3.4vw, 48px);
  border: 1px solid var(--hairline);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 32px 80px rgba(34, 28, 20, .14);
}

.living-intro h3 {
  margin: 14px 0 12px;
  font: 800 clamp(2rem, 3.4vw, 3rem)/1.02 var(--font-display);
  letter-spacing: -.025em;
  text-wrap: balance;
}

.living-intro > p {
  max-width: 42ch;
  margin: 0;
  color: var(--ink-muted);
  font-size: .86rem;
  font-weight: 500;
  line-height: 1.6;
}

.living-update {
  display: grid;
  gap: 8px;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--hairline);
}

.living-update small,
.living-tile dt,
.living-pathways h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--primary);
  font: 800 .6rem/1.3 "Manrope", sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.living-update a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: var(--ink);
  font-size: .9rem;
  font-weight: 700;
  line-height: 1.35;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--primary) 35%, transparent);
  text-underline-offset: 4px;
  transition: color .2s ease, text-decoration-color .2s ease;
}

.living-update a:hover { color: var(--primary); text-decoration-color: currentColor; }
.living-update a span { margin-left: 6px; color: var(--primary); }

.living-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--hairline);
  border-radius: 16px;
  background: var(--hairline);
}

.living-tile {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 18px 20px;
  background: var(--surface);
}

.living-tile:last-child:nth-child(odd) { grid-column: 1 / -1; }

.living-tile dd { display: grid; gap: 8px; margin: 0; }

.living-tile strong {
  color: var(--ink);
  font: 800 clamp(1.8rem, 2.8vw, 2.6rem)/1 "Manrope", sans-serif;
  letter-spacing: -.025em;
  font-variant-numeric: tabular-nums;
}

.living-tile dd span {
  color: var(--ink-muted);
  font: 500 .7rem/1.35 "Manrope", sans-serif;
}

.living-tile--pending b {
  display: block;
  width: 58%;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--hairline), color-mix(in srgb, var(--hairline) 40%, var(--surface)), var(--hairline));
  background-size: 200% 100%;
  animation: living-shimmer 1.6s ease-in-out infinite;
}

.living-tile--pending dd b { width: 40%; height: 32px; border-radius: 10px; }

.status-orb {
  width: 8px;
  aspect-ratio: 1;
  flex: none;
  border-radius: 50%;
  background: var(--ink-muted);
}

.status-orb--online { background: var(--live); box-shadow: 0 0 12px color-mix(in srgb, var(--live) 60%, transparent); }
.status-orb--offline { background: var(--sunset-deep, #e85b33); }
.status-orb--loading { animation: status-pulse 1.4s ease-in-out infinite; }

.living-pathways { margin-top: 22px; }

.living-pathways ol {
  display: grid;
  gap: 2px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.living-pathways a {
  min-height: 44px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) minmax(60px, 34%) auto;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  color: var(--ink);
  font-size: .78rem;
  font-weight: 700;
  transition: background-color .2s ease;
}

.living-pathways a:hover { background: var(--primary-tint); }
.living-pathways img { width: 28px; height: 28px; object-fit: contain; }
.living-pathways a > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.living-pathways i { height: 4px; overflow: hidden; border-radius: 999px; background: var(--hairline); }
.living-pathways i b { display: block; height: 100%; border-radius: inherit; background: var(--primary); }
.living-pathways strong { min-width: 4ch; color: var(--ink-muted); font-size: .72rem; font-variant-numeric: tabular-nums; text-align: right; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---------- Pinned scroll layout ---------- */

.world-story--scroll {
  min-height: 460svh;
}

.world-story--scroll .world-frame {
  --w-inset: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  --w-rail: 64px;
  --w-rail-zone: calc(var(--w-inset) + var(--w-rail) + clamp(16px, 2vw, 28px));
  --w-top: calc(var(--home-header-height, 68px) + clamp(16px, 2.6vh, 28px));
  --w-bottom: clamp(56px, 8vh, 96px);
  --w-text: min(380px, 30vw);
  --w-gap: clamp(28px, 3.6vw, 60px);
  --w-copy-top: calc(var(--w-top) + clamp(140px, 18vh, 176px));
  --w-media-w: min(
    calc(100vw - var(--w-inset) - var(--w-rail-zone) - var(--w-text) - var(--w-gap)),
    calc((100svh - var(--w-top) - var(--w-bottom)) * 1.25),
    960px
  );
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 650px;
  overflow: clip;
  isolation: isolate;
  background: var(--journey-mid);
}

.world-story--scroll .world-heading {
  position: absolute;
  z-index: 10;
  top: var(--w-top);
  left: var(--w-inset);
  width: calc(var(--w-text) + var(--w-gap) * .5);
  pointer-events: none;
  transition: opacity .45s ease, transform .6s cubic-bezier(.22, 1, .36, 1);
}

.world-story--scroll .world-heading.is-hidden {
  opacity: 0;
  transform: translate3d(0, -12px, 0);
}

.world-story--scroll .world-rail {
  position: absolute;
  inset: 0;
}

.world-story--scroll .world-beat {
  position: absolute;
  inset: 0;
  transform: translate3d(calc(var(--d, 0) * -100%), 0, 0);
}

.world-story--scroll .world-beat.is-off { visibility: hidden; }

.world-story--scroll .world-media-box {
  position: absolute;
  z-index: 2;
  top: calc(50% + (var(--w-top) - var(--w-bottom)) / 2);
  width: var(--w-media-w);
  aspect-ratio: 5 / 4;
  transform: translate3d(0, -50%, 0);
}

.world-story--scroll .world-beat[data-side='right'] .world-media-box { right: var(--w-rail-zone); }
.world-story--scroll .world-beat[data-side='left'] .world-media-box { left: var(--w-inset); }

.world-story--scroll .world-media {
  position: absolute;
  inset: 0;
  opacity: var(--media-alpha, 1);
}

.world-story--scroll .world-media :is(img, video) {
  transform: translate3d(calc(var(--d, 0) * 8%), 0, 0) scale(1.1);
}

.world-grade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.world-story--scroll .world-beat[data-side='right'] .world-grade {
  background: linear-gradient(to left, rgba(251, 247, 239, .55), rgba(251, 247, 239, 0) 38%);
}

.world-story--scroll .world-beat[data-side='left'] .world-grade {
  background: linear-gradient(to right, rgba(251, 247, 239, .55), rgba(251, 247, 239, 0) 38%);
}

.world-story--scroll .world-copy {
  position: absolute;
  z-index: 6;
  top: var(--w-copy-top);
  width: var(--w-text);
  opacity: var(--copy-alpha, 1);
  transform: translate3d(calc(var(--d, 0) * 14vw), 0, 0);
  pointer-events: none;
}

.world-story--scroll .world-beat[data-side='right'] .world-copy { left: var(--w-inset); }
.world-story--scroll .world-beat[data-side='left'] .world-copy { right: var(--w-rail-zone); }
.world-story--scroll .world-copy > p:first-of-type { margin-top: 13px; }

.next-chip {
  position: absolute;
  z-index: 4;
  right: 18px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .08);
  pointer-events: none;
}

.next-chip img {
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 1px var(--hairline);
}

.next-chip span {
  color: var(--ink-muted);
  font: 800 .56rem/1 "Manrope", sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.next-chip i { color: var(--primary); font: 800 .78rem/1 "Manrope", sans-serif; }

.world-shot {
  position: absolute;
  z-index: 3;
  margin: 0;
  padding: 7px;
  border: 1px solid var(--hairline);
  background: #f4ead6;
  box-shadow: 0 22px 48px rgba(34, 28, 20, .24);
  pointer-events: none;
}

.world-shot img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.world-shot--1 {
  top: 15%;
  right: 22px;
  width: clamp(132px, 26%, 236px);
  transform: rotate(1.6deg) translate3d(calc(var(--d, 0) * -24px), 0, 0);
}

.world-shot--2 {
  bottom: -14px;
  right: calc(clamp(132px, 26%, 236px) + 6px);
  width: clamp(116px, 22%, 200px);
  transform: rotate(-2deg) translate3d(calc(var(--d, 0) * -40px), 0, 0);
}

.scene-marker {
  position: absolute;
  z-index: 5;
  left: 24px;
  color: var(--ink);
  transition: opacity .25s ease;
}

.scene-marker--high { top: 18%; }
.scene-marker--middle { top: 42%; }
.scene-marker--low { top: 66%; }

.scene-marker.is-dormant {
  opacity: 0;
  pointer-events: none;
}

.scene-marker button {
  position: relative;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 14px 5px 5px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  color: inherit;
  background: var(--surface);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .12);
  cursor: pointer;
  transition: box-shadow .25s ease, border-color .25s ease;
}

.scene-marker button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: calc(100% + 14px);
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 50%;
  background: var(--champagne);
  box-shadow: 0 0 0 4px rgba(217, 180, 90, .3);
}

.scene-marker button:hover { border-color: color-mix(in srgb, var(--primary) 40%, var(--hairline)); box-shadow: 0 16px 40px rgba(34, 28, 20, .16); }

.scene-marker button i {
  width: 30px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--primary-tint);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s ease;
}

.scene-marker button i::after { content: "+"; color: var(--primary); font: 800 15px/1 "Manrope", sans-serif; }
.scene-marker button[aria-expanded="true"] i::after { content: "−"; }

.scene-marker button:hover i,
.scene-marker button:focus-visible i {
  transform: scale(1.12);
  box-shadow: 0 0 0 7px rgba(116, 88, 232, .22);
}

.scene-marker button span { font-size: .7rem; font-weight: 700; white-space: nowrap; }

.scene-marker > p {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(290px, calc(var(--w-media-w) - 48px));
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 20px;
  color: var(--ink-muted);
  background: var(--surface);
  box-shadow: 0 24px 60px rgba(34, 28, 20, .14);
  font-size: .76rem;
  font-weight: 500;
  line-height: 1.55;
  opacity: 0;
  visibility: hidden;
  transform: translate3d(0, -7px, 0);
  transition: opacity .22s ease, transform .35s cubic-bezier(.22, 1, .36, 1), visibility 0s linear .35s;
}

/* Low hotspots open upward so the note stays inside the frame. */
.scene-marker--low > p {
  top: auto;
  bottom: calc(100% + 8px);
  transform: translate3d(0, 7px, 0);
}

.scene-marker > p.is-open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition-delay: 0s;
}

.live-landscape {
  position: absolute;
  inset: 0;
  opacity: var(--media-alpha, 1);
}

.live-landscape img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  transform: translate3d(calc(var(--d, 0) * 6%), 0, 0) scale(1.08);
}

.world-story--scroll .living-panel {
  position: absolute;
  z-index: 6;
  top: calc(50% + (var(--w-top) - var(--w-bottom)) / 2);
  left: var(--w-inset);
  width: min(1180px, calc(100% - var(--w-inset) - var(--w-rail-zone)));
  max-height: calc(100% - var(--w-top) - var(--w-bottom));
  box-sizing: border-box;
  overflow: auto;
  opacity: var(--copy-alpha, 1);
  transform: translate3d(calc(var(--d, 0) * 14vw), -50%, 0);
}

.world-index {
  position: absolute;
  z-index: 12;
  top: 50%;
  right: var(--w-inset);
  width: var(--w-rail);
  display: grid;
  gap: 2px;
  padding: 10px 0;
  box-sizing: border-box;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .1);
  opacity: 0;
  pointer-events: none;
  transform: translate3d(8px, -50%, 0);
  transition: opacity .3s ease, transform .45s cubic-bezier(.22, 1, .36, 1);
}

.world-index.is-visible,
.world-index:focus-within {
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(0, -50%, 0);
}

.world-index button {
  position: relative;
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0;
  border: 0;
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
  transition: color .2s ease;
}

.world-index button::after {
  content: "";
  width: 12px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  opacity: .55;
  transition: width .35s cubic-bezier(.22, 1, .36, 1), opacity .2s ease;
}

.world-index button::before {
  content: "";
  position: absolute;
  inset: 3px 8px;
  z-index: -1;
  border-radius: 999px;
  background: var(--primary-tint);
  opacity: 0;
  transition: opacity .2s ease;
}

.world-index button > span { font: 700 .58rem/1 "Manrope", sans-serif; letter-spacing: .06em; font-variant-numeric: tabular-nums; }

.world-index button:hover,
.world-index button:focus-visible { color: var(--ink); }
.world-index button:hover::before,
.world-index button:focus-visible::before { opacity: 1; }
.world-index button:hover::after,
.world-index button:focus-visible::after { width: 18px; opacity: 1; }

.world-index button.is-active { color: var(--primary); }
.world-index button.is-active::after { width: 20px; opacity: 1; }

.world-index__live {
  width: 8px;
  height: 8px;
  margin: 0 3px;
  border-radius: 50%;
  background: var(--ink-muted);
}

.world-index__live.is-online { background: var(--live); }
.world-index__live.is-offline { background: var(--sunset-deep, #e85b33); }

/* Stage names fly out to the left on hover/focus instead of widening the rail. */
.world-index strong {
  position: absolute;
  top: 50%;
  right: calc(100% + 10px);
  padding: 7px 12px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  color: var(--ink);
  background: var(--surface);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .1);
  font-size: .66rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(6px, -50%, 0);
  transition: opacity .2s ease, transform .3s cubic-bezier(.22, 1, .36, 1);
}

.world-index button:hover strong,
.world-index button:focus-visible strong {
  opacity: 1;
  transform: translate3d(0, -50%, 0);
}

.world-direction {
  position: absolute;
  z-index: 11;
  left: var(--w-inset);
  bottom: 26px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--ink-muted);
  font: 800 .58rem/1 "Manrope", sans-serif;
  letter-spacing: .14em;
  text-transform: uppercase;
  transition: opacity .35s ease;
}

.world-direction.is-hidden { opacity: 0; }
.world-direction i { width: 56px; height: 1px; background: linear-gradient(90deg, var(--primary), var(--hairline)); }

@media (max-width: 1100px) {
  .world-story--scroll .world-frame { --w-text: min(340px, 34vw); }
  .world-shot { display: none; }
}

@media (max-height: 820px) {
  .world-story--scroll .world-copy h3 { font-size: clamp(1.6rem, 4.5vh + .8rem, 2.4rem); }
  .world-story--scroll .world-heading h2 { font-size: clamp(1.7rem, 3.6vh + .6rem, 2.2rem); }
  .world-story--scroll .world-body { margin-top: 14px; font-size: .84rem; }
  .world-story--scroll .world-frame { --w-copy-top: calc(var(--w-top) + 130px); }
}

@media (max-width: 1180px), (max-height: 820px) {
  .world-story--scroll .living-pathways { display: none; }
}

/* ---------- Document-flow layout (narrow, short, reduced motion) ---------- */

.world-story--static .world-frame {
  box-sizing: border-box;
  width: min(var(--home-content-max, 1440px), 100%);
  margin: 0 auto;
  padding: var(--home-section-block, 96px) var(--home-content-gutter, 20px);
}

.world-story--static .world-heading { max-width: 760px; margin: 0 0 clamp(36px, 6vw, 64px); }
.world-story--static .world-heading h2 { font-size: clamp(2.1rem, 6vw, 3.6rem); }

.world-story--static .world-rail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(42px, 7vw, 72px) clamp(22px, 4vw, 42px);
}

.world-story--static .world-beat {
  min-width: 0;
  display: grid;
  align-content: start;
}

.world-story--static .world-media { aspect-ratio: 16 / 10; }

.world-story--static .world-copy {
  position: relative;
  z-index: 1;
  margin: -30px 0 0 18px;
  padding: 22px 0 0 20px;
  border-left: 1px solid var(--hairline);
  background: linear-gradient(90deg, var(--journey-mid) 0 76%, transparent);
}

.world-story--static .world-copy > p:first-of-type { margin-top: 10px; }
.world-story--static .world-copy h3 { margin-top: 10px; font-size: clamp(1.55rem, 4vw, 2.3rem); }
.world-story--static .world-body { margin-top: 12px; font-size: .86rem; }

.world-story--static .world-beat--live { grid-column: 1 / -1; }

@media (max-width: 700px) {
  .world-story--static .world-rail { grid-template-columns: minmax(0, 1fr); }
  .living-panel { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 420px) {
  .living-tile { padding: 16px; }
  .living-tile strong { font-size: 1.7rem; }
}

@keyframes status-pulse { 50% { opacity: .35; transform: scale(.72); } }
@keyframes living-shimmer { to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .living-tile--pending b,
  .status-orb--loading { animation: none; }
}
</style>
