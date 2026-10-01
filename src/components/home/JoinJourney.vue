<template>
  <section id="join" class="join-threshold" :class="{ 'has-choice': selectedPathway }" :style="pathwayStyle" aria-labelledby="join-title">
    <i class="join-threshold__glow" aria-hidden="true" />
    <div class="join-threshold__content">
      <p class="join-kicker">{{ t('home.join.kicker') }}</p>
      <h2 id="join-title">{{ t('home.join.title') }}</h2>
      <p class="join-intro">{{ t('home.join.intro') }}</p>
      <Transition name="orbit-arrival">
        <aside
          v-if="selectedPathway"
          :key="selectedPathway.id"
          class="orbit-arrival"
          :aria-label="t('home.join.chosenLabel').replace('{name}', selectedName)"
        >
          <svg class="orbit-arrival__line" viewBox="0 0 570 260" aria-hidden="true"><path d="M26 218C108 216 118 126 214 137S316 213 386 147 436 46 540 44" /><circle cx="26" cy="218" r="4" /><circle cx="214" cy="137" r="3" /><circle cx="386" cy="147" r="4" /></svg>
          <span class="orbit-arrival__seal" aria-hidden="true"><img :src="selectedPathway.image" alt="" width="72" height="72" decoding="async"></span>
          <p><small>{{ t('home.join.chosenKicker') }}</small><strong>{{ selectedName }}</strong></p>
        </aside>
      </Transition>

      <ol class="join-guide" :aria-label="t('home.join.stepsLabel')">
        <li v-for="(step, index) in steps" :key="step">
          <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <strong>{{ t(`home.join.steps.${step}.title`) }}</strong>
            <p>{{ t(`home.join.steps.${step}.copy`).replace('{address}', SERVER_IP) }}</p>
          </div>
        </li>
      </ol>

      <button class="copy-address" :class="`is-${copyState}`" type="button" @click="copyAddress">
        <span><small>{{ t('home.join.addressLabel') }}</small><strong>{{ SERVER_IP }}</strong></span>
        <b><i v-if="copyState === 'copied'" aria-hidden="true">✓</i>{{ copyLabel }}</b>
      </button>
      <p class="copy-feedback" :class="{ 'is-failed': copyState === 'failed' }" role="status">{{ copyFeedback }}</p>
      <div class="join-actions">
        <RouterLink class="guide-link guide-link--guide" :to="$lp('/guide')">{{ t('home.join.guide') }}<span aria-hidden="true">→</span></RouterLink>
        <a class="guide-link guide-link--discord" :href="DISCORD_INVITE" target="_blank" rel="noopener noreferrer">
          {{ t('home.join.discord') }}<span aria-hidden="true">↗</span><em class="visually-hidden">{{ t('home.join.newTab') }}</em>
        </a>
      </div>
      <p class="join-note">{{ t('home.join.note') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, type CSSProperties } from 'vue';
import { SERVER_IP } from '@/composables/useServer';
import { useI18n } from '@/composables/useI18n';
import { localize, type HomePathway } from '@/data/homePathways';

const DISCORD_INVITE = 'https://discord.com/invite/jc7GSxBWgb';
const steps = ['connect', 'choose', 'firstStep'] as const;

const props = defineProps<{ selectedPathway?: HomePathway | null }>();
const { t, currentLanguage } = useI18n();
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const selectedPathway = computed(() => props.selectedPathway ?? null);
const selectedName = computed(() => selectedPathway.value ? localize(selectedPathway.value.name, currentLanguage.value) : '');
const pathwayStyle = computed<CSSProperties>(() => selectedPathway.value ? {
  '--orbit-accent': selectedPathway.value.theme.accent,
  '--orbit-tint': selectedPathway.value.theme.tint,
} : {});
const copyLabel = computed(() => t(copyState.value === 'copied' ? 'home.join.copied' : copyState.value === 'failed' ? 'home.join.retry' : 'home.join.copy'));
const copyFeedback = computed(() => copyState.value === 'copied'
  ? t('home.join.copiedAnnouncement')
  : copyState.value === 'failed' ? t('home.join.copyFailed').replace('{address}', SERVER_IP) : '');

async function copyAddress() {
  try { await navigator.clipboard.writeText(SERVER_IP); copyState.value = 'copied'; } catch { copyState.value = 'failed'; }
  if (copyTimer) clearTimeout(copyTimer);
  // A failure stays up until the next attempt: the address has to be copied by hand.
  copyTimer = copyState.value === 'copied' ? setTimeout(() => (copyState.value = 'idle'), 3200) : null;
}
onUnmounted(() => { if (copyTimer) clearTimeout(copyTimer); });
</script>

<style scoped>
.join-threshold { --orbit-accent: var(--primary, #7458e8); --orbit-tint: #f1edfd; --join-measure: 620px; --join-gap: clamp(40px, 5vw, 88px); position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; padding: 110px 0 88px; color: var(--ink, #221c14); background: transparent; isolation: isolate; }
.join-threshold__glow { position: absolute; z-index: -1; inset: 0; background:
  radial-gradient(ellipse 62% 46% at 50% 40%, color-mix(in srgb, var(--primary, #7458e8) 16%, transparent), transparent 72%),
  radial-gradient(ellipse 38% 32% at 76% 50%, color-mix(in srgb, var(--primary, #7458e8) 9%, transparent), transparent 70%); transition: background .6s ease; }
.join-threshold__content { width: min(var(--join-measure), calc(100% - 2 * var(--home-rail-inset, clamp(20px, 4vw, 56px)))); justify-self: start; margin-left: var(--home-rail-inset, clamp(20px, 4vw, 56px)); }

/* The chosen seal sits in the free column right of the copy, never over it. */
.orbit-arrival { position: absolute; z-index: -1; top: 50%; left: calc(var(--home-rail-inset, 56px) + var(--join-measure) + var(--join-gap)); right: var(--home-rail-inset, 56px); max-width: 690px; margin-left: auto; pointer-events: none; color: var(--orbit-accent); transform: translateY(-45%); }
.orbit-arrival__line { display: block; width: 100%; overflow: visible; fill: none; stroke: var(--orbit-accent); stroke-width: 1.2; stroke-linecap: round; opacity: .7; }
.orbit-arrival__line path { stroke-dasharray: 3 10; }
.orbit-arrival__line circle { fill: var(--orbit-accent); }
.orbit-arrival__seal { position: absolute; top: 13%; right: 3%; width: 76px; height: 76px; display: grid; place-items: center; overflow: hidden; border: 1px solid color-mix(in srgb, var(--orbit-accent) 60%, transparent); border-radius: 50%; background: var(--surface, #fff); box-shadow: 0 10px 30px rgba(34,28,20,.1), 0 0 0 8px color-mix(in srgb, var(--orbit-accent) 10%, transparent); }
.orbit-arrival__seal::after { content: ""; position: absolute; inset: 7px; border: 1px solid color-mix(in srgb, var(--orbit-accent) 28%, transparent); border-radius: 50%; }
.orbit-arrival__seal img { width: 74%; height: 74%; object-fit: contain; }
.orbit-arrival p { position: absolute; top: 56%; right: 3%; display: grid; gap: 6px; margin: 0; text-align: right; }
.orbit-arrival small { color: var(--ink-muted, #756b5c); font: 700 .75rem/1 var(--font-body, Manrope, sans-serif); letter-spacing: .14em; text-transform: uppercase; }
.orbit-arrival strong { color: var(--orbit-accent); font: 700 clamp(1.4rem, 2.1vw, 2rem)/1 var(--font-display, "IBM Plex Sans Condensed", sans-serif); letter-spacing: -.02em; }

.join-kicker { margin: 0; color: var(--champagne, #c8943f); font: 700 .75rem/1 var(--font-body, Manrope, sans-serif); letter-spacing: .16em; text-transform: uppercase; }
.join-threshold h2 { margin: 14px 0 16px; color: var(--ink, #221c14); font: 800 clamp(3.4rem, 6vw, 6.4rem)/.92 var(--font-body, Manrope, sans-serif); letter-spacing: -.025em; text-wrap: balance; }
.join-intro { max-width: 510px; margin: 0; color: color-mix(in srgb, var(--ink, #221c14) 80%, transparent); font-size: clamp(.95rem, 1.1vw, 1.05rem); font-weight: 500; line-height: 1.6; }
.join-guide { display: grid; margin: 30px 0 36px; padding: 0; list-style: none; border-top: 1px solid var(--hairline, #e7dccb); }
.join-guide li { display: grid; grid-template-columns: 48px 1fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--hairline, #e7dccb); }
.join-guide span { align-self: start; padding-top: 3px; color: var(--primary, #7458e8); font: 700 .875rem/1 var(--font-mono, monospace); letter-spacing: .1em; }
.join-guide strong { font: 700 1.2rem/1.1 var(--font-display, "IBM Plex Sans Condensed", sans-serif); }
.join-guide p { margin: 6px 0 0; color: var(--ink-muted, #75695c); font-size: .875rem; font-weight: 500; line-height: 1.5; }

.copy-address { position: relative; overflow: hidden; width: 100%; min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px 12px 18px; border: 1px solid var(--hairline, #e7dccb); border-radius: 20px; color: var(--ink, #221c14); background: var(--surface, #fff); box-shadow: 0 10px 30px rgba(34,28,20,.08); cursor: pointer; text-align: left; transition: transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s, border-color .2s; }
.copy-address::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--sunset, linear-gradient(90deg, #f36f52, #f5b94d)); }
.copy-address:hover { border-color: color-mix(in srgb, var(--primary, #7458e8) 32%, transparent); box-shadow: 0 24px 60px rgba(34,28,20,.14); transform: translateY(-2px); }
.copy-address span { display: grid; gap: 7px; min-width: 0; }
.copy-address small { color: var(--ink-muted, #75695c); font: 700 .75rem/1 var(--font-body, Manrope, sans-serif); letter-spacing: .12em; text-transform: uppercase; }
.copy-address strong { color: var(--ink, #221c14); font: 700 1rem/1.2 var(--font-mono, monospace); overflow-wrap: anywhere; }
.copy-address b { flex: none; display: inline-flex; align-items: center; gap: 6px; min-width: 9.5em; justify-content: center; padding: 11px 16px; border-radius: 999px; color: #fff; background: var(--primary, #7458e8); font: 800 .8rem/1 var(--font-body, Manrope, sans-serif); white-space: nowrap; transition: background-color .2s; }
.copy-address b i { font-style: normal; }
.copy-address:hover b { background: var(--primary-deep, #5c42d0); }
.copy-address.is-copied { border-color: color-mix(in srgb, var(--live, #2fae72) 55%, transparent); }
.copy-feedback { min-height: 1.5em; margin: 8px 2px 0; color: var(--ink-muted, #75695c); font-size: .8125rem; font-weight: 600; line-height: 1.5; }
.copy-feedback.is-failed { color: var(--danger, #c94a43); }

.join-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 22px; }
.guide-link { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; margin-top: 8px; font-size: .875rem; font-weight: 750; }
.guide-link span { font-size: 1.05rem; transition: transform .25s cubic-bezier(.22,1,.36,1); }
.guide-link--guide { color: var(--ink, #221c14); transition: color .25s; }
.guide-link--guide:hover, .guide-link--guide:focus-visible { color: var(--primary, #7458e8); }
.guide-link--guide:hover span { transform: translateX(3px); }
.guide-link--discord { padding: 0 22px; border: 1px solid color-mix(in srgb, var(--primary, #7458e8) 45%, transparent); border-radius: 999px; color: var(--primary, #7458e8); transition: background-color .25s, color .25s, border-color .25s, transform .25s cubic-bezier(.22,1,.36,1); }
.guide-link--discord:hover, .guide-link--discord:focus-visible { color: var(--primary-deep, #5c42d0); border-color: var(--primary-deep, #5c42d0); background: var(--primary-tint, rgba(116,88,232,.12)); transform: translateY(-2px); }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.join-note { margin: 24px 0 0; color: var(--ink-muted, #75695c); font-size: .8125rem; font-weight: 500; line-height: 1.5; }

.orbit-arrival-enter-active { transition: opacity .8s ease, transform .8s cubic-bezier(.22,1,.36,1); }
.orbit-arrival-enter-from { opacity: 0; transform: translateY(-38%) scale(.94); }
.orbit-arrival-enter-active .orbit-arrival__line path { animation: thread-arrives .9s .1s cubic-bezier(.22,1,.36,1) both; }
.orbit-arrival-enter-active .orbit-arrival__seal { animation: seal-arrives .75s .44s cubic-bezier(.22,1,.36,1) both; }
.orbit-arrival-enter-active p { animation: copy-arrives .55s .56s cubic-bezier(.22,1,.36,1) both; }
@keyframes thread-arrives { from { stroke-dasharray: 480; stroke-dashoffset: 480; opacity: 0; } to { stroke-dasharray: 3 10; stroke-dashoffset: 0; opacity: .7; } }
@keyframes seal-arrives { from { opacity: 0; transform: scale(.42) rotate(-30deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
@keyframes copy-arrives { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* Without a free column the chosen seal becomes a compact row above the steps. */
@media (max-width: 1180px) {
  .orbit-arrival { position: relative; z-index: auto; top: auto; left: auto; right: auto; max-width: none; height: 64px; margin: 22px 0 0; transform: none; }
  .orbit-arrival-enter-from { transform: translateY(8px); }
  .orbit-arrival__line { display: none; }
  .orbit-arrival__seal { top: 0; right: 0; width: 60px; height: 60px; box-shadow: 0 8px 20px rgba(34,28,20,.1), 0 0 0 5px color-mix(in srgb, var(--orbit-accent) 10%, transparent); }
  .orbit-arrival p { top: 6px; right: 76px; gap: 5px; }
  .orbit-arrival strong { font-size: 1.45rem; }
}
@media (max-width: 760px) {
  .join-threshold { min-height: auto; padding: 96px var(--home-content-gutter, 20px) 68px; }
  .join-threshold__content { width: 100%; margin-left: 0; }
  .join-threshold h2 { font-size: clamp(3rem, 13vw, 4.6rem); }
  .copy-address { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .join-threshold__glow, .copy-address, .guide-link, .guide-link span, .guide-link--discord, .copy-address b,
  .orbit-arrival-enter-active, .orbit-arrival-enter-active .orbit-arrival__line path, .orbit-arrival-enter-active .orbit-arrival__seal, .orbit-arrival-enter-active p { animation: none; transition: none; }
}
</style>
