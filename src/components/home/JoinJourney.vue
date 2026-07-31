<template>
  <section
    id="join"
    ref="section"
    class="join-story"
    :class="`join-story--${activeStep.id}`"
    :style="joinStyle"
    aria-labelledby="join-title"
  >
    <div class="join-sticky">
      <div class="join-destination" aria-hidden="true">
        <img :src="townsImage" alt="" width="1280" height="720" loading="lazy" decoding="async">
        <i />
      </div>

      <div class="stone-gate" aria-hidden="true">
        <span class="gate-lintel"><i v-for="index in 9" :key="index" /></span>
        <span class="gate-pillar gate-pillar--left"><i v-for="index in 7" :key="index" /></span>
        <span class="gate-pillar gate-pillar--right"><i v-for="index in 7" :key="index" /></span>
        <span class="gate-door gate-door--left"><i /></span>
        <span class="gate-door gate-door--right"><i /></span>
      </div>

      <header class="join-heading">
        <p>Enter Mysterria</p>
        <h2 id="join-title">Your first step is simple.</h2>
      </header>

      <article :key="activeStep.id" class="join-copy">
        <span>{{ String(activeIndex + 1).padStart(2, '0') }} / 05</span>
        <p>{{ activeStep.verb }}</p>
        <h3>{{ activeStep.title }}</h3>
        <p>{{ activeStep.copy }}</p>
      </article>

      <div class="connection-panel" aria-label="Connect to Mysterria">
        <div class="edition-switch" aria-label="Choose Minecraft edition">
          <button
            v-for="edition in editions"
            :key="edition"
            type="button"
            :class="{ 'is-active': platform === edition }"
            :aria-pressed="platform === edition"
            @click="platform = edition"
          >
            <span aria-hidden="true">{{ edition === 'Java' ? 'J' : 'B' }}</span>
            <strong>{{ edition }}</strong>
          </button>
        </div>

        <button class="copy-address" type="button" @click="copyAddress">
          <span>
            <small>{{ platform }} server address</small>
            <strong>{{ MYSTERRIA_ADDRESS }}</strong>
          </span>
          <b>{{ copyLabel }}</b>
        </button>

        <p class="resource-note">
          <i aria-hidden="true">✓</i>
          Accept the server resource pack when Minecraft asks.
        </p>

        <nav class="join-links" aria-label="Joining help">
          <RouterLink to="/guide">Beginner guide <span aria-hidden="true">↗</span></RouterLink>
          <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noreferrer">Community <span aria-hidden="true">↗</span></a>
        </nav>
        <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
      </div>

      <nav class="join-steps" aria-label="Steps to join Mysterria">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          :class="{ 'is-active': activeIndex === index, 'is-complete': activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-label="`Step ${index + 1}: ${step.short}`"
          @click="goToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.short }}</strong>
        </button>
      </nav>

      <p class="join-payoff">A world to join. A Pathway to begin.</p>
    </div>

    <div class="join-static">
      <img :src="townsImage" alt="An illuminated Minecraft city in Mysterria at night." width="1280" height="720" loading="lazy" decoding="async">
      <div class="join-static__content">
        <p>Enter Mysterria</p>
        <h2>Your first step is simple.</h2>
        <ol>
          <li v-for="(step, index) in steps" :key="step.id">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <div><strong>{{ step.title }}</strong><p>{{ step.copy }}</p></div>
          </li>
        </ol>
        <div class="join-static__editions" role="group" aria-label="Choose Minecraft edition">
          <button
            v-for="edition in editions"
            :key="edition"
            type="button"
            :aria-pressed="platform === edition"
            :class="{ 'is-active': platform === edition }"
            @click="platform = edition"
          >{{ edition }}</button>
        </div>
        <div class="join-static__actions">
          <button type="button" @click="copyAddress">{{ copyLabel }} · {{ MYSTERRIA_ADDRESS }}</button>
          <RouterLink to="/guide">Beginner guide ↗</RouterLink>
          <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noreferrer">Community ↗</a>
        </div>
        <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';
import { useReducedMotion } from '@/composables/useReducedMotion';
import townsImage from '@/assets/images/home/world/towns.webp';

const steps = [
  { id: 'address', short: 'Address', verb: 'Copy', title: 'Add the server.', copy: 'Copy the address and add Mysterria to your multiplayer server list.' },
  { id: 'edition', short: 'Edition', verb: 'Choose', title: 'Java or Bedrock.', copy: 'Choose the edition you play. Both connect with the Mysterria server address.' },
  { id: 'pack', short: 'Resource pack', verb: 'Accept', title: 'Let the world load.', copy: 'Accept the server resource pack when Minecraft prompts you so custom visuals appear correctly.' },
  { id: 'enter', short: 'Enter', verb: 'Connect', title: 'Walk through.', copy: 'Join the server and follow the in-world onboarding into Mysterria.' },
  { id: 'begin', short: 'Begin', verb: 'Progress', title: 'Choose what comes next.', copy: 'Start your progression, gather ingredients and work toward your first potion.' },
] as const;
const editions = ['Java', 'Bedrock'] as const;

const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const platform = ref<(typeof editions)[number]>('Java');
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let frame = 0;
let visible = false;
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const activeStep = computed(() => steps[activeIndex.value]);
const copyLabel = computed(() => copyState.value === 'copied' ? 'Copied' : copyState.value === 'failed' ? 'Try again' : 'Copy address');
const copyFeedback = computed(() => {
  if (copyState.value === 'copied') return 'Server address copied to your clipboard.';
  if (copyState.value === 'failed') return `Copy failed. Select the address manually: ${MYSTERRIA_ADDRESS}`;
  return '';
});
const joinStyle = computed(() => ({
  '--join-progress': String(progress.value),
  '--gate-inset': `${Math.max(3, 29 - progress.value * 26)}%`,
  '--door-left': `${progress.value * -118}%`,
  '--door-right': `${progress.value * 118}%`,
  '--scene-scale': String(1.16 - progress.value * 0.14),
  '--scene-brightness': String(0.56 + progress.value * 0.38),
  '--scene-saturation': String(0.72 + progress.value * 0.32),
  '--join-glow-alpha': String(0.08 + progress.value * 0.24),
  '--heading-opacity': String(Math.max(0, 1 - progress.value * 2)),
  '--payoff-opacity': String(Math.max(0, Math.min(1, progress.value * 4 - 3))),
}));

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    const scaled = Math.min(steps.length - 0.0001, next * steps.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
  });
}

function goToStep(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  const next = (index + 0.16) / steps.length;
  progress.value = next;
  if (reducedMotion.value) return;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  const scrollRange = section.value.offsetHeight - innerHeight;
  window.scrollTo({ top: sectionTop + scrollRange * next, behavior: 'smooth' });
}

async function copyAddress() {
  copyState.value = 'idle';
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    } else {
      const field = document.createElement('textarea');
      field.value = MYSTERRIA_ADDRESS;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
  }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 3200);
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  }, { rootMargin: '10% 0px' });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<style scoped>
.join-story {
  --join-progress: 0;
  --gate-inset: 29%;
  --door-left: 0%;
  --door-right: 0%;
  --scene-scale: 1.16;
  position: relative;
  min-height: 430svh;
  color: #fcf9f2;
  background: #08151a;
}

.join-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 650px;
  overflow: hidden;
  isolation: isolate;
  background: #08151a;
}

.join-destination,
.join-destination::after,
.join-destination img,
.join-destination i { position: absolute; inset: 0; }

.join-destination { z-index: -3; overflow: hidden; clip-path: inset(8% var(--gate-inset) 8% var(--gate-inset) round 34px); }
.join-destination img { width: 100%; height: 100%; object-fit: cover; object-position: center 44%; filter: brightness(var(--scene-brightness)) saturate(var(--scene-saturation)); transform: scale(var(--scene-scale)); will-change: transform; }
.join-destination::after { content: ""; background: linear-gradient(0deg, rgba(8, 21, 26, .94), transparent 52%), linear-gradient(90deg, rgba(8, 21, 26, .72), transparent 35% 68%, rgba(8, 21, 26, .54)); }
.join-destination i { background: radial-gradient(circle at 56% 38%, rgba(237, 181, 97, var(--join-glow-alpha)), transparent 44%); }

.stone-gate { position: absolute; z-index: -1; inset: 0; pointer-events: none; filter: drop-shadow(0 28px 36px rgba(0, 0, 0, .48)); }
.gate-lintel,
.gate-pillar { position: absolute; display: grid; gap: 4px; }
.gate-lintel { left: calc(var(--gate-inset) - 4%); right: calc(var(--gate-inset) - 4%); top: 4.5%; grid-template-columns: repeat(9, 1fr); }
.gate-pillar { top: 5%; bottom: 0; width: 6.6%; grid-template-rows: repeat(7, 1fr); }
.gate-pillar--left { left: calc(var(--gate-inset) - 4%); }
.gate-pillar--right { right: calc(var(--gate-inset) - 4%); }
.gate-lintel i,
.gate-pillar i { min-width: 0; min-height: 0; border: 1px solid rgba(255, 242, 210, .08); background: linear-gradient(145deg, rgba(33, 51, 47, .76), rgba(11, 30, 31, .82) 68%); box-shadow: inset 8px 8px 14px rgba(255, 255, 255, .025); }
.gate-lintel i:nth-child(2n), .gate-pillar i:nth-child(2n) { background: linear-gradient(145deg, #2b3f38, #102425 72%); }

.gate-door { position: absolute; z-index: -1; top: 8%; bottom: 8%; width: 29%; overflow: hidden; border: 1px solid rgba(198, 155, 82, .3); background: rgba(10, 27, 29, .84); box-shadow: inset 0 0 50px rgba(0, 0, 0, .62); backdrop-filter: blur(2px); }
.gate-door::before { content: ""; position: absolute; inset: 5%; border: 1px solid rgba(198, 155, 82, .22); background: repeating-linear-gradient(90deg, transparent 0 32px, rgba(198, 155, 82, .08) 32px 33px), repeating-linear-gradient(0deg, transparent 0 64px, rgba(198, 155, 82, .06) 64px 65px); }
.gate-door i { position: absolute; top: 50%; width: 12px; aspect-ratio: 1; border: 1px solid #d1aa63; transform: rotate(45deg); box-shadow: 0 0 20px rgba(198, 155, 82, .42); }
.gate-door--left { left: var(--gate-inset); transform: translateX(var(--door-left)); }
.gate-door--left i { right: 17px; }
.gate-door--right { right: var(--gate-inset); transform: translateX(var(--door-right)); }
.gate-door--right i { left: 17px; }

.join-heading { position: absolute; z-index: 4; left: clamp(22px, 5vw, 80px); top: clamp(72px, 9vh, 104px); width: min(540px, 45vw); opacity: var(--heading-opacity); }
.join-heading p,
.join-copy > span,
.join-copy > p:first-of-type,
.join-static__content > p { margin: 0; color: #e1b66a; font: 650 .66rem/1 "IBM Plex Mono", monospace; letter-spacing: .15em; text-transform: uppercase; }
.join-heading h2 { margin: 13px 0 0; font: 650 clamp(3.5rem, 7vw, 8rem)/.8 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.055em; }

.join-copy { position: absolute; z-index: 4; left: clamp(22px, 5vw, 80px); top: 52%; width: min(410px, 33vw); padding: 24px 0; transform: translateY(-50%); text-shadow: 0 3px 26px #08151a; }
.join-copy > p:first-of-type { margin-top: 13px; }
.join-copy h3 { margin: 13px 0 15px; font: 650 clamp(3rem, 5.6vw, 6.5rem)/.82 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; text-wrap: balance; }
.join-copy > p:last-child { max-width: 390px; margin: 0; color: rgba(252, 249, 242, .7); font-size: .86rem; line-height: 1.65; }

.connection-panel { position: absolute; z-index: 5; right: clamp(22px, 5vw, 80px); bottom: clamp(78px, 11vh, 118px); width: min(410px, 34vw); display: grid; gap: 9px; padding: 12px; border: 1px solid rgba(252, 249, 242, .18); border-radius: 22px; background: rgba(8, 21, 26, .82); box-shadow: 0 24px 80px rgba(0, 0, 0, .32); backdrop-filter: blur(18px); }
.edition-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.edition-switch button { min-height: 48px; display: flex; align-items: center; gap: 9px; padding: 6px 10px; border: 1px solid rgba(252, 249, 242, .13); border-radius: 12px; color: rgba(252, 249, 242, .6); background: transparent; cursor: pointer; }
.edition-switch button.is-active { border-color: #d9ae62; color: #fcf9f2; background: rgba(198, 155, 82, .09); }
.edition-switch button > span { width: 29px; aspect-ratio: 1; display: grid; place-items: center; border-radius: 8px; color: #0d2926; background: #f5f0e6; font: 700 .64rem/1 "IBM Plex Mono", monospace; }
.edition-switch strong { font-size: .72rem; }
.copy-address { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 13px; border: 0; border-radius: 12px; color: #102924; background: #f5f0e6; cursor: pointer; text-align: left; transition: transform .3s cubic-bezier(.22, 1, .36, 1), background-color .2s; }
.copy-address:hover { transform: translateY(-2px); background: #fffaf0; }
.copy-address > span { min-width: 0; display: grid; gap: 6px; }
.copy-address small { color: rgba(16, 41, 36, .56); font: 600 .54rem/1 "IBM Plex Mono", monospace; letter-spacing: .11em; text-transform: uppercase; }
.copy-address strong { font: 700 .73rem/1 "IBM Plex Mono", monospace; overflow-wrap: anywhere; }
.copy-address b { flex: none; color: #7c5725; font-size: .7rem; }
.resource-note { min-height: 44px; display: flex; align-items: center; gap: 9px; margin: 0; padding: 7px 9px; color: rgba(252, 249, 242, .66); font-size: .65rem; line-height: 1.4; }
.resource-note i { width: 24px; aspect-ratio: 1; display: grid; place-items: center; flex: none; border-radius: 50%; color: #102924; background: #9bcba9; font-size: .65rem; font-style: normal; }
.join-links { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.join-links a { min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px; border: 1px solid rgba(252, 249, 242, .13); border-radius: 11px; color: rgba(252, 249, 242, .75); font-size: .67rem; font-weight: 750; }
.copy-feedback { min-height: 1em; margin: 0; color: rgba(252, 249, 242, .54); font: 500 .54rem/1.4 "IBM Plex Mono", monospace; }

.join-steps { position: absolute; z-index: 5; left: 50%; bottom: 20px; width: min(790px, calc(100% - 44px)); display: grid; grid-template-columns: repeat(5, 1fr); transform: translateX(-50%); }
.join-steps button { position: relative; min-width: 44px; min-height: 52px; display: grid; place-items: center; gap: 3px; padding: 7px; border: 0; border-top: 2px solid rgba(252, 249, 242, .3); color: rgba(252, 249, 242, .7); background: rgba(8, 21, 26, .62); cursor: pointer; }
.join-steps button.is-active { border-color: #dfb46a; color: #fcf9f2; }
.join-steps button.is-complete { color: #9bcba9; }
.join-steps span { font: 650 .57rem/1 "IBM Plex Mono", monospace; }
.join-steps strong { font-size: .62rem; }
.join-payoff { position: absolute; z-index: 4; left: 50%; top: 19%; margin: 0; color: rgba(252, 249, 242, .68); font: 550 .61rem/1 "IBM Plex Mono", monospace; letter-spacing: .13em; text-transform: uppercase; opacity: var(--payoff-opacity); transform: translateX(-50%); white-space: nowrap; }
.join-static { display: none; }
.join-static__editions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 10px; }
.join-static__editions button { min-height: 46px; border: 1px solid rgba(252, 249, 242, .28); border-radius: 11px; color: #fcf9f2; background: transparent; font-weight: 750; }
.join-static__editions button.is-active { border-color: #dfb46a; color: #102924; background: #dfb46a; }

@media (max-width: 760px) {
  .join-story { min-height: 390svh; }
  .join-heading { left: 16px; top: 74px; width: calc(100% - 32px); }
  .join-heading h2 { font-size: clamp(3.3rem, 16vw, 5.5rem); }
  .join-copy { left: 16px; top: auto; bottom: 318px; width: calc(100% - 32px); transform: none; }
  .join-copy h3 { font-size: clamp(2.4rem, 11vw, 3.7rem); }
  .join-copy-enter-from { opacity: 0; transform: translateX(-20px); }
  .join-copy-leave-to { opacity: 0; transform: translateX(20px); }
  .connection-panel { left: 16px; right: auto; bottom: 72px; width: calc(100% - 32px); }
  .join-steps { bottom: 8px; width: 100%; }
  .join-steps strong { display: none; }
  .join-payoff { display: none; }
  .gate-pillar { width: 9%; }
  .stone-gate { opacity: .82; }
}

@media (max-width: 340px), (max-height: 560px) {
  .join-story { min-height: auto; padding: 62px 12px; }
  .join-sticky { display: none; }
  .join-static { display: grid; overflow: hidden; border-radius: 24px; background: #102724; }
  .join-static > img { width: 100%; height: 250px; object-fit: cover; }
  .join-static__content { padding: 28px 18px; }
  .join-static__content > h2 { margin: 12px 0 28px; font: 650 3rem/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .join-static ol { display: grid; gap: 0; margin: 0 0 26px; padding: 0; list-style: none; }
  .join-static li { display: grid; grid-template-columns: 30px 1fr; gap: 10px; padding: 16px 0; border-top: 1px solid rgba(252, 249, 242, .1); }
  .join-static li > span { color: #dfb46a; font: 650 .58rem/1.5 "IBM Plex Mono", monospace; }
  .join-static li strong { font: 650 1.35rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .join-static li p { margin: 7px 0 0; color: rgba(252, 249, 242, .62); font-size: .73rem; line-height: 1.55; }
  .join-static__actions { display: grid; gap: 8px; }
  .join-static__actions button, .join-static__actions a { min-height: 46px; display: flex; align-items: center; justify-content: center; padding: 9px; border: 1px solid rgba(252, 249, 242, .14); border-radius: 11px; color: #fcf9f2; background: transparent; font-size: .68rem; font-weight: 750; }
  .join-static__actions button { border: 0; color: #102924; background: #f5f0e6; }
}

@media (prefers-reduced-motion: reduce) {
  .join-story { min-height: auto; padding: 90px 24px; background: #08151a; }
  .join-sticky { display: none; }
  .join-static { width: min(1120px, 100%); display: grid; grid-template-columns: 1.05fr .95fr; overflow: hidden; margin: 0 auto; border-radius: 32px; background: #102724; }
  .join-static > img { width: 100%; height: 100%; min-height: 720px; object-fit: cover; }
  .join-static__content { align-self: center; padding: 48px; }
  .join-static__content > h2 { margin: 13px 0 30px; font: 650 clamp(3rem, 6vw, 6rem)/.84 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .join-static ol { display: grid; margin: 0 0 28px; padding: 0; list-style: none; }
  .join-static li { display: grid; grid-template-columns: 34px 1fr; gap: 10px; padding: 16px 0; border-top: 1px solid rgba(252, 249, 242, .1); }
  .join-static li > span { color: #dfb46a; font: 650 .58rem/1.5 "IBM Plex Mono", monospace; }
  .join-static li strong { font: 650 1.35rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .join-static li p { margin: 7px 0 0; color: rgba(252, 249, 242, .62); font-size: .72rem; line-height: 1.55; }
  .join-static__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .join-static__actions button, .join-static__actions a { min-height: 46px; display: flex; align-items: center; justify-content: center; padding: 9px; border: 1px solid rgba(252, 249, 242, .14); border-radius: 11px; color: #fcf9f2; background: transparent; font-size: .68rem; font-weight: 750; }
  .join-static__actions button { grid-column: 1 / -1; border: 0; color: #102924; background: #f5f0e6; }
}

@media (prefers-reduced-motion: reduce) and (max-width: 760px) {
  .join-story { padding: 70px 14px; }
  .join-static { grid-template-columns: 1fr; }
  .join-static > img { min-height: 280px; max-height: 46svh; }
  .join-static__content { padding: 32px 20px; }
}
</style>
