<template>
  <section
    id="world"
    ref="sectionRef"
    class="case-files"
    :class="{ 'is-armed': armed, 'is-revealed': revealed }"
    aria-labelledby="world-title"
  >
    <div class="case-files__fog" aria-hidden="true" />

    <header class="case-head">
      <div>
        <p class="fog-label">{{ t('home.world.kicker') }}</p>
        <h2 id="world-title">{{ t('home.world.titleLead') }} <em>{{ t('home.world.titleAccent') }}</em></h2>
      </div>
      <p>{{ t('home.world.intro') }}</p>
    </header>

    <div class="case-list">
      <article
        v-for="(file, index) in CASES"
        :key="file.id"
        class="case"
        :class="`case--${file.id}`"
        :style="{ '--i': index }"
        :aria-labelledby="`case-${file.id}-title`"
      >
        <div class="case__evidence">
          <figure class="exhibit">
            <img
              :src="file.image.src"
              :alt="caseText(file.id, 'alt')"
              :width="file.image.width"
              :height="file.image.height"
              loading="lazy"
              decoding="async"
            >
            <figcaption>
              <span>{{ exhibitLabel(index) }}</span> {{ caseText(file.id, 'caption') }}
            </figcaption>
          </figure>
          <figure class="exhibit exhibit--detail">
            <img
              :src="file.detail.src"
              :alt="caseText(file.id, 'detailAlt')"
              :width="file.detail.width"
              :height="file.detail.height"
              loading="lazy"
              decoding="async"
            >
          </figure>
        </div>

        <div class="case__file">
          <p class="case__meta">
            <span>{{ t('home.world.caseNumber').replace('{number}', String(index + 1).padStart(2, '0')) }}</span>
            <b>{{ caseText(file.id, 'stamp') }}</b>
          </p>
          <h3 :id="`case-${file.id}-title`">{{ caseText(file.id, 'title') }}</h3>
          <p class="case__copy">{{ caseText(file.id, 'copy') }}</p>
          <p class="case__proof">{{ caseText(file.id, 'proof') }}</p>
        </div>
      </article>
    </div>

    <div class="ledger" role="group" aria-labelledby="ledger-title" :aria-busy="statsPending ? 'true' : undefined">
      <div class="ledger__head">
        <p class="ledger__kicker">{{ t('home.world.ledger.kicker') }}</p>
        <h3 id="ledger-title">{{ t('home.world.ledger.title') }}</h3>
        <p class="ledger__lede">{{ t('home.world.ledger.lede') }}</p>
        <p v-if="checkedTime" class="ledger__checked">
          {{ t('home.world.ledger.checkedAt').replace('{time}', checkedTime) }}
        </p>
        <p v-if="latestUpdate" class="ledger__update">
          <span>{{ t('home.world.ledger.latestUpdate') }}</span>
          <RouterLink :to="$lp(`/news/${latestUpdate.slug}`)" :lang="latestUpdate.language === 'UK' ? 'uk' : 'en'">
            {{ latestUpdate.title }}<b aria-hidden="true">→</b>
          </RouterLink>
        </p>
      </div>

      <div class="ledger__body">
        <dl class="ledger__entries">
          <div v-for="entry in entries" :key="entry.id" class="ledger__entry" :class="`ledger__entry--${entry.id}`">
            <dt>{{ entry.label }}</dt>
            <dd>
              <i v-if="entry.id === 'server'" class="ledger__orb" :class="`is-${status.state}`" aria-hidden="true" />
              <strong v-if="entry.srLabel"><span aria-hidden="true">{{ entry.value }}</span><span class="visually-hidden">{{ entry.srLabel }}</span></strong>
              <strong v-else>{{ entry.value }}</strong>
            </dd>
          </div>
        </dl>

        <p v-if="statsPending" class="ledger__pending" role="status">{{ t('home.world.ledger.statsLoading') }}</p>

        <div v-if="topPathways.length" class="ledger__top">
          <h4>{{ t('home.world.ledger.topPathways') }}</h4>
          <ol>
            <li v-for="(pathway, index) in topPathways" :key="pathway.id">
              <RouterLink :to="$lp(`/pathways/${pathway.id}`)">
                <span class="ledger__rank" aria-hidden="true">{{ ['I', 'II', 'III'][index] }}</span>
                <span class="ledger__name">{{ pathway.name }}</span>
                <span class="ledger__count">{{ pathway.walkers }}</span>
              </RouterLink>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useBeyonderStats } from '@/composables/useBeyonderStats';
import type { ServerStatus } from '@/composables/useSharedServerStatus';
import { corePathways, pathwayName } from '@/data/pathways';
import eyeRift from '@/assets/images/community-archive/dungeons/eye-rift/eye-rift-front.webp';
import snowRingRift from '@/assets/images/community-archive/dungeons/snow-ring-rift/snow-ring-rift-clear-front.webp';
import guardianDragon from '@/assets/images/community-archive/events/guardians/guardian-dragon-encounter.webp';
import guardianRadiant from '@/assets/images/community-archive/events/guardians/guardian-radiant-encounter-close.webp';
import cathedralExterior from '@/assets/images/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import cathedralNave from '@/assets/images/community-archive/churches/fog-cathedral/cathedral-nave.webp';

type CaseId = 'rifts' | 'guardians' | 'churches';
type CaseField = 'stamp' | 'title' | 'copy' | 'proof' | 'caption' | 'alt' | 'detailAlt';

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string; language: 'EN' | 'UK' } | null;
}>();

type Print = { src: string; width: number; height: number };

/** Each file: a main print and a smaller detail print pinned over its corner. */
const CASES: { id: CaseId; image: Print; detail: Print }[] = [
  {
    id: 'rifts',
    image: { src: eyeRift, width: 960, height: 521 },
    detail: { src: snowRingRift, width: 960, height: 521 },
  },
  {
    id: 'guardians',
    image: { src: guardianDragon, width: 1600, height: 868 },
    detail: { src: guardianRadiant, width: 960, height: 521 },
  },
  {
    id: 'churches',
    image: { src: cathedralExterior, width: 1600, height: 841 },
    detail: { src: cathedralNave, width: 960, height: 504 },
  },
];

const { t, intlLocale, currentLanguage } = useI18n();
const { stats, loading: statsLoading } = useBeyonderStats();

const sectionRef = ref<HTMLElement | null>(null);
/** Files rise in once, only when motion is allowed and the observer can tell us when. */
const armed = ref(false);
const revealed = ref(false);
let observer: IntersectionObserver | null = null;

const numberFormat = computed(() => new Intl.NumberFormat(intlLocale.value));

function caseText(id: CaseId, field: CaseField) {
  return t(`home.world.cases.${id}.${field}`);
}

function exhibitLabel(index: number) {
  return t('home.world.exhibit').replace('{letter}', String.fromCharCode(65 + index));
}

const statsPending = computed(() => statsLoading.value && !stats.value);

const checkedTime = computed(() =>
  props.status.checkedAt?.toLocaleTimeString(intlLocale.value, { hour: '2-digit', minute: '2-digit' }) ?? '',
);

type LedgerEntry = { id: string; label: string; value: string; srLabel?: string };

const entries = computed<LedgerEntry[]>(() => {
  const { state, playersOnline } = props.status;
  const format = numberFormat.value;
  const hasPlayers = state === 'online' && playersOnline !== null;
  const list: LedgerEntry[] = [
    {
      id: 'server',
      label: t('home.world.ledger.server'),
      value: t(`home.world.ledger.${state === 'loading' ? 'checking' : state}`),
    },
    {
      id: 'players',
      label: t('home.world.ledger.playersOnline'),
      value: hasPlayers ? format.format(playersOnline) : '—',
      srLabel: hasPlayers ? undefined : t('home.world.ledger.noCount'),
    },
  ];

  const data = stats.value;
  if (data && data.totalBeyonders > 0) {
    list.push(
      { id: 'beyonders', label: t('home.world.ledger.beyonders'), value: format.format(data.totalBeyonders) },
      { id: 'advanced', label: t('home.world.ledger.advanced'), value: format.format(data.advancedBeyonders) },
      {
        id: 'pathways',
        label: t('home.world.ledger.pathways'),
        value: t('home.world.ledger.pathwaysValue')
          .replace('{count}', format.format(data.uniquePathways))
          .replace('{total}', format.format(corePathways.length)),
      },
    );
  }
  return list;
});

const topPathways = computed(() =>
  (stats.value?.topPathways.slice(0, 3) ?? []).map((pathway) => ({
    id: pathway.name.toLowerCase(),
    name: pathwayName(pathway.name, currentLanguage.value),
    walkers: t('home.world.ledger.walkers').replace('{count}', numberFormat.value.format(pathway.count)),
  })),
);

onMounted(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window) || !sectionRef.value) return;
  armed.value = true;
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    revealed.value = true;
    observer?.disconnect();
    observer = null;
  }, { threshold: 0.12 });
  observer.observe(sectionRef.value);
});

onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.case-files {
  position: relative;
  padding: clamp(72px, 9vh, 104px) 0 clamp(72px, 10vh, 120px);
  overflow: clip;
  color: var(--bone);
  background:
    radial-gradient(ellipse 70% 40% at 50% 46%, rgba(30, 34, 43, .62), transparent 74%),
    var(--fog-0);
  isolation: isolate;
}

/* One slow fog bank behind the files, transform-only. */
.case-files__fog {
  position: absolute;
  z-index: -1;
  top: 22%;
  left: -50%;
  width: 200%;
  height: 56%;
  pointer-events: none;
  background-image:
    radial-gradient(ellipse 14% 34% at 18% 50%, rgba(176, 184, 196, .08), transparent 70%),
    radial-gradient(ellipse 16% 28% at 52% 34%, rgba(176, 184, 196, .06), transparent 70%),
    radial-gradient(ellipse 13% 36% at 84% 62%, rgba(176, 184, 196, .08), transparent 70%);
  background-repeat: repeat-x;
  background-size: 50% 100%;
  animation: case-fog 80s linear infinite;
}

@keyframes case-fog {
  to { transform: translate3d(-25%, 0, 0); }
}

.case-head,
.case-list,
.ledger {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin-inline: auto;
}

/* ---- Heading ---- */
.case-head {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: end;
  gap: 20px 64px;
}

.case-head h2 {
  margin: 18px 0 0;
  font: 600 clamp(36px, 5vw, 72px)/1.02 var(--font-display);
  text-wrap: balance;
}

.case-head h2 em {
  display: block;
  color: var(--ash);
  font-style: italic;
  font-weight: 500;
}

.case-head > p {
  max-width: 460px;
  margin: 0;
  color: var(--ash);
  font-size: 1rem;
  line-height: 1.6;
}

/* ---- Case files ---- */
.case-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: clamp(24px, 3vw, 44px);
  margin-top: clamp(48px, 7vh, 72px);
}

.case {
  min-width: 0;
  transition: opacity .7s var(--ease-out), transform .7s var(--ease-out);
  transition-delay: calc(var(--i) * 110ms);
}

/* Files sit a little out of line, as if dropped on the table. */
.case:nth-child(2) { margin-top: 36px; }

.is-armed:not(.is-revealed) .case {
  opacity: 0;
  transform: translate3d(0, 16px, 0);
}

.case__evidence {
  position: relative;
  z-index: 2;
  margin: 0 clamp(10px, 1.4vw, 20px) -34px;
}

/* A print: paper border, wide bottom margin for the caption, tape across the top. */
.exhibit {
  position: relative;
  margin: 0;
  padding: 8px 8px 0;
  border-radius: 6px;
  background: var(--paper);
  box-shadow: 0 18px 40px rgba(0, 0, 0, .5);
  transform: rotate(-1.4deg);
}

.case:nth-child(2) .exhibit:not(.exhibit--detail) { transform: rotate(1.1deg); }
.case:nth-child(3) .exhibit:not(.exhibit--detail) { transform: rotate(-.7deg); }

.exhibit::before {
  content: "";
  position: absolute;
  z-index: 1;
  top: -11px;
  left: 50%;
  width: 84px;
  height: 22px;
  background: rgba(232, 224, 207, .42);
  box-shadow: 0 1px 2px rgba(0, 0, 0, .25);
  transform: translateX(-50%) rotate(-3deg);
}

.exhibit img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  border-radius: 2px;
  object-fit: cover;
}

.exhibit figcaption {
  padding: 9px 2px 11px;
  overflow: hidden;
  color: var(--paper-ink-muted);
  font: 600 .78rem/1.3 var(--font-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exhibit figcaption span { color: var(--paper-ink); }

/* The second print is pinned over the corner of the first. */
.exhibit--detail {
  position: absolute;
  right: -8px;
  bottom: -26px;
  width: 42%;
  padding: 5px;
  transform: rotate(4deg);
}

.exhibit--detail::before {
  top: 6px;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--crimson);
  box-shadow: 0 2px 3px rgba(0, 0, 0, .5), inset -2px -2px 0 rgba(0, 0, 0, .25);
  transform: translateX(-50%);
}

.case--guardians .exhibit--detail { top: -22px; bottom: auto; transform: rotate(-3.5deg); }

/* The dark file the prints are clipped to. */
.case__file {
  position: relative;
  padding: 62px clamp(20px, 2vw, 30px) 28px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(196, 204, 214, .035), transparent 40%),
    var(--fog-2);
  box-shadow: var(--shadow-deep);
}

/* File number and a rubber stamp naming the kind of case. */
.case__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
}

.case__meta span {
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.case__meta b {
  padding: 6px 10px 5px;
  border: 2px solid var(--crimson-text);
  border-radius: 3px;
  color: var(--crimson-text);
  font: 800 .78rem/1 var(--font-body);
  letter-spacing: .2em;
  text-transform: uppercase;
  box-shadow: inset 0 0 0 2px var(--fog-2), inset 0 0 0 3px rgba(229, 84, 93, .5);
  opacity: .92;
  transform: rotate(-5deg);
}

.case__file h3 {
  margin: 0;
  font: 600 clamp(28px, 2.3vw, 34px)/1.05 var(--font-display);
  text-wrap: balance;
}

.case__copy {
  margin: 14px 0 0;
  color: var(--ash);
  font-size: .96rem;
  line-height: 1.6;
}

.case__proof {
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px dashed var(--line-strong);
  color: var(--bone);
  font-size: .9rem;
  font-weight: 600;
  line-height: 1.5;
}

/* ---- The ledger: a paper sheet with a ruled crimson margin ---- */
.ledger {
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr);
  align-items: center;
  gap: 0 clamp(28px, 4vw, 64px);
  margin-top: clamp(64px, 9vh, 96px);
  padding: clamp(28px, 3vw, 40px) clamp(24px, 3.4vw, 48px) clamp(28px, 3vw, 40px) clamp(40px, 5vw, 76px);
  border-radius: 6px;
  color: var(--paper-ink);
  background:
    linear-gradient(90deg, transparent calc(clamp(40px, 5vw, 76px) - 18px), rgba(179, 32, 43, .45) 0 calc(clamp(40px, 5vw, 76px) - 17px), transparent 0 calc(clamp(40px, 5vw, 76px) - 14px), rgba(179, 32, 43, .45) 0 calc(clamp(40px, 5vw, 76px) - 13px), transparent 0),
    var(--paper);
  box-shadow: var(--shadow-deep);
}

.ledger :where(a):focus-visible { outline-color: var(--paper-ink); }

.ledger__head { align-self: start; }

.ledger__kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--paper-ink-muted);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.ledger__kicker::before { content: ""; width: 18px; height: 1px; background: var(--crimson); }

.ledger__head h3 {
  margin: 14px 0 10px;
  font: 600 clamp(30px, 3vw, 42px)/1.02 var(--font-display);
  text-wrap: balance;
}

.ledger__lede,
.ledger__checked {
  max-width: 34ch;
  margin: 0;
  color: var(--paper-ink-muted);
  font-size: .94rem;
  line-height: 1.55;
}

.ledger__checked {
  margin-top: 16px;
  color: var(--paper-ink);
  font-variant-numeric: tabular-nums;
}

/* Tonight's two figures share the first line; the season's three the second. */
.ledger__entries {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  row-gap: 22px;
  margin: 0;
}

.ledger__entry {
  grid-column: span 2;
  min-width: 0;
  padding: 6px 18px 8px;
  border-left: 1px solid rgba(29, 27, 23, .18);
}

.ledger__entry--server,
.ledger__entry--players { grid-column: span 3; }

.ledger__entry dt {
  color: var(--paper-ink-muted);
  font: 600 .8rem/1.3 var(--font-body);
}

.ledger__entry dd {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0 0;
}

.ledger__entry strong {
  font: 600 clamp(36px, 3.4vw, 50px)/1 var(--font-display);
  font-variant-numeric: lining-nums tabular-nums;
  white-space: nowrap;
}

.ledger__orb {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: var(--paper-ink-muted);
}

.ledger__orb.is-online { background: #23905d; box-shadow: 0 0 0 3px rgba(35, 144, 93, .2); }
.ledger__orb.is-offline { background: var(--crimson); }
.ledger__orb.is-loading { animation: ledger-pulse 1.4s ease-in-out infinite; }

.ledger__pending {
  margin: 18px 0 0 18px;
  color: var(--paper-ink-muted);
  font-size: .9rem;
}

.ledger__top {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid rgba(29, 27, 23, .18);
}

.ledger__top h4,
.ledger__update span {
  margin: 0;
  color: var(--paper-ink-muted);
  font: 600 .8rem/1.3 var(--font-body);
}

.ledger__top ol {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}

.ledger__top a {
  min-height: 44px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 0 10px;
  padding: 6px 10px 6px 0;
  color: var(--paper-ink);
  text-decoration: none;
}

.ledger__rank {
  grid-row: span 2;
  color: var(--crimson);
  font: italic 600 1.9rem/1 var(--font-display);
}

.ledger__name {
  overflow: hidden;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: rgba(179, 32, 43, .45);
  text-underline-offset: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger__top a:hover .ledger__name { text-decoration-color: currentColor; }

.ledger__count {
  color: var(--paper-ink-muted);
  font-size: .85rem;
  font-variant-numeric: tabular-nums;
}

.ledger__update {
  display: grid;
  justify-items: start;
  margin: 22px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(29, 27, 23, .18);
}

.ledger__update a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--paper-ink);
  font-weight: 700;
  line-height: 1.35;
  text-decoration: underline;
  text-decoration-color: rgba(179, 32, 43, .45);
  text-underline-offset: 4px;
}

.ledger__update a:hover { text-decoration-color: currentColor; }
.ledger__update b { color: var(--crimson); }

/* ---- Narrower layouts ---- */
@media (max-width: 1100px) {
  .ledger { grid-template-columns: minmax(0, 1fr); }
  .ledger__body { margin-top: 24px; }
}

@media (max-width: 960px) {
  .case-head { grid-template-columns: minmax(0, 1fr); }

  .case-list {
    grid-template-columns: minmax(0, 1fr);
    gap: 56px;
  }

  .case:nth-child(2) { margin-top: 0; }

  /* Print beside the file instead of above it. */
  .case {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: center;
  }

  .case__evidence { margin: 0 -28px 0 0; }
  .case__file { padding: 30px 28px 26px 52px; }
}

@media (max-width: 640px) {
  .case { display: block; }
  .case__evidence { margin: 0 8px -30px; }
  .case__file { padding: 56px 20px 24px; }
  .exhibit--detail { width: 38%; bottom: -18px; }

  .ledger {
    padding: 28px 20px 28px 40px;
    background:
      linear-gradient(90deg, transparent 22px, rgba(179, 32, 43, .45) 0 23px, transparent 0 26px, rgba(179, 32, 43, .45) 0 27px, transparent 0),
      var(--paper);
  }

  .ledger__entries { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 18px; }
  .ledger__entry,
  .ledger__entry--server,
  .ledger__entry--players { grid-column: auto; padding: 0 0 0 14px; }
  .ledger__entry:nth-child(odd) { padding-left: 0; border-left: 0; }
  .ledger__entry strong { font-size: 36px; }
  .ledger__top ol { grid-template-columns: minmax(0, 1fr); gap: 0; }
}

@keyframes ledger-pulse { 50% { opacity: .35; } }

@media (prefers-reduced-motion: reduce) {
  .case-files__fog,
  .ledger__orb.is-loading { animation: none; }
  .case { transition: none; }
}
</style>
