<template>
  <section id="join" class="join-threshold" aria-labelledby="join-title">
    <img class="join-threshold__image" :src="portalImage" alt="" width="1228" height="528" decoding="async">
    <i class="join-threshold__veil" aria-hidden="true" />
    <i class="join-threshold__grain" aria-hidden="true" />
    <div class="join-threshold__content">
      <p class="join-kicker">Enter Mysterria</p>
      <h2 id="join-title">The portal is open.</h2>
      <p class="join-intro">Java Edition, no client mods. Connect, choose Mysteries in the lobby, and the first Pathway is yours to earn.</p>
      <Transition name="orbit-arrival">
        <aside v-if="selectedPathway" :key="selectedPathway.id" class="orbit-arrival" :style="pathwayStyle" :aria-label="`${selectedPathway.name} Pathway carries forward to the portal`">
          <svg class="orbit-arrival__line" viewBox="0 0 570 260" aria-hidden="true"><path d="M26 218C108 216 118 126 214 137S316 213 386 147 436 46 540 44" /><circle cx="26" cy="218" r="4" /><circle cx="214" cy="137" r="3" /><circle cx="386" cy="147" r="4" /></svg>
          <span class="orbit-arrival__seal"><img :src="selectedPathway.image" alt="" width="72" height="72" decoding="async"></span>
          <p><small>Orbit carried forward</small><strong>{{ selectedPathway.name }}</strong></p>
        </aside>
      </Transition>

      <ol class="join-guide" aria-label="Your first steps">
        <li v-for="(step, index) in steps" :key="step.title">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div><strong>{{ step.title }}</strong><p>{{ step.copy }}</p></div>
        </li>
      </ol>

      <button class="copy-address" type="button" @click="copyAddress">
        <span><small>Server address</small><strong>{{ MYSTERRIA_ADDRESS }}</strong></span>
        <b>{{ copyLabel }}</b>
      </button>
      <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
      <RouterLink class="guide-link" to="/guide">Read the beginner guide <span aria-hidden="true">→</span></RouterLink>
      <p class="join-note">Accept the resource pack when prompted. Bedrock can connect, but some custom interfaces may not render.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, type CSSProperties } from 'vue';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';
import type { HomePathway } from '@/data/pathways';
import portalImage from '@/assets/images/home/world/lobby-portal.png';

const props = defineProps<{ selectedPathway?: HomePathway | null }>();
const steps = [
  { title: 'Connect', copy: 'Add mc.mysterria.net in a current Java client.' },
  { title: 'Choose Mysteries', copy: 'Select Mysteries in the lobby to begin your first Pathway.' },
  { title: 'Begin', copy: 'Take Resolve to learn the potion loop with no permanent cost.' },
] as const;
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
let copyTimer: ReturnType<typeof setTimeout> | null = null;
const selectedPathway = computed(() => props.selectedPathway ?? null);
const pathwayStyle = computed<CSSProperties>(() => selectedPathway.value ? {
  '--orbit-accent': selectedPathway.value.theme.accent,
  '--orbit-accent-2': selectedPathway.value.theme.accent2,
  '--orbit-surface': selectedPathway.value.theme.surface,
} : {});
const copyLabel = computed(() => copyState.value === 'copied' ? 'Copied' : copyState.value === 'failed' ? 'Try again' : 'Copy address');
const copyFeedback = computed(() => copyState.value === 'copied' ? 'Server address copied to your clipboard.' : copyState.value === 'failed' ? `Copy failed. Select the address manually: ${MYSTERRIA_ADDRESS}` : '');
async function copyAddress() {
  try { await navigator.clipboard.writeText(MYSTERRIA_ADDRESS); copyState.value = 'copied'; } catch { copyState.value = 'failed'; }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 3200);
}
onUnmounted(() => { if (copyTimer) clearTimeout(copyTimer); });
</script>

<style scoped>
.join-threshold { position: relative; min-height: 100svh; display: grid; place-items: center; overflow: hidden; padding: 110px 24px 88px; color: #fcf9f2; background: linear-gradient(180deg,#091718 0%,#0a1b1d 55%,#08151a 100%); isolation: isolate; }
.join-threshold__image,.join-threshold__veil,.join-threshold__grain { position:absolute; inset:0; width:100%; height:100%; }
.join-threshold__image { z-index:-3; object-fit:cover; object-position:center; filter:brightness(.67) saturate(.8) hue-rotate(8deg); transform:scale(1.03); }
.join-threshold__veil { z-index:-2; background:linear-gradient(180deg,rgba(5,17,19,.55),rgba(9,23,24,.82) 55%,#08151a),radial-gradient(ellipse at 50% 42%,rgba(121,204,186,.16),transparent 28%); }
.join-threshold__grain { z-index:-1; opacity:.1; mix-blend-mode:soft-light; background-image:radial-gradient(rgba(255,255,255,.7) .5px,transparent .5px); background-size:4px 4px; }
.orbit-arrival { position:absolute; z-index:-1; top:50%; left:74%; width:min(48vw,690px); pointer-events:none; color:var(--orbit-accent); transform:translate(-50%,-45%); filter:drop-shadow(0 0 18px color-mix(in srgb,var(--orbit-accent) 40%,transparent)); }.orbit-arrival__line { display:block; width:100%; overflow:visible; fill:none; stroke:var(--orbit-accent); stroke-width:1.2; stroke-linecap:round; opacity:.76; }.orbit-arrival__line path { stroke-dasharray:3 10; }.orbit-arrival__line circle { fill:var(--orbit-accent); filter:drop-shadow(0 0 7px var(--orbit-accent)); }.orbit-arrival__seal { position:absolute; top:13%; right:3%; width:76px; height:76px; display:grid; place-items:center; overflow:hidden; border:1px solid color-mix(in srgb,var(--orbit-accent) 76%,transparent); border-radius:50%; background:color-mix(in srgb,var(--orbit-surface) 80%,transparent); box-shadow:0 0 0 8px color-mix(in srgb,var(--orbit-accent) 10%,transparent),0 0 30px color-mix(in srgb,var(--orbit-accent) 34%,transparent); }.orbit-arrival__seal::after { content:""; position:absolute; inset:12px; border:1px solid color-mix(in srgb,var(--orbit-accent-2) 72%,transparent); border-radius:50%; }.orbit-arrival__seal img { width:70%; height:70%; object-fit:cover; opacity:.9; mix-blend-mode:screen; }.orbit-arrival p { position:absolute; top:39%; right:7%; display:grid; gap:4px; margin:0; text-align:right; }.orbit-arrival small { color:rgba(252,249,242,.64); font:600 .49rem/1 "IBM Plex Mono",monospace; letter-spacing:.12em; text-transform:uppercase; }.orbit-arrival strong { color:var(--orbit-accent); font:650 clamp(1.3rem,2.1vw,2rem)/1 "IBM Plex Sans Condensed",sans-serif; letter-spacing:-.035em; }
.join-threshold__content { width:min(620px,100%); }
.join-kicker,.join-guide span { margin:0; color:#e6bd75; font:650 .65rem/1 "IBM Plex Mono",monospace; letter-spacing:.15em; text-transform:uppercase; }
.join-threshold h2 { margin:14px 0 16px; font:650 clamp(3.7rem,6.4vw,7rem)/.82 "IBM Plex Sans Condensed",sans-serif; letter-spacing:-.06em; }
.join-intro { max-width:510px; margin:0; color:rgba(252,249,242,.86); font-size:clamp(.84rem,1.08vw,1rem); line-height:1.65; }
.join-guide { display:grid; margin:30px 0 40px; padding:0; list-style:none; border-top:1px solid rgba(252,249,242,.17); }
.join-guide li { display:grid; grid-template-columns:48px 1fr; gap:16px; padding:13px 0; border-bottom:1px solid rgba(252,249,242,.17); }.join-guide span { align-self:start; padding-top:2px; font-size:.875rem; letter-spacing:.1em; }.join-guide strong { font:650 1.2rem/1 "IBM Plex Sans Condensed",sans-serif; }.join-guide p { margin:5px 0 0; color:rgba(252,249,242,.82); font-size:.72rem; line-height:1.5; }
.copy-address { width:100%; min-height:66px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:11px 15px; border:1px solid #102924; border-radius:8px; color:#102924; background:#f5f0e6; cursor:pointer; text-align:left; transition:transform .24s cubic-bezier(.22,1,.36,1),background-color .2s,box-shadow .2s; }.copy-address:hover { box-shadow:0 8px 26px rgba(0,0,0,.2); transform:translateY(-2px); background:#fffaf0; }.copy-address span { display:grid; gap:6px; }.copy-address small { color:rgba(16,41,36,.55); font:600 .53rem/1 "IBM Plex Mono",monospace; letter-spacing:.11em; text-transform:uppercase; }.copy-address strong { font:700 .78rem/1 "IBM Plex Mono",monospace; }.copy-address b { padding:10px 13px; border:1px solid rgba(16,41,36,.65); border-radius:6px; color:#102924; font-size:.7rem; white-space:nowrap; }
.copy-feedback { min-height:1.2em; margin:8px 0 0; color:rgba(252,249,242,.72); font:500 .54rem/1.4 "IBM Plex Mono",monospace; }.guide-link { display:inline-flex; align-items:center; gap:8px; min-height:44px; margin-top:12px; color:#f1cf91; font-size:.76rem; font-weight:750; }.guide-link span { font-size:1.1rem; }.join-note { margin:24px 0 0; color:rgba(252,249,242,.76); font-size:13px; line-height:1.5; }
.orbit-arrival-enter-active { transition:opacity .8s ease,transform .8s cubic-bezier(.22,1,.36,1); }.orbit-arrival-enter-from { opacity:0; transform:translate(-46%,-35%) scale(.9); }.orbit-arrival-enter-active .orbit-arrival__line path { animation:thread-arrives .9s .1s cubic-bezier(.22,1,.36,1) both; }.orbit-arrival-enter-active .orbit-arrival__seal { animation:seal-arrives .75s .44s cubic-bezier(.22,1,.36,1) both; }.orbit-arrival-enter-active p { animation:copy-arrives .55s .56s cubic-bezier(.22,1,.36,1) both; } @keyframes thread-arrives { from { stroke-dasharray:480; stroke-dashoffset:480; opacity:0; } to { stroke-dasharray:3 10; stroke-dashoffset:0; opacity:.76; } } @keyframes seal-arrives { from { opacity:0; transform:scale(.42) rotate(-30deg); } to { opacity:1; transform:scale(1) rotate(0); } } @keyframes copy-arrives { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
@media (max-width:760px) { .join-threshold { min-height:auto; padding:96px 20px 68px; }.join-threshold__image { object-position:55% 30%; -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 38%,transparent 76%); mask-image:linear-gradient(to bottom,#000 0%,#000 38%,transparent 76%); }.orbit-arrival { position:relative; top:auto; left:auto; width:100%; height:58px; margin:16px 0 0; transform:none; opacity:.82; }.orbit-arrival__line { width:72%; margin-top:18px; }.orbit-arrival__seal { top:0; right:0; width:54px; height:54px; }.orbit-arrival p { top:4px; right:68px; }.orbit-arrival strong { font-size:1.45rem; }.join-threshold h2 { font-size:clamp(3rem,13vw,4.6rem); }.join-intro { font-size:.84rem; }.join-guide { margin-top:26px; }.copy-address strong { overflow-wrap:anywhere; } }
@media (prefers-reduced-motion:reduce) { .copy-address,.orbit-arrival-enter-active .orbit-arrival__line path,.orbit-arrival-enter-active .orbit-arrival__seal,.orbit-arrival-enter-active p { animation:none; transition:none; } }
</style>
