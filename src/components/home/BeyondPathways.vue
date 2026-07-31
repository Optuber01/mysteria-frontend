<template>
  <section
    id="world"
    ref="section"
    class="world-story"
    :class="`world-story--${activeStage.id}`"
    :style="worldStyle"
    aria-labelledby="world-title"
  >
    <div class="world-sticky">
      <header class="world-heading">
        <p>Beyond the Pathways</p>
        <h2 id="world-title">Power changes what the world asks of you.</h2>
      </header>

      <div class="world-rail">
        <article
          v-for="(feature, index) in features"
          :key="feature.id"
          class="world-beat"
          :class="[`world-beat--${feature.id}`, { 'is-active': activeIndex === index }]"
          :style="{
            '--beat-bg': feature.palette.bg,
            '--beat-accent': feature.palette.accent,
            '--beat-ink': feature.palette.ink,
          }"
          :aria-hidden="activeIndex !== index"
        >
          <figure class="world-frame">
            <img
              :src="feature.image"
              :alt="feature.alt"
              :width="feature.width"
              :height="feature.height"
              loading="lazy"
              decoding="async"
            >
            <div class="world-grade" />
          </figure>

          <div class="world-copy">
            <span>{{ String(index + 1).padStart(2, '0') }} / 06</span>
            <p>{{ feature.kicker }}</p>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.copy }}</p>
          </div>

          <div class="scene-marker" :class="`scene-marker--${feature.pin}`">
            <button
              type="button"
              :aria-expanded="selectedMarker === index"
              :aria-controls="`world-note-${feature.id}`"
              :tabindex="activeIndex === index ? 0 : -1"
              @click="toggleMarker(index)"
            >
              <i aria-hidden="true" />
              <span>{{ feature.marker }}</span>
            </button>
            <p
              :id="`world-note-${feature.id}`"
              :class="{ 'is-open': selectedMarker === index }"
              role="status"
            >
              {{ feature.note }}
            </p>
          </div>
        </article>

        <article
          class="world-beat world-beat--live"
          :class="{ 'is-active': activeIndex === features.length }"
          :aria-hidden="activeIndex !== features.length"
        >
          <div class="live-landscape" aria-hidden="true">
            <img :src="townsImage" alt="" width="1280" height="720" loading="lazy" decoding="async">
            <i />
          </div>

          <div class="living-panel">
            <div class="living-intro">
              <span>Live from the server</span>
              <h3>The world keeps moving.</h3>
              <p>Live values appear only when a public data source responds.</p>
            </div>

            <div class="living-primary">
              <div class="status-orb" :class="`status-orb--${status.state}`" aria-hidden="true" />
              <p>Server</p>
              <strong>{{ serverStateText }}</strong>
              <span v-if="status.checkedAt">Checked {{ checkedTime }}</span>
            </div>

            <div class="living-primary living-primary--players">
              <p>Players online</p>
              <strong v-if="status.state === 'online' && status.playersOnline !== null">
                {{ status.playersOnline }}
              </strong>
              <strong v-else aria-label="Unavailable">—</strong>
              <span>{{ playerStateText }}</span>
            </div>

            <dl class="living-feed">
              <div>
                <dt>Active towns</dt>
                <dd>{{ valueOrUnavailable(living.towns) }}</dd>
              </div>
              <div>
                <dt>Organizations</dt>
                <dd>{{ valueOrUnavailable(living.organizations) }}</dd>
              </div>
              <div>
                <dt>Current world event</dt>
                <dd>{{ valueOrUnavailable(living.currentEvent) }}</dd>
              </div>
              <div>
                <dt>Recent discovery</dt>
                <dd>{{ valueOrUnavailable(living.recentDiscovery) }}</dd>
              </div>
              <div class="living-feed__update">
                <dt>Latest update</dt>
                <dd v-if="latestUpdate">
                  <RouterLink :to="`/news/${latestUpdate.slug}`" :tabindex="activeIndex === features.length ? 0 : -1">{{ latestUpdate.title }} <span aria-hidden="true">↗</span></RouterLink>
                </dd>
                <dd v-else>Unavailable</dd>
              </div>
            </dl>

            <p v-if="worldFeedUnavailable" class="feed-disclosure">
              No public towns, organization, event or discovery feed is connected.
            </p>
          </div>
        </article>
      </div>

      <nav class="world-index" aria-label="Explore the world systems">
        <button
          v-for="(stage, index) in stages"
          :key="stage.id"
          type="button"
          :class="{ 'is-active': activeIndex === index, 'is-past': activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-label="`Go to ${stage.short}`"
          @click="goToStage(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ stage.short }}</strong>
        </button>
      </nav>

      <p class="world-direction" aria-hidden="true">
        <span>Scroll to travel</span><i />
      </p>
    </div>

    <div class="world-static" aria-label="World systems overview">
      <header>
        <p>Beyond the Pathways</p>
        <h2>Power changes what the world asks of you.</h2>
      </header>
      <article v-for="(feature, index) in features" :key="feature.id">
        <img
          :src="feature.image"
          :alt="feature.alt"
          :width="feature.width"
          :height="feature.height"
          loading="lazy"
          decoding="async"
        >
        <div>
          <span>{{ String(index + 1).padStart(2, '0') }} · {{ feature.kicker }}</span>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.copy }}</p>
        </div>
      </article>
      <article class="world-static__live">
        <div>
          <span>Live from the server</span>
          <h3>{{ serverStateText }}</h3>
          <p>{{ playerStateText }}</p>
          <dl class="world-static__feed">
            <div><dt>Active towns</dt><dd>{{ valueOrUnavailable(living.towns) }}</dd></div>
            <div><dt>Organizations</dt><dd>{{ valueOrUnavailable(living.organizations) }}</dd></div>
            <div><dt>Current world event</dt><dd>{{ valueOrUnavailable(living.currentEvent) }}</dd></div>
            <div><dt>Recent discovery</dt><dd>{{ valueOrUnavailable(living.recentDiscovery) }}</dd></div>
            <div>
              <dt>Latest update</dt>
              <dd><RouterLink v-if="latestUpdate" :to="`/news/${latestUpdate.slug}`">{{ latestUpdate.title }} ↗</RouterLink><span v-else>Unavailable</span></dd>
            </div>
          </dl>
          <p v-if="worldFeedUnavailable" class="feed-disclosure">No public towns, organization, event or discovery feed is connected.</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import {
  getLivingWorldSnapshot,
  type LivingWorldSnapshot,
  type ServerStatus,
} from '@/services/serverStatus';
import creatureChamber from '@/assets/images/home/world/creature-chamber.webp';
import dungeonGate from '@/assets/images/home/world/dungeon-gate.webp';
import emporiumImage from '@/assets/images/home/world/emporium.webp';
import economyImage from '@/assets/images/home/world/player-economy.webp';
import raidBosses from '@/assets/images/home/world/raid-bosses.webp';
import townsImage from '@/assets/images/home/world/towns.webp';

type Palette = { bg: string; accent: string; ink: string };
type WorldFeature = {
  id: string;
  short: string;
  kicker: string;
  title: string;
  copy: string;
  marker: string;
  note: string;
  pin: 'high' | 'middle' | 'low';
  image: string;
  alt: string;
  width: number;
  height: number;
  palette: Palette;
};

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string } | null;
}>();

const features: WorldFeature[] = [
  {
    id: 'dungeons', short: 'Dungeons', kicker: 'Purpose-built spaces', title: 'Enter somewhere made to test you.',
    copy: 'Follow custom dungeon entrances into purpose-built rooms and encounters made for Mysterria.',
    marker: 'Dungeon entrance', note: 'A real in-game entrance from the Mysterria project.', pin: 'middle',
    image: dungeonGate, alt: 'A tall violet dungeon entrance standing in a snowy Minecraft landscape.', width: 1244, height: 530,
    palette: { bg: '#dbe4e8', accent: '#725c86', ink: '#14272b' },
  },
  {
    id: 'creatures', short: 'Creatures', kicker: 'Original encounters', title: 'Vanilla rules are only the starting point.',
    copy: 'Face custom creatures and encounter mechanics built to make abilities matter in combat.',
    marker: 'Encounter chamber', note: 'This creature encounter is captured in an in-game dungeon room.', pin: 'high',
    image: creatureChamber, alt: 'A custom floating creature surrounded by fragments inside a dark Minecraft chamber.', width: 1075, height: 503,
    palette: { bg: '#0d1d21', accent: '#a691d2', ink: '#f7f0e5' },
  },
  {
    id: 'locations', short: 'Locations', kicker: 'Places with a purpose', title: 'Every landmark can change how you play.',
    copy: 'Move through server-built locations such as the Emporium—places designed around what players do there.',
    marker: 'The Emporium', note: 'A real Mysterria location used for server commerce.', pin: 'low',
    image: emporiumImage, alt: 'A bright modern Minecraft emporium built from dark wood and large glass windows.', width: 1920, height: 1080,
    palette: { bg: '#d9edf0', accent: '#a55d35', ink: '#122c2a' },
  },
  {
    id: 'events', short: 'World events', kicker: 'Shared fights', title: 'The world can call everyone at once.',
    copy: 'Scheduled open-world bosses scale around nearby players, turning an encounter into a shared fight.',
    marker: 'Open-world boss', note: 'Boss encounters support scheduled spawns, group scaling and shared rewards.', pin: 'middle',
    image: raidBosses, alt: 'Custom armored Minecraft bosses emerging through mist.', width: 1200, height: 653,
    palette: { bg: '#1a242b', accent: '#81d9df', ink: '#f6f3ec' },
  },
  {
    id: 'economy', short: 'Economy', kicker: 'Trade what you find', title: 'Loot becomes a decision, not clutter.',
    copy: 'Appraise and sell resources through in-world interfaces, then move those earnings through the player economy.',
    marker: 'Item appraisal', note: 'The appraisal interface shows quantity, uniqueness and final sell value.', pin: 'high',
    image: economyImage, alt: 'Mysterria item appraisal interface calculating the sale value of deepslate diamond ore.', width: 904, height: 309,
    palette: { bg: '#4a403b', accent: '#8ed56d', ink: '#fff7e9' },
  },
  {
    id: 'towns', short: 'Towns', kicker: 'A lasting place', title: 'Build somewhere worth returning to.',
    copy: 'Create a home, join a town and shape a persistent place with other players.',
    marker: 'Player settlement', note: 'Mysterria supports housing, towns and player organizations.', pin: 'low',
    image: townsImage, alt: 'A detailed Minecraft city at night with a domed central tower and illuminated streets.', width: 1280, height: 720,
    palette: { bg: '#241c1d', accent: '#efb96d', ink: '#fff6e8' },
  },
];

const liveStage = {
  id: 'live',
  short: 'Live world',
  palette: { bg: '#0e2224', accent: '#d7b16d', ink: '#fcf9f2' },
};
const stages = [...features, liveStage];
const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const selectedMarker = ref<number | null>(null);
const living = ref<LivingWorldSnapshot>({ towns: null, organizations: null, currentEvent: null, recentDiscovery: null });
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let frame = 0;
let visible = false;

const activeStage = computed(() => stages[activeIndex.value] ?? stages[0]);
const worldStyle = computed(() => ({
  '--world-progress': String(progress.value),
  '--world-bg': activeStage.value.palette.bg,
  '--world-accent': activeStage.value.palette.accent,
  '--world-ink': activeStage.value.palette.ink,
  '--rail-x': `${progress.value * -600}vw`,
  '--image-shift': `${progress.value * -5}%`,
  '--direction-width': `${progress.value * 100}%`,
  '--world-heading-opacity': String(Math.max(0, 1 - progress.value * 10)),
}));
const worldFeedUnavailable = computed(() =>
  living.value.towns === null &&
  living.value.organizations === null &&
  living.value.currentEvent === null &&
  living.value.recentDiscovery === null,
);
const serverStateText = computed(() => {
  if (props.status.state === 'online') return 'Online';
  if (props.status.state === 'offline') return 'Offline';
  if (props.status.state === 'loading') return 'Checking…';
  return 'Status unavailable';
});
const playerStateText = computed(() => {
  if (props.status.state === 'online' && props.status.playersOnline !== null) {
    return `${props.status.playersOnline} currently connected`;
  }
  if (props.status.state === 'loading') return 'Player count is loading.';
  return 'Player count unavailable.';
});
const checkedTime = computed(() => props.status.checkedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '');

function valueOrUnavailable(value: string | number | null) {
  return value ?? 'Unavailable';
}

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    const scaled = Math.min(stages.length - 0.0001, next * stages.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
    if (selectedMarker.value !== null && selectedMarker.value !== activeIndex.value) selectedMarker.value = null;
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  const next = (index + 0.18) / stages.length;
  progress.value = next;
  if (reducedMotion.value) return;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  const scrollRange = section.value.offsetHeight - innerHeight;
  window.scrollTo({ top: sectionTop + scrollRange * next, behavior: 'smooth' });
}

function toggleMarker(index: number) {
  selectedMarker.value = selectedMarker.value === index ? null : index;
}

onMounted(async () => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  }, { rootMargin: '10% 0px' });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  try {
    living.value = await getLivingWorldSnapshot();
  } catch {
    // Null values are intentionally rendered as unavailable.
  }
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.world-story {
  --world-progress: 0;
  position: relative;
  z-index: 2;
  min-height: 690svh;
  isolation: isolate;
  color: var(--world-ink);
  background: var(--world-bg);
  transition: background-color .8s cubic-bezier(.22, 1, .36, 1), color .5s ease;
}

.world-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 650px;
  overflow: hidden;
  isolation: isolate;
  background: var(--world-bg);
  transition: background-color .8s cubic-bezier(.22, 1, .36, 1);
}

.world-sticky::before,
.world-sticky::after {
  content: "";
  position: absolute;
  z-index: 7;
  left: 0;
  right: 0;
  pointer-events: none;
}

.world-sticky::before {
  top: 0;
  height: 28%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--world-bg) 92%, transparent), transparent);
}

.world-sticky::after {
  bottom: 0;
  height: 26%;
  background: linear-gradient(0deg, color-mix(in srgb, var(--world-bg) 92%, transparent), transparent);
}

.world-heading {
  position: absolute;
  z-index: 10;
  top: clamp(74px, 9vh, 104px);
  left: clamp(22px, 4.8vw, 78px);
  width: min(610px, 48vw);
  opacity: var(--world-heading-opacity);
  pointer-events: none;
  transition: opacity .25s ease;
}

.world-heading p,
.world-copy > span,
.world-copy > p:first-of-type,
.living-intro > span,
.world-static header p,
.world-static article span {
  margin: 0;
  color: var(--world-accent);
  font: 650 .67rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.world-heading h2 {
  max-width: 560px;
  margin: 12px 0 0;
  font: 650 clamp(2rem, 4vw, 4.4rem)/.9 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.045em;
}

.world-rail {
  position: absolute;
  z-index: 1;
  inset: 0 auto 0 0;
  width: 700vw;
  display: flex;
  transform: translate3d(var(--rail-x), 0, 0);
  will-change: transform;
}

.world-beat {
  --beat-bg: #0e2224;
  --beat-accent: #c69b52;
  --beat-ink: #fcf9f2;
  position: relative;
  width: 100vw;
  height: 100%;
  flex: none;
  overflow: hidden;
  color: var(--beat-ink);
  background: var(--beat-bg);
}

.world-beat::before {
  content: "";
  position: absolute;
  z-index: 3;
  inset: 0;
  opacity: .65;
  background:
    linear-gradient(90deg, var(--beat-bg) 0 9%, transparent 30% 72%, var(--beat-bg) 96%),
    radial-gradient(circle at 72% 46%, transparent 0 18%, color-mix(in srgb, var(--beat-bg) 32%, transparent) 72%);
  pointer-events: none;
}

.world-frame {
  position: absolute;
  z-index: 1;
  inset: clamp(94px, 12vh, 132px) 5vw clamp(76px, 10vh, 104px) 18vw;
  margin: 0;
  overflow: hidden;
  border-radius: clamp(20px, 3vw, 42px);
  box-shadow: 0 42px 100px rgba(0, 0, 0, .24);
  clip-path: polygon(4% 0, 100% 0, 96% 100%, 0 100%);
}

.world-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 24%, transparent);
  border-radius: inherit;
  pointer-events: none;
}

.world-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.065) translate3d(var(--image-shift), 0, 0);
  transform-origin: center;
}

.world-beat--dungeons .world-frame img { object-position: 55% center; }
.world-beat--creatures .world-frame img { object-position: center; }
.world-beat--locations .world-frame img { object-position: 53% center; }
.world-beat--events .world-frame img { object-position: 47% center; }
.world-beat--economy .world-frame img { object-position: 57% center; image-rendering: auto; }
.world-beat--towns .world-frame img { object-position: 64% center; }

.world-grade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, .48), transparent 42%),
    linear-gradient(0deg, rgba(0, 0, 0, .24), transparent 45%);
  pointer-events: none;
}

.world-copy {
  position: absolute;
  z-index: 6;
  left: clamp(24px, 7vw, 112px);
  top: 51%;
  width: min(410px, 34vw);
  padding: 24px 0;
  transform: translateY(-50%);
  text-shadow: 0 2px 30px color-mix(in srgb, var(--beat-bg) 86%, transparent);
}

.world-copy > p:first-of-type { margin-top: 13px; color: var(--beat-accent); }

.world-copy h3 {
  margin: 14px 0 16px;
  font: 650 clamp(3.1rem, 6vw, 6.8rem)/.82 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.055em;
  text-wrap: balance;
}

.world-copy > p:last-child {
  max-width: 390px;
  margin: 0;
  color: color-mix(in srgb, var(--beat-ink) 76%, transparent);
  font-size: clamp(.84rem, 1.05vw, 1rem);
  line-height: 1.65;
}

.scene-marker {
  position: absolute;
  z-index: 6;
  right: clamp(7vw, 11vw, 176px);
  color: var(--beat-ink);
}

.scene-marker--high { top: 30%; }
.scene-marker--middle { top: 48%; }
.scene-marker--low { top: 66%; }

.scene-marker button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 5px;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 38%, transparent);
  border-radius: 999px;
  color: inherit;
  background: color-mix(in srgb, var(--beat-bg) 70%, transparent);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.scene-marker button i {
  width: 30px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--beat-accent);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--beat-accent) 40%, transparent);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s ease;
}

.scene-marker button i::after { content: "+"; color: var(--beat-bg); font: 700 15px/1 "IBM Plex Mono", monospace; }
.scene-marker button[aria-expanded="true"] i::after { content: "−"; }
.scene-marker button:hover i,
.scene-marker button:focus-visible i { transform: scale(1.12); box-shadow: 0 0 0 7px color-mix(in srgb, var(--beat-accent) 28%, transparent); }
.scene-marker button span { font-size: .7rem; font-weight: 750; }

.scene-marker > p {
  width: min(290px, 28vw);
  margin: 9px 0 0 auto;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 18%, transparent);
  border-radius: 14px;
  color: color-mix(in srgb, var(--beat-ink) 76%, transparent);
  background: color-mix(in srgb, var(--beat-bg) 84%, transparent);
  font-size: .73rem;
  line-height: 1.5;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-7px);
  transition: opacity .22s ease, transform .35s cubic-bezier(.22, 1, .36, 1);
}

.scene-marker > p.is-open { opacity: 1; transform: none; }

.world-beat--live { background: #0e2224; }

.live-landscape,
.live-landscape::after,
.live-landscape img,
.live-landscape i { position: absolute; inset: 0; }

.live-landscape img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  filter: saturate(.72) brightness(.54);
  transform: scale(1.08);
}

.live-landscape::after {
  content: "";
  background: linear-gradient(90deg, rgba(7, 25, 27, .96), rgba(7, 25, 27, .56) 48%, rgba(7, 25, 27, .9));
}

.live-landscape i {
  background: radial-gradient(circle at 72% 32%, rgba(211, 168, 97, .18), transparent 38%);
}

.living-panel {
  position: absolute;
  z-index: 6;
  left: 50%;
  top: 52%;
  width: min(1120px, calc(100% - 11vw));
  display: grid;
  grid-template-columns: 1.1fr .62fr .62fr;
  gap: 28px 48px;
  padding: 34px 0;
  border-top: 1px solid rgba(252, 249, 242, .24);
  border-bottom: 1px solid rgba(252, 249, 242, .24);
  transform: translate(-50%, -50%);
}

.living-intro { grid-column: 1 / -1; }
.living-intro h3 { margin: 12px 0 10px; font: 650 clamp(3rem, 6vw, 6.4rem)/.84 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
.living-intro > p { max-width: 520px; margin: 0; color: rgba(252, 249, 242, .62); font-size: .83rem; line-height: 1.6; }

.living-primary { position: relative; min-height: 130px; padding-top: 20px; }
.living-primary p { margin: 0 0 12px; color: rgba(252, 249, 242, .48); font: 600 .58rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.living-primary strong { display: block; color: #fcf9f2; font: 650 clamp(3.4rem, 7vw, 7rem)/.75 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.04em; }
.living-primary span { display: block; margin-top: 14px; color: rgba(252, 249, 242, .52); font: 500 .57rem/1.35 "IBM Plex Mono", monospace; }
.status-orb { position: absolute; top: 22px; right: 22px; width: 10px; aspect-ratio: 1; border-radius: 50%; background: #7b8987; }
.status-orb--online { background: #86d5a9; box-shadow: 0 0 18px rgba(134, 213, 169, .72); }
.status-orb--offline { background: #d48671; }
.status-orb--loading { animation: status-pulse 1.4s ease-in-out infinite; }

.living-feed { display: grid; grid-template-columns: 1fr 1fr; grid-column: 1 / -1; margin: 0; border-top: 1px solid rgba(252, 249, 242, .13); }
.living-feed > div { min-width: 0; display: grid; grid-template-columns: minmax(120px, .8fr) 1.2fr; gap: 12px; padding: 14px 18px 14px 0; border-bottom: 1px solid rgba(252, 249, 242, .13); }
.living-feed > div:nth-child(odd) { margin-right: 28px; }
.living-feed dt { color: rgba(252, 249, 242, .72); font: 500 .57rem/1.45 "IBM Plex Mono", monospace; text-transform: uppercase; }
.living-feed dd { min-width: 0; margin: 0; color: #fcf9f2; font-size: .72rem; font-weight: 700; overflow-wrap: anywhere; }
.living-feed a { color: #f0c879; text-decoration: underline; text-decoration-color: rgba(240, 200, 121, .35); text-underline-offset: 4px; }
.living-feed__update { grid-column: 1 / -1; margin-right: 0 !important; }
.feed-disclosure { grid-column: 1 / -1; margin: -15px 0 0; color: rgba(252, 249, 242, .72); font: 500 .57rem/1.5 "IBM Plex Mono", monospace; }

.world-index {
  position: absolute;
  z-index: 12;
  right: clamp(16px, 2.2vw, 34px);
  top: 50%;
  display: grid;
  gap: 3px;
  transform: translateY(-50%);
}

.world-index button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 4px 8px;
  border: 0;
  color: color-mix(in srgb, var(--world-ink) 48%, transparent);
  background: transparent;
  cursor: pointer;
}

.world-index button::after {
  content: "";
  width: 19px;
  height: 2px;
  background: currentColor;
  transition: width .35s cubic-bezier(.22, 1, .36, 1), background-color .25s ease;
}

.world-index button.is-active { color: var(--world-accent); }
.world-index button.is-active::after { width: 36px; }
.world-index button.is-past { color: color-mix(in srgb, var(--world-accent) 62%, transparent); }
.world-index span { font: 600 .52rem/1 "IBM Plex Mono", monospace; }
.world-index strong { max-width: 0; overflow: hidden; opacity: 0; font-size: .59rem; white-space: nowrap; transition: max-width .35s ease, opacity .2s ease; }
.world-index button:hover strong,
.world-index button:focus-visible strong,
.world-index button.is-active strong { max-width: 90px; opacity: 1; }

.world-direction {
  position: absolute;
  z-index: 11;
  left: clamp(22px, 4.8vw, 78px);
  bottom: 26px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: color-mix(in srgb, var(--world-ink) 52%, transparent);
  font: 550 .54rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.world-direction i { width: 76px; height: 1px; overflow: hidden; background: color-mix(in srgb, var(--world-ink) 18%, transparent); }
.world-direction i::after { content: ""; display: block; width: var(--direction-width); height: 100%; background: var(--world-accent); }

.world-static { display: none; }
.world-static__feed { display: grid; gap: 0; margin: 22px 0 0; }
.world-static__feed > div { display: grid; grid-template-columns: minmax(110px, .7fr) 1fr; gap: 14px; padding: 11px 0; border-top: 1px solid rgba(252, 249, 242, .16); }
.world-static__feed dt { color: rgba(252, 249, 242, .72); font: 650 .58rem/1.4 "IBM Plex Mono", monospace; text-transform: uppercase; }
.world-static__feed dd { margin: 0; color: #fcf9f2; font-size: .72rem; line-height: 1.45; }
.world-static__feed a { color: #e3b866; }

@keyframes status-pulse { 50% { opacity: .35; transform: scale(.72); } }

@media (max-width: 880px) {
  .world-heading { width: 62vw; }
  .world-frame { left: 8vw; right: 8vw; opacity: .88; }
  .world-copy { left: 8vw; width: min(430px, 62vw); }
  .scene-marker { right: 12vw; }
  .living-panel { width: calc(100% - 14vw); gap: 20px; }
  .living-primary { min-height: 105px; }
  .living-primary strong { font-size: clamp(2.8rem, 9vw, 5rem); }
  .living-feed > div { grid-template-columns: 100px 1fr; }
}

@media (max-width: 560px), (max-height: 560px) {
  .world-story { min-height: auto; color: #fcf9f2; background: #0e2224; }
  .world-sticky { display: none; }
  .world-static { display: grid; gap: 0; padding: 86px 16px 72px; }
  .world-static header { margin: 0 0 34px; }
  .world-static header p { color: #c69b52; }
  .world-static header h2 { max-width: 520px; margin: 12px 0 0; font: 650 clamp(2.7rem, 13vw, 5rem)/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .world-static article { position: relative; display: grid; min-width: 0; padding: 0 0 54px; }
  .world-static article img { width: 100%; height: auto; min-height: 230px; max-height: 56svh; object-fit: cover; border-radius: 20px; }
  .world-static article > div { position: relative; z-index: 1; width: calc(100% - 18px); margin: -36px 0 0 18px; padding: 22px 0 0 20px; border-left: 1px solid rgba(198, 155, 82, .58); background: linear-gradient(90deg, #0e2224 0 72%, transparent); }
  .world-static article span { color: #c69b52; font-size: .57rem; }
  .world-static article h3 { margin: 10px 0; font: 650 clamp(2.1rem, 10vw, 3.6rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.04em; }
  .world-static article p { max-width: 460px; margin: 0; color: rgba(252, 249, 242, .68); font-size: .79rem; line-height: 1.6; }
  .world-static__live { min-height: 330px; align-content: end; padding: 32px !important; overflow: hidden; border-radius: 22px; background: linear-gradient(135deg, #173632, #08151a); }
  .world-static__live > div { width: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: #e3b866; font-size: .76rem; font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) {
  .world-story { min-height: auto; color: #fcf9f2; background: #0e2224; }
  .world-sticky { display: none; }
  .world-static { width: min(1120px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; margin: 0 auto; padding: 100px 24px; }
  .world-static header { grid-column: 1 / -1; }
  .world-static header p { color: #c69b52; }
  .world-static header h2 { max-width: 700px; margin: 14px 0 18px; font: 650 clamp(3rem, 7vw, 6.5rem)/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .world-static article { min-width: 0; }
  .world-static article img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 24px; }
  .world-static article > div { padding: 20px 4px; }
  .world-static article span { color: #c69b52; }
  .world-static article h3 { margin: 11px 0; font: 650 clamp(2rem, 4vw, 3.2rem)/.9 "IBM Plex Sans Condensed", sans-serif; }
  .world-static article p { margin: 0; color: rgba(252, 249, 242, .68); font-size: .8rem; line-height: 1.6; }
  .world-static__live { grid-column: 1 / -1; min-height: 320px; display: grid; align-items: end; padding: 32px; border-radius: 24px; background: linear-gradient(135deg, #173632, #08151a); }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: #e3b866; font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) and (max-width: 700px) {
  .world-static { grid-template-columns: 1fr; padding: 82px 16px; }
  .world-static header,
  .world-static__live { grid-column: auto; }
}
</style>
