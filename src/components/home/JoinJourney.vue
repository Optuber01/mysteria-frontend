<template>
  <section
    id="join"
    ref="section"
    class="join-story"
    :style="joinStyle"
    aria-labelledby="join-title"
  >
    <div class="join-sticky">
      <div class="join-scenes" aria-hidden="true">
        <img :src="portalImage" alt="" width="1228" height="528" decoding="async">
        <i class="join-scenes__veil" />
        <i class="join-scenes__portal" />
        <i class="join-scenes__grain" />
      </div>

      <header class="join-heading">
        <p>Enter Mysterria</p>
        <h2 id="join-title">The lobby is only the threshold.</h2>
        <span>01 — 03</span>
      </header>

      <div class="join-content">
        <Transition name="join-copy" mode="out-in">
          <article :key="activeStep.id" class="join-copy">
            <span>{{ String(activeIndex + 1).padStart(2, '0') }} / 03</span>
            <p>{{ activeStep.eyebrow }}</p>
            <h3>{{ activeStep.title }}</h3>
            <p>{{ activeStep.copy }}</p>
            <RouterLink v-if="activeStep.link" :to="activeStep.link.to" class="inline-guide">
              {{ activeStep.link.label }} <span aria-hidden="true">→</span>
            </RouterLink>
          </article>
        </Transition>

        <aside class="connection-panel" aria-label="Connect to Mysterria">
          <p class="panel-label">The traveller's plaque · Java Edition</p>
          <button class="copy-address" type="button" @click="copyAddress">
            <span>
              <small>Server address</small>
              <strong>{{ MYSTERRIA_ADDRESS }}</strong>
            </span>
            <b>{{ copyLabel }}</b>
          </button>
          <p class="resource-note">
            <i aria-hidden="true">✓</i>
            Accept the resource pack, then choose <strong>Mysteries</strong> in the lobby.
          </p>
          <p class="edition-note">Bedrock can connect, but some custom interfaces and pathway icons may not render correctly.</p>
          <nav class="join-links" aria-label="Joining help">
            <RouterLink to="/guide">Read the beginner guide <span aria-hidden="true">→</span></RouterLink>
            <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noreferrer">Ask the community <span aria-hidden="true">↗</span></a>
          </nav>
          <p class="copy-feedback" aria-live="polite">{{ copyFeedback }}</p>
        </aside>
      </div>

      <nav class="join-steps" aria-label="Your first moments in Mysterria">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          :class="{ 'is-active': activeIndex === index, 'is-complete': activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          @click="goToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.short }}</strong>
        </button>
      </nav>
    </div>

    <div class="join-static">
      <img :src="townsImage" alt="An illuminated Minecraft city in Mysterria at night." width="1280" height="720" loading="lazy" decoding="async">
      <div class="join-static__content">
        <p>Enter Mysterria</p>
        <h2>The lobby is only the threshold.</h2>
        <ol>
          <li v-for="(step, index) in steps" :key="step.id">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <div><strong>{{ step.title }}</strong><p>{{ step.copy }}</p></div>
          </li>
        </ol>
        <button type="button" class="static-copy" @click="copyAddress">{{ copyLabel }} · {{ MYSTERRIA_ADDRESS }}</button>
        <p class="resource-note"><i aria-hidden="true">✓</i> Java Edition is fully supported. Accept the resource pack when prompted.</p>
        <div class="join-static__actions">
          <RouterLink to="/guide">Beginner guide →</RouterLink>
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
import portalImage from '@/assets/images/home/world/lobby-portal.png';

const steps = [
  {
    id: 'connect', short: 'Connect', eyebrow: 'At the threshold', title: 'Find the right door.',
    copy: 'Join mc.mysterria.net with a current Java client. No client mods are required—just bring your curiosity to the lobby.',
    link: undefined,
  },
  {
    id: 'arrive', short: 'Arrive', eyebrow: 'The portal wakes', title: 'Choose Mysteries.',
    copy: 'Accept the server resource pack, then select Mysteries in the lobby. The NPC dialogue there gives your first bearings.',
    link: { to: '/guide', label: 'See connection help' },
  },
  {
    id: 'begin', short: 'Begin', eyebrow: 'Beyond the portal', title: 'A Pathway is earned.',
    copy: 'Your starter choice only changes your bonus. Take Resolve to learn the recipe, cauldron, ingredients, and potion loop without a permanent cost.',
    link: { to: '/guide?topic=starter-choice', label: 'Understand the starter choice' },
  },
] as const;

const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
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
  '--scene-position': `${50 + progress.value * 4}%`,
  '--scene-scale': String(1.08 - progress.value * 0.08),
  '--portal-alpha': String(0.2 + progress.value * 0.65),
  '--portal-scale': String(0.82 + progress.value * 0.22),
  '--heading-opacity': String(Math.max(0, 1 - progress.value * 1.55)),
}));

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    progress.value = next;
    activeIndex.value = Math.min(steps.length - 1, Math.floor(next * steps.length));
  });
}

function goToStep(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  const next = (index + 0.18) / steps.length;
  progress.value = next;
  if (reducedMotion.value) return;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: sectionTop + (section.value.offsetHeight - innerHeight) * next, behavior: 'smooth' });
}

async function copyAddress() {
  copyState.value = 'idle';
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    else {
      const field = document.createElement('textarea');
      field.value = MYSTERRIA_ADDRESS;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    copyState.value = 'copied';
  } catch { copyState.value = 'failed'; }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 3200);
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) update(); }, { rootMargin: '10% 0px' });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});
onUnmounted(() => {
  observer?.disconnect(); removeEventListener('scroll', update); removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame); if (copyTimer) clearTimeout(copyTimer);
});
</script>

<style scoped>
.join-story { --join-progress: 0; --scene-position: 50%; --scene-scale: 1.06; --portal-alpha: .2; --portal-scale: .82; --heading-opacity: 1; position: relative; min-height: 310svh; color: #fcf9f2; background: #091718; }
.join-sticky { position: sticky; top: 0; height: 100svh; min-height: 620px; overflow: hidden; isolation: isolate; background: #091718; }
.join-scenes, .join-scenes::after, .join-scenes img, .join-scenes i { position: absolute; inset: 0; }
.join-scenes { z-index: -2; overflow: hidden; background: #102724; }
.join-scenes img { width: 100%; height: 100%; object-fit: cover; object-position: var(--scene-position) 48%; filter: brightness(.54) saturate(.62) hue-rotate(16deg); transform: scale(var(--scene-scale)); transition: transform 950ms cubic-bezier(.22, 1, .36, 1), filter 800ms ease; }
.join-scenes::after { content: ''; z-index: 1; background: linear-gradient(90deg, rgba(5, 17, 19, .9) 0%, rgba(6, 20, 22, .54) 43%, rgba(5, 17, 19, .18) 74%), linear-gradient(0deg, rgba(5, 17, 19, .82), transparent 52%); }
.join-scenes__veil { z-index: 2; background: radial-gradient(ellipse at 51% 37%, rgba(125, 197, 181, calc(var(--portal-alpha) * .4)), transparent 21%), linear-gradient(180deg, rgba(255,255,255,.025), transparent 26%); }
.join-scenes i.join-scenes__portal { z-index: 3; inset: 19% auto auto 57%; width: min(21vw, 360px); aspect-ratio: .56; border: 1px solid rgba(184, 233, 217, calc(var(--portal-alpha) * .72)); border-radius: 48% 48% 43% 43% / 18% 18% 10% 10%; opacity: var(--portal-alpha); background: radial-gradient(ellipse at 50% 45%, rgba(165, 237, 214, .7), rgba(56, 176, 159, .2) 36%, transparent 68%); box-shadow: 0 0 34px rgba(125, 235, 207, .42), 0 0 110px rgba(75, 187, 168, .24), inset 0 0 42px rgba(230, 255, 244, .25); transform: translateX(-50%) scale(var(--portal-scale)); transition: opacity 650ms ease, transform 850ms cubic-bezier(.22, 1, .36, 1); animation: portal-breathe 4.8s ease-in-out infinite; }
.join-scenes__grain { z-index: 4; opacity: .16; mix-blend-mode: soft-light; background-image: radial-gradient(rgba(255,255,255,.7) .5px, transparent .5px); background-size: 4px 4px; }
@keyframes portal-breathe { 50% { filter: brightness(1.25); } }
.join-heading { position: absolute; z-index: 2; top: clamp(88px, 12vh, 126px); left: clamp(22px, 6vw, 96px); width: min(540px, 52vw); opacity: var(--heading-opacity); transition: opacity 400ms ease; }
.join-heading p, .join-heading > span, .join-copy > span, .join-copy > p:first-of-type, .join-static__content > p, .panel-label { margin: 0; color: #e6bd75; font: 650 .65rem/1 'IBM Plex Mono', monospace; letter-spacing: .15em; text-transform: uppercase; }
.join-heading h2 { max-width: 540px; margin: 13px 0 17px; font: 650 clamp(3.8rem, 7.4vw, 8.4rem)/.79 'IBM Plex Sans Condensed', sans-serif; letter-spacing: -.06em; text-wrap: balance; }
.join-heading > span { color: rgba(252,249,242,.46); }
.join-content { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.join-copy { position: absolute; left: clamp(22px, 6vw, 96px); top: 53%; width: min(475px, 38vw); transform: translateY(-50%); text-shadow: 0 4px 34px rgba(4,16,18,.8); pointer-events: auto; }
.join-copy > p:first-of-type { margin-top: 15px; }
.join-copy h3 { margin: 12px 0 16px; font: 650 clamp(3rem, 5.8vw, 6.6rem)/.82 'IBM Plex Sans Condensed', sans-serif; letter-spacing: -.055em; text-wrap: balance; }
.join-copy > p:last-of-type { max-width: 410px; margin: 0; color: rgba(252,249,242,.78); font-size: clamp(.82rem, 1.05vw, .96rem); line-height: 1.7; }
.inline-guide { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; margin-top: 19px; color: #f1cf91; font-size: .76rem; font-weight: 750; }
.inline-guide span { font-size: 1.1rem; transition: transform .24s ease; }.inline-guide:hover span { transform: translateX(4px); }
.join-copy-enter-active, .join-copy-leave-active { transition: opacity 240ms ease, transform 360ms cubic-bezier(.22, 1, .36, 1); }.join-copy-enter-from { opacity: 0; transform: translateY(calc(-50% + 16px)); }.join-copy-leave-to { opacity: 0; transform: translateY(calc(-50% - 12px)); }
.connection-panel { position: absolute; right: clamp(22px, 6vw, 96px); bottom: clamp(82px, 11vh, 120px); width: min(430px, 35vw); display: grid; gap: 9px; padding: 15px; border: 1px solid rgba(252,249,242,.17); border-radius: 20px; background: linear-gradient(145deg, rgba(15,40,39,.82), rgba(5,18,20,.78)); box-shadow: 0 28px 82px rgba(0,0,0,.34); backdrop-filter: blur(18px); pointer-events: auto; }
.panel-label { color: rgba(252,249,242,.58); }
.copy-address { min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 13px; border: 0; border-radius: 11px; color: #102924; background: #f5f0e6; cursor: pointer; text-align: left; transition: transform .24s cubic-bezier(.22,1,.36,1), background-color .2s; }.copy-address:hover { transform: translateY(-2px); background: #fffaf0; }.copy-address > span { display: grid; gap: 6px; min-width: 0; }.copy-address small { color: rgba(16,41,36,.55); font: 600 .53rem/1 'IBM Plex Mono', monospace; letter-spacing: .11em; text-transform: uppercase; }.copy-address strong { font: 700 .76rem/1 'IBM Plex Mono', monospace; }.copy-address b { flex: none; color: #795221; font-size: .7rem; }
.resource-note { min-height: 39px; display: flex; align-items: center; gap: 8px; margin: 0; color: rgba(252,249,242,.73); font-size: .68rem; line-height: 1.45; }.resource-note i { width: 22px; aspect-ratio: 1; display: grid; flex: none; place-items: center; border-radius: 50%; color: #102924; background: #a6d2ac; font-size: .63rem; font-style: normal; }.resource-note strong { color: #fcf9f2; }.edition-note { margin: 0; padding-top: 8px; border-top: 1px solid rgba(252,249,242,.11); color: rgba(252,249,242,.54); font-size: .61rem; line-height: 1.45; }
.join-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.join-links a { min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px; border: 1px solid rgba(252,249,242,.14); border-radius: 10px; color: rgba(252,249,242,.8); font-size: .65rem; font-weight: 750; }.copy-feedback { min-height: 1em; margin: 0; color: rgba(252,249,242,.52); font: 500 .53rem/1.4 'IBM Plex Mono', monospace; }
.join-steps { position: absolute; z-index: 3; left: 50%; bottom: 21px; width: min(610px, calc(100% - 44px)); display: grid; grid-template-columns: repeat(3,1fr); transform: translateX(-50%); }.join-steps button { position: relative; min-width: 44px; min-height: 54px; display: grid; place-items: center; gap: 4px; padding: 8px; border: 0; border-top: 2px solid rgba(252,249,242,.28); color: rgba(252,249,242,.66); background: rgba(5,17,19,.56); cursor: pointer; transition: color .2s ease, border-color .2s ease, background-color .2s ease; }.join-steps button:hover { color: #fcf9f2; }.join-steps button.is-active { border-color: #e5bb72; color: #fcf9f2; background: rgba(13,38,38,.58); }.join-steps button.is-complete { color: #a6d2ac; }.join-steps span { font: 650 .57rem/1 'IBM Plex Mono', monospace; }.join-steps strong { font-size: .64rem; }
.join-static { display: none; }
@media (max-width: 760px) { .join-story { min-height: 285svh; }.join-sticky { min-height: 650px; }.join-heading { top: 82px; left: 17px; width: calc(100% - 34px); }.join-heading h2 { max-width: 380px; font-size: clamp(3.5rem, 16vw, 5.7rem); }.join-copy { z-index: 1; top: 305px; bottom: auto; left: 17px; width: calc(100% - 34px); transform: none; }.join-copy h3 { font-size: clamp(2.55rem, 11vw, 3.8rem); }.join-copy-enter-from { transform: translateY(16px); }.join-copy-leave-to { transform: translateY(-12px); }.connection-panel { right: auto; bottom: 77px; left: 17px; width: calc(100% - 34px); padding: 12px; }.edition-note { display: none; }.join-steps { bottom: 8px; width: 100%; }.join-steps strong { display: none; }.join-scenes i.join-scenes__portal { top: 15%; left: 66%; width: 53vw; }.join-scenes::after { background: linear-gradient(0deg, rgba(5,17,19,.88), rgba(5,17,19,.08) 72%), linear-gradient(90deg, rgba(5,17,19,.62), transparent); } }
@media (max-width: 760px) and (max-height: 720px) { .join-heading { opacity: .58; }.join-copy { top: 215px; }.join-copy h3 { font-size: clamp(2.3rem, 10vw, 3.2rem); }.join-copy > p:last-of-type { font-size: .76rem; line-height: 1.5; } }
@media (prefers-reduced-motion: reduce) { .join-scenes__portal { animation: none; } }
@media (max-width: 340px), (max-height: 560px), (prefers-reduced-motion: reduce) { .join-story { min-height: auto; padding: 70px 14px; }.join-sticky { display: none; }.join-static { width: min(1100px,100%); display: grid; grid-template-columns: 1.05fr .95fr; overflow: hidden; margin: 0 auto; border-radius: 28px; background: #102724; }.join-static > img { width: 100%; height: 100%; min-height: 670px; object-fit: cover; }.join-static__content { align-self: center; padding: 44px; }.join-static__content > h2 { margin: 12px 0 27px; font: 650 clamp(3rem,6vw,6rem)/.84 'IBM Plex Sans Condensed',sans-serif; letter-spacing: -.05em; }.join-static ol { display: grid; margin: 0 0 24px; padding: 0; list-style: none; }.join-static li { display: grid; grid-template-columns: 30px 1fr; gap: 10px; padding: 15px 0; border-top: 1px solid rgba(252,249,242,.11); }.join-static li > span { color: #dfb46a; font: 650 .58rem/1.5 'IBM Plex Mono',monospace; }.join-static li strong { font: 650 1.35rem/1 'IBM Plex Sans Condensed',sans-serif; }.join-static li p { margin: 7px 0 0; color: rgba(252,249,242,.65); font-size: .73rem; line-height: 1.55; }.static-copy { width: 100%; min-height: 48px; margin-bottom: 9px; border: 0; border-radius: 11px; color: #102924; background: #f5f0e6; font-size: .68rem; font-weight: 750; }.join-static__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 11px; }.join-static__actions a { min-height: 46px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(252,249,242,.14); border-radius: 11px; color: #fcf9f2; font-size: .68rem; font-weight: 750; } }
@media (max-width: 760px) and (max-height: 560px), (prefers-reduced-motion: reduce) and (max-width: 760px) { .join-static { grid-template-columns: 1fr; }.join-static > img { min-height: 270px; max-height: 46svh; }.join-static__content { padding: 30px 20px; }.join-static__actions { grid-template-columns: 1fr; } }
</style>
