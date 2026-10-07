<template>
  <section id="future" class="arc-section arc-future" aria-labelledby="arc-future-title">
    <div class="arc-future__sky" aria-hidden="true" data-recolour>
      <img :src="sky" alt="" loading="lazy" decoding="sync" width="1920" height="1009">
    </div>

    <div class="arc-shell">
      <span id="join" class="arc-future__anchor" aria-hidden="true"></span>
      <ArcanaSectionHead title-id="arc-future-title">
        <template #title>{{ t('home.world.join.titleA') }} <em>{{ t('home.world.join.titleB') }}</em></template>
      </ArcanaSectionHead>

      <div class="arc-future__grid">
        <!-- one address for both editions, then what each needs -->
        <div class="arc-connect">
          <button
              type="button"
              class="arc-ip"
              :class="`is-${copyState}`"
              :aria-describedby="'arc-future-copy-note'"
              @click="copy"
          >
            <span ref="addressRef" class="arc-ip__address">{{ address }}</span>
            <span class="arc-ip__hint">
              <i :class="copyIcon" aria-hidden="true"></i>
              {{ copyLabel }}
            </span>
          </button>
          <p id="arc-future-copy-note" class="arc-connect__note" :class="`is-${copyState}`" aria-live="polite">
            {{ copyNote }}
          </p>

          <ul class="arc-editions">
            <li v-for="edition in EDITIONS" :key="edition.key" class="arc-edition">
              <i :class="edition.icon" aria-hidden="true"></i>
              <div>
                <h3>{{ t(`home.world.join.${edition.key}.name`) }}</h3>
                <p>{{ t(`home.world.join.${edition.key}.body`) }}</p>
              </div>
            </li>
          </ul>

          <p class="arc-connect__verify">{{ t('home.world.join.verify') }}</p>
        </div>

        <!-- beside it: who's on right now, and the two ways to get help -->
        <div class="arc-join">
          <div class="arc-live" :class="statusClass">
            <div class="arc-live__row">
              <span class="arc-live__dot" aria-hidden="true"></span>
              <span v-if="isOnline && checkedAt" class="arc-live__count">{{ playerCount ?? 0 }}</span>
              <span class="arc-live__unit">{{ liveUnit }}</span>
            </div>
            <div v-if="seasonCount" class="arc-live__season">
              <strong>{{ seasonCount }}</strong>
              <span>{{ t('home.world.join.seasonLabel') }}</span>
            </div>
          </div>
          <div class="arc-future__actions">
            <RouterLink :to="$lp('/guide/connect')" class="arc-btn arc-btn--solid">
              {{ t('home.world.join.guide') }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </RouterLink>
            <a :href="DISCORD" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
              <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
              {{ t('home.world.join.discord') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import {useCopyAddress} from './useCopyAddress';
import sky from '@/assets/images/home-library/captures/hero-aurora-cliffside.webp';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';
const EDITIONS = [
  {key: 'java', icon: 'fa-solid fa-desktop'},
  {key: 'bedrock', icon: 'fa-solid fa-mobile-screen'},
] as const;

const {t, intlLocale} = useI18n();
const addressRef = ref<HTMLElement | null>(null);
const {state: copyState, copy, address} = useCopyAddress(addressRef);
const {isOnline, playerCount, checkedAt} = useServerStatus();
const {totalBeyonders} = useBeyonderStats();

const copyLabel = computed(() => ({
  idle: t('home.arcana.ip.copy'),
  copied: t('home.arcana.ip.copied'),
  failed: t('home.arcana.ip.failed'),
}[copyState.value]));
const copyIcon = computed(() => ({
  idle: 'fa-solid fa-copy',
  copied: 'fa-solid fa-check',
  failed: 'fa-solid fa-triangle-exclamation',
}[copyState.value]));
/* The line under the address always holds text, so the copy feedback never shifts the layout. */
const copyNote = computed(() => ({
  idle: t('home.world.join.copyHint'),
  copied: t('home.world.join.copiedHelp'),
  failed: t('home.arcana.ip.failedHelp'),
}[copyState.value]));

/* ---- live status ---- */
const statusClass = computed(() => (!checkedAt.value ? 'is-checking' : isOnline.value ? 'is-online' : 'is-offline'));
const liveUnit = computed(() => {
  if (!checkedAt.value) return t('home.arcana.status.checking');
  return isOnline.value ? t('home.world.join.liveUnit') : t('home.arcana.status.offline');
});
/* No number until the real one arrives: a made-up fallback could be wrong. */
const seasonCount = computed(() => (totalBeyonders.value ? totalBeyonders.value.toLocaleString(intlLocale.value) : ''));

</script>

<style scoped>
.arc-future {
  overflow: clip;
}

/* a dawn sky behind the section, faded in and out so the section has no edges */
.arc-future__sky {
  position: absolute;
  inset: 0 0 auto;
  height: min(100%, 820px);
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 50%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 30%, #000 50%, transparent);
}

/* enlarged from its lower right corner: the photo has a stray spear in its upper left, which
   would cross the heading, and this crops it out */
.arc-future__sky img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .3;
  transform: scale(1.5);
  transform-origin: 100% 100%;
}

.arc-future__sky::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 70% at 70% 35%, color-mix(in oklab, var(--acc) 22%, transparent), transparent 70%);
}

.arc-future .arc-shell {
  position: relative;
  z-index: 1;
}

.arc-future__anchor {
  position: absolute;
  top: calc(var(--arc-section-pad) * -1);
  scroll-margin-top: var(--site-header-stack, 106px);
}

.arc-future__grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  /* each card at its own height: whatever the data brings, neither is stretched to fill */
  grid-template-areas: 'connect join';
  gap: var(--arc-grid-gap);
  align-items: start;
}

/* ---- the address and the two editions ---- */
.arc-connect {
  grid-area: connect;
  padding: clamp(22px, 2.2vw, 30px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

/* the hero's copy field (global .arc-ip), full width */
.arc-connect .arc-ip {
  width: 100%;
  justify-content: space-between;
}

.arc-connect__note {
  min-height: 1.6em;
  margin: 10px 0 0;
  font-size: var(--arc-fs-small);
  line-height: 1.6;
  color: var(--arc-muted);
  transition: color .2s;
}

.arc-connect__note.is-copied {
  color: var(--arc-ok);
}

.arc-connect__note.is-failed {
  color: var(--arc-bad);
}

.arc-editions {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
  margin: 22px 0 0;
  padding: 22px 0 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.arc-edition {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 14px;
}

.arc-edition > i {
  margin-top: 4px;
  font-size: 18px;
  color: var(--acc-ink);
  text-align: center;
  transition: color .6s ease;
}

.arc-edition h3 {
  margin: 0 0 6px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.arc-edition p,
.arc-connect__verify {
  margin: 0;
  font-size: var(--arc-fs-body);
  line-height: 1.6;
  color: var(--arc-muted);
  text-wrap: pretty;
}

.arc-connect__verify {
  margin-top: 22px;
  padding-top: 18px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

/* the panel: the live count on top, the two ways in under it, full width */
.arc-join {
  grid-area: join;
  display: grid;
  gap: 18px;
  padding: clamp(22px, 2.2vw, 30px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.arc-future__actions {
  display: grid;
  gap: 10px;
}

.arc-future__actions .arc-btn {
  justify-content: center;
}

/* ---- live ---- */
.arc-live {
  display: block;
}

.arc-live__row {
  display: flex;
  align-items: baseline;
  min-height: var(--arc-fs-h2);
  gap: 12px;
  margin: 0;
}

.arc-live__dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--arc-muted);
  align-self: center;
}

.is-online .arc-live__dot {
  position: relative;
  background: #4ade80;
}

/* the ring grows and fades (transform + opacity, composited) instead of animating a box-shadow */
.is-online .arc-live__dot::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(74, 222, 128, .55);
  content: '';
  animation: arc-pulse 2s infinite;
}

.is-offline .arc-live__dot {
  background: #f87171;
}

@keyframes arc-pulse {
  0% { transform: scale(1); opacity: 1; }
  70% { transform: scale(3); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.arc-live__count {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: var(--arc-fs-h2);
  line-height: 1;
  color: var(--arc-ink);
}

.arc-live__unit {
  font-size: var(--arc-fs-body);
  line-height: 1.3;
  color: var(--arc-muted);
}

.arc-live__season {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.arc-live__season strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1;
  color: var(--acc-ink);
  transition: color .6s ease;
}

.arc-live__season span {
  font-size: var(--arc-fs-small);
  color: var(--arc-muted);
}









@media (max-width: 960px) {
  .arc-future__grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas:
      'connect'
      'join';
  }
}

@media (max-width: 600px) {
  .arc-editions {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-online .arc-live__dot::after {
    animation: none;
    opacity: 0;
  }
}
</style>
