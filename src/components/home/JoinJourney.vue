<template>
  <section id="join" class="join-threshold" aria-labelledby="join-title">
    <img class="join-threshold__image" :src="portalImage" alt="" width="1228" height="528" decoding="async">
    <i class="join-threshold__veil" aria-hidden="true" />
    <i class="join-threshold__grain" aria-hidden="true" />

    <div class="join-threshold__content">
      <p class="join-kicker">Enter Mysterria</p>
      <h2 id="join-title">The portal is open.</h2>
      <p class="join-intro">Java Edition, no client mods. Connect, choose Mysteries in the lobby, and the first Pathway is yours to earn.</p>

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
import { computed, onUnmounted, ref } from 'vue';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';
import portalImage from '@/assets/images/home/world/lobby-portal.png';

const steps = [
  { title: 'Connect', copy: 'Add mc.mysterria.net in a current Java client.' },
  { title: 'Choose Mysteries', copy: 'Select Mysteries in the lobby to begin your first Pathway.' },
  { title: 'Begin', copy: 'Take Resolve to learn the potion loop with no permanent cost.' },
] as const;
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
let copyTimer: ReturnType<typeof setTimeout> | null = null;
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
.join-threshold__content { width:min(620px,100%); }
.join-kicker,.join-guide span { margin:0; color:#e6bd75; font:650 .65rem/1 "IBM Plex Mono",monospace; letter-spacing:.15em; text-transform:uppercase; }
.join-threshold h2 { margin:14px 0 16px; font:650 clamp(3.7rem,6.4vw,7rem)/.82 "IBM Plex Sans Condensed",sans-serif; letter-spacing:-.06em; }
.join-intro { max-width:510px; margin:0; color:rgba(252,249,242,.86); font-size:clamp(.84rem,1.08vw,1rem); line-height:1.65; }
.join-guide { display:grid; margin:30px 0 40px; padding:0; list-style:none; border-top:1px solid rgba(252,249,242,.17); }
.join-guide li { display:grid; grid-template-columns:48px 1fr; gap:16px; padding:13px 0; border-bottom:1px solid rgba(252,249,242,.17); }.join-guide span { align-self:start; padding-top:2px; font-size:.875rem; letter-spacing:.1em; }.join-guide strong { font:650 1.2rem/1 "IBM Plex Sans Condensed",sans-serif; }.join-guide p { margin:5px 0 0; color:rgba(252,249,242,.82); font-size:.72rem; line-height:1.5; }
.copy-address { width:100%; min-height:66px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:11px 15px; border:1px solid #102924; border-radius:8px; color:#102924; background:#f5f0e6; cursor:pointer; text-align:left; transition:transform .24s cubic-bezier(.22,1,.36,1),background-color .2s,box-shadow .2s; }.copy-address:hover { box-shadow:0 8px 26px rgba(0,0,0,.2); transform:translateY(-2px); background:#fffaf0; }.copy-address span { display:grid; gap:6px; }.copy-address small { color:rgba(16,41,36,.55); font:600 .53rem/1 "IBM Plex Mono",monospace; letter-spacing:.11em; text-transform:uppercase; }.copy-address strong { font:700 .78rem/1 "IBM Plex Mono",monospace; }.copy-address b { padding:10px 13px; border:1px solid rgba(16,41,36,.65); border-radius:6px; color:#102924; font-size:.7rem; white-space:nowrap; }
.copy-feedback { min-height:1.2em; margin:8px 0 0; color:rgba(252,249,242,.72); font:500 .54rem/1.4 "IBM Plex Mono",monospace; }.guide-link { display:inline-flex; align-items:center; gap:8px; min-height:44px; margin-top:12px; color:#f1cf91; font-size:.76rem; font-weight:750; }.guide-link span { font-size:1.1rem; }.join-note { margin:24px 0 0; color:rgba(252,249,242,.76); font-size:13px; line-height:1.5; }
@media (max-width:760px) { .join-threshold { min-height:auto; padding:96px 20px 68px; }.join-threshold__image { object-position:55% 30%; -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 38%,transparent 76%); mask-image:linear-gradient(to bottom,#000 0%,#000 38%,transparent 76%); }.join-threshold h2 { font-size:clamp(3rem,13vw,4.6rem); }.join-intro { font-size:.84rem; }.join-guide { margin-top:26px; }.copy-address strong { overflow-wrap:anywhere; } }
@media (prefers-reduced-motion:reduce) { .copy-address { transition:none; } }
</style>
