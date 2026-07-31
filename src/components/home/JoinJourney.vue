<template>
  <section
    id="join"
    ref="section"
    class="enter-journey"
    :class="`enter-stage-${activeIndex}`"
    :style="{ '--enter-progress': String(progress), '--enter-local': String(localProgress) }"
    aria-labelledby="enter-title"
  >
    <div class="enter-sticky">
      <div class="enter-scene" aria-hidden="true">
        <img src="@/assets/images/optimized/Server.webp" alt="" width="1920" height="1080" loading="lazy">
        <div class="gate-block gate-block--left" />
        <div class="gate-block gate-block--right" />
        <div class="enter-shade" />
      </div>

      <div class="portal" aria-hidden="true">
        <i class="portal-light" />
        <span class="portal-destination">
          <img src="@/assets/images/optimized/Server.webp" alt="" width="1920" height="1080" loading="lazy">
        </span>
        <i class="portal-ring portal-ring--one" />
        <i class="portal-ring portal-ring--two" />
        <i class="portal-ring portal-ring--three" />
        <span class="portal-door portal-door--left" />
        <span class="portal-door portal-door--right" />
        <b />
      </div>

      <header class="enter-heading">
        <span>Enter Mysterria</span>
        <h2 id="enter-title">Step through.</h2>
      </header>

      <Transition name="enter-copy" mode="out-in">
        <article :key="activeStep.title" class="enter-copy">
          <span>{{ String(activeIndex + 1).padStart(2, '0') }} / 05</span>
          <h3>{{ activeStep.title }}</h3>
          <p>{{ activeStep.copy }}</p>
        </article>
      </Transition>

      <div class="join-console">
        <div class="edition-choice" aria-label="Minecraft edition">
          <button
            v-for="edition in ['Java', 'Bedrock']"
            :key="edition"
            type="button"
            :class="{ active: platform === edition }"
            :aria-pressed="platform === edition"
            @click="platform = edition"
          >
            <i aria-hidden="true">{{ edition[0] }}</i>
            <span>{{ edition }}</span>
          </button>
        </div>
        <button class="copy-address" type="button" @click="copyAddress">
          <span><small>Server address</small><strong>{{ MYSTERRIA_ADDRESS }}</strong></span>
          <b>{{ copied ? 'Copied' : 'Copy' }}</b>
        </button>
        <div class="join-exits">
          <RouterLink to="/guide">Beginner guide ↗</RouterLink>
          <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noreferrer">Community ↗</a>
        </div>
      </div>

      <nav class="enter-steps" aria-label="Joining steps">
        <button
          v-for="(step, index) in steps"
          :key="step.title"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-label="`Joining step ${index + 1}: ${step.title}`"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-pressed="activeIndex === index"
          @click="goToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.short }}</strong>
        </button>
      </nav>

      <p class="enter-payoff">The light from the first frame was the way in.</p>
    </div>

    <ol class="static-enter">
      <li v-for="(step, index) in steps" :key="step.title">
        <span>{{ index + 1 }}</span><div><strong>{{ step.title }}</strong><p>{{ step.copy }}</p></div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';
import { useReducedMotion } from '@/composables/useReducedMotion';

const steps = [
  { short: 'Address', title: 'Add the server', copy: 'Copy the address and add Mysterria to your multiplayer list.' },
  { short: 'Edition', title: 'Choose your edition', copy: 'Connect from Java or Bedrock using the same server address.' },
  { short: 'Pack', title: 'Accept the resource pack', copy: 'Allow the server resource pack when Minecraft prompts you.' },
  { short: 'Enter', title: 'Enter the world', copy: 'Join the server and follow the in-world onboarding.' },
  { short: 'Begin', title: 'Begin progression', copy: 'Choose a Pathway, find ingredients and work toward your first potion.' },
];

const section = ref<HTMLElement | null>(null);
const activeIndex = ref(0);
const progress = ref(0);
const localProgress = ref(0);
const platform = ref('Java');
const copied = ref(false);
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let visible = false;
let frame = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const activeStep = computed(() => steps[activeIndex.value]);

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    const scaled = Math.min(steps.length - .0001, next * steps.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
    localProgress.value = scaled - Math.floor(scaled);
  });
}

function goToStep(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  localProgress.value = .2;
  progress.value = (index + .2) / steps.length;
  if (reducedMotion.value) {
    return;
  }
  const range = section.value.offsetHeight - innerHeight;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  document.documentElement.scrollTop = sectionTop + range * progress.value;
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 1800);
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.enter-journey {
  --enter-progress: 0;
  position: relative;
  min-height: 390svh;
  color: #fcf9f2;
  background: #08151a;
}
.enter-journey::before {
  content: "";
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  height: 240px;
  background:
    radial-gradient(ellipse at 50% 0, rgba(224, 189, 113, .26), transparent 42%),
    linear-gradient(180deg, #08191b, transparent 88%);
  pointer-events: none;
}
.enter-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 680px;
  overflow: hidden;
  isolation: isolate;
  background: #08151a;
}
.enter-sticky::after {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  opacity: clamp(0, calc(var(--enter-progress) * 5 - 4), 1);
  background:
    radial-gradient(ellipse at 50% 44%, rgba(255, 229, 160, .28), transparent 34%),
    linear-gradient(180deg, transparent 48%, rgba(81, 128, 99, .18));
  pointer-events: none;
}
.enter-scene,
.enter-scene img,
.enter-shade { position: absolute; inset: 0; }
.enter-scene { z-index: -2; }
.enter-scene img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.52) contrast(1.1);
  transform: scale(calc(1.08 + var(--enter-progress) * .28));
  will-change: transform;
}
.enter-shade {
  z-index: 2;
  background:
    radial-gradient(ellipse at 50% 45%, transparent 0 17%, rgba(8, 21, 26, .18) 36%, rgba(8, 21, 26, .82) 80%),
    linear-gradient(0deg, #08151a 0, transparent 42%, rgba(8, 21, 26, .72));
}
.gate-block {
  position: absolute;
  z-index: 1;
  top: 0;
  width: 30%;
  height: 100%;
  opacity: .9;
  background:
    linear-gradient(90deg, transparent 8%, #071719 8% 78%, transparent 78%),
    linear-gradient(#09201f 22%, transparent 22% 30%, #071719 30% 76%, transparent 76%);
  background-size: 74px 74px;
}
.gate-block--left { left: -8%; transform: translateX(calc(var(--enter-progress) * -13%)); }
.gate-block--right { right: -8%; transform: scaleX(-1) translateX(calc(var(--enter-progress) * -13%)); }

.portal {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 46%;
  width: min(42vw, 510px);
  aspect-ratio: .76;
  transform: translate(-50%, -50%) scale(calc(.77 + var(--enter-progress) * .46));
  filter: drop-shadow(0 0 calc(20px + var(--enter-progress) * 28px) rgba(224, 189, 113, .38));
}
.portal-light,
.portal-destination,
.portal-ring,
.portal-door,
.portal b { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.portal-light { width: 88%; height: 88%; border-radius: 50%; background: radial-gradient(ellipse, rgba(245, 226, 173, calc(.22 + var(--enter-progress) * .55)), rgba(33, 100, 77, .42) 32%, transparent 70%); filter: blur(10px); }
.portal-destination {
  z-index: -1;
  width: 55%;
  height: 78%;
  overflow: hidden;
  border: 1px solid rgba(245, 226, 173, .5);
  border-radius: 50%;
  opacity: clamp(0, calc(var(--enter-progress) * 4 - 2.5), 1);
  transform: translate(-50%, -50%) scale(calc(.76 + var(--enter-progress) * .3));
  box-shadow: inset 0 0 34px rgba(255, 235, 178, .28), 0 0 42px rgba(224, 189, 113, .32);
}
.portal-destination img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 23% 43%;
  filter: saturate(1.08) contrast(.84) brightness(calc(1.05 + var(--enter-progress) * 1.3));
  transform: scale(calc(1.18 - var(--enter-progress) * .13)) translateY(calc((1 - var(--enter-progress)) * 3%));
}
.portal-destination::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 43% 42%, rgba(255, 238, 185, .3), transparent 58%);
  mix-blend-mode: screen;
}
.portal-ring { border: 2px solid rgba(224, 189, 113, .74); border-radius: 50%; }
.portal-ring--one { width: 72%; height: 94%; transform: translate(-50%, -50%) rotate(calc(var(--enter-progress) * 72deg)); }
.portal-ring--two { width: 58%; height: 82%; border-style: dashed; transform: translate(-50%, -50%) rotate(calc(var(--enter-progress) * -116deg)); }
.portal-ring--three { width: 42%; height: 68%; border-color: rgba(157, 215, 182, .72); transform: translate(-50%, -50%) rotate(calc(var(--enter-progress) * 42deg)); }
.portal-door { width: 21%; height: 61%; border: 1px solid rgba(224, 189, 113, .48); background: rgba(8, 21, 26, .73); }
.portal-door--left { transform: translate(calc(-100% - var(--enter-progress) * 45%), -50%) perspective(400px) rotateY(calc(var(--enter-progress) * -54deg)); transform-origin: right; }
.portal-door--right { transform: translate(calc(0% + var(--enter-progress) * 45%), -50%) perspective(400px) rotateY(calc(var(--enter-progress) * 54deg)); transform-origin: left; }
.portal b { width: calc(13% + var(--enter-progress) * 4%); aspect-ratio: 1; background: #e0bd71; box-shadow: 0 0 28px #e0bd71, 0 0 70px rgba(157, 215, 182, .68); transform: translate(-50%, -50%) rotate(45deg); }

.enter-heading {
  position: absolute;
  z-index: 6;
  left: clamp(22px, 5vw, 76px);
  top: clamp(82px, 10vh, 112px);
  opacity: clamp(0, calc(1 - var(--enter-progress) * 1.8), 1);
}
.enter-heading span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .17em; text-transform: uppercase; }
.enter-heading h2 { margin: 12px 0 0; font: 650 clamp(4rem, 8vw, 8.5rem)/.78 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.06em; }

.enter-copy {
  position: absolute;
  z-index: 7;
  left: clamp(22px, 6vw, 92px);
  top: 52%;
  width: min(360px, 29vw);
  transform: translateY(-50%);
  text-shadow: 0 2px 20px rgba(0, 0, 0, .55);
}
.enter-copy > span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .14em; }
.enter-copy h3 { margin: 13px 0 11px; font: 650 clamp(2.2rem, 4vw, 4.2rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.045em; }
.enter-copy p { margin: 0; color: rgba(252, 249, 242, .68); font-size: .88rem; line-height: 1.6; }
.enter-copy-enter-active,
.enter-copy-leave-active { transition: opacity .24s, transform .3s cubic-bezier(.22, 1, .36, 1); }
.enter-copy-enter-from { opacity: 0; transform: translate(-18px, -50%); }
.enter-copy-leave-to { opacity: 0; transform: translate(18px, -50%); }

.join-console {
  position: absolute;
  z-index: 8;
  right: clamp(22px, 5vw, 76px);
  bottom: clamp(72px, 10vh, 112px);
  width: min(390px, 34vw);
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(252, 249, 242, .17);
  border-radius: 18px;
  background: rgba(8, 21, 26, .76);
  backdrop-filter: blur(16px);
}
.edition-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.edition-choice button {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px;
  border: 1px solid rgba(252, 249, 242, .13);
  border-radius: 10px;
  color: rgba(252, 249, 242, .62);
  background: transparent;
  cursor: pointer;
}
.edition-choice button.active { border-color: #e0bd71; color: #fcf9f2; background: rgba(224, 189, 113, .08); }
.edition-choice i { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px; color: #102924; background: #f5f0e6; font: 700 10px/1 "IBM Plex Mono", monospace; font-style: normal; }
.edition-choice span { font-size: .72rem; font-weight: 750; }
.copy-address {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 0;
  border-radius: 10px;
  color: #102924;
  background: #f5f0e6;
  cursor: pointer;
  text-align: left;
}
.copy-address span { min-width: 0; display: grid; gap: 5px; }
.copy-address small { font: 600 8px/1 "IBM Plex Mono", monospace; letter-spacing: .11em; text-transform: uppercase; opacity: .54; }
.copy-address strong { font: 700 11px/1 "IBM Plex Mono", monospace; overflow-wrap: anywhere; }
.copy-address b { color: #8b632c; font-size: .72rem; }
.join-exits { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.join-exits a { min-height: 44px; display: flex; align-items: center; justify-content: center; padding: 6px; border: 1px solid rgba(252, 249, 242, .12); border-radius: 9px; color: rgba(252, 249, 242, .7); font-size: .65rem; font-weight: 700; }

.enter-steps {
  position: absolute;
  z-index: 8;
  left: clamp(22px, 6vw, 92px);
  bottom: 22px;
  width: min(650px, calc(100% - 44px));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.enter-steps button {
  min-width: 44px;
  min-height: 48px;
  display: grid;
  place-items: center;
  gap: 2px;
  padding: 5px;
  border: 0;
  border-top: 2px solid rgba(252, 249, 242, .13);
  color: rgba(252, 249, 242, .38);
  background: rgba(8, 21, 26, .28);
  cursor: pointer;
}
.enter-steps button.active { border-color: #e0bd71; color: #fcf9f2; }
.enter-steps button.complete { color: rgba(157, 215, 182, .62); }
.enter-steps span { font: 650 10px/1 "IBM Plex Mono", monospace; }
.enter-steps strong { font-size: .67rem; }
.enter-payoff {
  position: absolute;
  z-index: 8;
  left: 50%;
  bottom: 26px;
  margin: 0;
  color: rgba(252, 249, 242, .55);
  font: 500 8px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  opacity: clamp(0, calc(var(--enter-progress) * 3 - 2), 1);
  transform: translateX(-50%);
  white-space: nowrap;
}
.static-enter { display: none; }

@media (max-width: 760px) {
  .enter-journey { min-height: 360svh; }
  .enter-sticky { min-height: 650px; }
  .portal { top: 38%; width: min(76vw, 340px); }
  .enter-heading { left: 16px; top: 76px; }
  .enter-heading h2 { font-size: clamp(3.5rem, 18vw, 6rem); }
  .enter-copy { left: 16px; top: auto; bottom: 278px; width: calc(100% - 32px); transform: none; }
  .enter-copy h3 { font-size: clamp(2rem, 10vw, 3rem); }
  .enter-copy-enter-from { opacity: 0; transform: translateX(-16px); }
  .enter-copy-leave-to { opacity: 0; transform: translateX(16px); }
  .join-console { left: 16px; right: auto; bottom: 66px; width: calc(100% - 32px); }
  .enter-steps { left: 0; bottom: 8px; width: 100%; }
  .enter-steps strong { display: none; }
  .enter-payoff { display: none; }
}

@media (max-width: 260px) {
  .enter-journey { min-height: auto; padding: 70px 10px 30px; }
  .enter-sticky { position: relative; height: auto; min-height: 640px; overflow: visible; }
  .enter-heading { position: relative; inset: auto; }
  .enter-heading h2 { font-size: 3.2rem; }
  .portal { top: 205px; width: min(170px, 100%); }
  .enter-copy,
  .enter-steps { display: none; }
  .join-console { position: relative; left: auto; bottom: auto; width: 100%; margin-top: 330px; }
  .edition-choice,
  .join-exits { grid-template-columns: 1fr; }
  .static-enter { display: grid; margin: 30px 0 0; padding: 0; list-style: none; }
  .static-enter li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; padding: 16px 0; border-bottom: 1px solid rgba(252, 249, 242, .1); }
  .static-enter li > span { color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; }
  .static-enter strong { font: 650 1.35rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-enter p { margin: 7px 0 0; color: rgba(252, 249, 242, .62); font-size: .72rem; line-height: 1.5; }
}

@media (prefers-reduced-motion: reduce) {
  .enter-journey { min-height: auto; padding: 90px 20px; }
  .enter-sticky { position: relative; height: 78svh; min-height: 600px; }
  .enter-copy,
  .enter-steps { display: none; }
  .static-enter { width: min(900px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 34px auto 0; padding: 0; list-style: none; }
  .static-enter li { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 9px; padding: 20px; border: 1px solid rgba(252, 249, 242, .1); }
  .static-enter li > span { color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; }
  .static-enter strong { font: 650 1.5rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-enter p { margin: 7px 0 0; color: rgba(252, 249, 242, .62); font-size: .76rem; line-height: 1.5; }
}
</style>
