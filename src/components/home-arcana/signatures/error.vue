<template>
  <!--
    Error: pickpocketed. The scene itself steals whatever hangs in the sky (HeroNightScene
    `is-stolen`, 0.65 s after the draw, for 1.1 s): a glint like light off a monocle passes
    over it as this arrives, its light lingers a moment where it was, and when it comes back
    a little out of place, time skips: the fog jumps back a few beats, as if wound back to
    cover the theft. Drawn on page load nothing is stolen, so only the glint passes.
  -->
  <div ref="rootRef" class="error" :class="[`is-from-${body}`, {'is-late': late, 'is-theft': theft, 'is-back': back}]" aria-hidden="true">
    <template v-if="layer === 'front'">
      <!-- the glint: a lens flare that crosses the body like a hand -->
      <div class="er-pass">
        <i class="er-streak"></i>
        <i class="er-flare"></i>
        <i class="er-ghost"></i>
      </div>
      <!-- where the body was: its light, staying a moment after it has gone -->
      <div ref="followRef" class="er-body">
        <i class="er-after"></i>
      </div>
      <!-- the skip: one cold breath of light as time is wound back -->
      <i class="er-skip"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {reducedMotion, useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureError'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* what was up when the hand passed: the sun (high or low), the moon, or nothing to see */
const body = computed(() => (props.from === 'sun' || props.from === 'dusk' || props.from === 'hidden' ? props.from : 'moon'));

const rootRef = ref<HTMLElement | null>(null);
const followRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, ref(null));

/*
 * Keyed to the scene's own theft, not to this component's mount (it is loaded on demand,
 * so it can arrive a moment before or after the theft starts): one short-lived observer on
 * the scene's class, gone as soon as the body is back (or after a few seconds, on a page
 * load where nothing is stolen). When the body vanishes its light lingers (is-theft); when
 * it comes back, time skips (is-back): the scene's fog jumps back in three short jerks.
 */
const late = ref(false);
const theft = ref(false);
const back = ref(false);
const timers: number[] = [];
let watch: MutationObserver | null = null;

function rewind(night: HTMLElement) {
  const drifts = night.querySelectorAll<HTMLElement>('.night__fog-drift, .night__clouds-drift');
  const anims = Array.from(drifts).flatMap(el => el.getAnimations());
  // about 2.5 s of drift each time, a tenth of a second apart
  [0, 110, 230].forEach(at =>
    timers.push(window.setTimeout(() => {
      for (const a of anims) {
        if (a.playState === 'running' && typeof a.currentTime === 'number') a.currentTime = Math.max(0, a.currentTime - 2500);
      }
    }, at)),
  );
}

function stop() {
  watch?.disconnect();
  watch = null;
}

onMounted(() => {
  if (props.layer !== 'front' || reducedMotion()) return;
  const night = rootRef.value?.closest<HTMLElement>('.night');
  if (!night) return;
  // arrived after the hand had already passed: the glint plays as the body is put back instead
  late.value = night.classList.contains('is-stolen');
  const check = () => {
    const stolen = night.classList.contains('is-stolen');
    if (stolen && !theft.value) theft.value = true;
    if (!stolen && theft.value && !back.value) {
      back.value = true;
      rewind(night);
      stop();
    }
  };
  check();
  watch = new MutationObserver(check);
  watch.observe(night, {attributes: true, attributeFilter: ['class']});
  timers.push(window.setTimeout(stop, 3000));
});
onUnmounted(() => {
  stop();
  timers.forEach(t => window.clearTimeout(t));
});
</script>

<style scoped>
.error {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* the body's centre and size: the moon's box, or the sun's (high, or low on the horizon) */
  --b-r: var(--moon-r, 200px);
  --b-dy: 0px;
}

.error.is-from-sun,
.error.is-from-dusk {
  --b-r: calc(var(--moon-r, 200px) * .8);
}

.error.is-from-dusk {
  --b-dy: calc(var(--moon-r, 200px) * .736);
}

/* ---- the glint: a bright point, its long thin streak and one faint lens ghost, crossing the body ---- */
.er-pass {
  position: absolute;
  left: var(--moon-x, 72%);
  top: calc(var(--moon-y, 48%) + var(--b-dy) - var(--b-r) * .55);
  width: 0;
  height: 0;
  opacity: 0;
  will-change: transform, opacity;
  animation: er-pass .95s cubic-bezier(.45, 0, .35, 1) .05s;
}

.is-late .er-pass {
  animation: none;
}

.is-late.is-back .er-pass {
  animation: er-pass .95s cubic-bezier(.45, 0, .35, 1);
}

@keyframes er-pass {
  0% { opacity: 0; transform: translate3d(calc(var(--b-r) * -1.3), calc(var(--b-r) * .25), 0); }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(calc(var(--b-r) * 1.3), calc(var(--b-r) * .3), 0); }
}

.er-flare {
  position: absolute;
  left: calc(var(--moon-r, 200px) * -.09);
  top: calc(var(--moon-r, 200px) * -.09);
  width: calc(var(--moon-r, 200px) * .18);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, #fff 0 12%, rgba(214, 246, 255, .7) 26%, rgba(111, 217, 242, .18) 60%, transparent);
}

/* the anamorphic streak a lens throws across a bright point */
.er-streak {
  position: absolute;
  left: calc(var(--moon-r, 200px) * -.7);
  width: calc(var(--moon-r, 200px) * 1.4);
  top: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(170, 236, 252, .4) 30%, rgba(240, 252, 255, .9) 50%, rgba(170, 236, 252, .4) 70%, transparent);
}

/* a faint ghost of the lens, off along the line through the frame, as a camera sees it */
.er-ghost {
  position: absolute;
  left: calc(var(--moon-r, 200px) * -.5);
  top: calc(var(--moon-r, 200px) * .24);
  width: calc(var(--moon-r, 200px) * .2);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, transparent 55%, rgba(150, 230, 250, .22) 80%, transparent);
}

/* ---- the afterimage: the body's light, left behind for a moment (only when it was stolen) ---- */
.er-body {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  will-change: transform;
}

.er-after {
  position: absolute;
  left: calc(50% - var(--b-r) * 1.25);
  top: calc(50% + var(--b-dy) - var(--b-r) * 1.25);
  width: calc(var(--b-r) * 2.5);
  aspect-ratio: 1;
  border-radius: 50%;
  /* the moon's crimson, gone cold at the rim like an image burnt on the eye */
  background: radial-gradient(closest-side, rgba(200, 60, 70, .26) 0, rgba(190, 70, 80, .2) 70%, rgba(130, 225, 245, .2) 78%, rgba(111, 217, 242, .06) 86%, transparent);
  mix-blend-mode: screen;
  opacity: 0;
}

.is-from-sun .er-after,
.is-from-dusk .er-after {
  background: radial-gradient(closest-side, rgba(255, 220, 150, .3) 0, rgba(255, 200, 120, .22) 70%, rgba(150, 230, 250, .2) 78%, rgba(111, 217, 242, .06) 86%, transparent);
}

/* behind cloud there was nothing to see: only the faintest trace */
.is-from-hidden .er-after {
  background: radial-gradient(closest-side, rgba(130, 225, 245, .1) 70%, transparent);
}

.is-theft .er-after {
  animation: er-after 2.4s ease-out;
}

@keyframes er-after {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- the skip: two short cold beats as time is wound back ---- */
.er-skip {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: radial-gradient(70% 70% at var(--moon-x, 72%) var(--moon-y, 48%), rgba(150, 225, 245, .16), rgba(111, 217, 242, .05) 60%, transparent);
  mix-blend-mode: screen;
  opacity: 0;
}

.is-back .er-skip {
  animation: er-skip .7s steps(1, end);
}

@keyframes er-skip {
  0% { opacity: 1; }
  18% { opacity: 0; }
  34% { opacity: .6; }
  48% { opacity: 0; }
  100% { opacity: 0; }
}

/* light theme: the glint and the skip in a darker cyan, multiplied into the paper */
:root[data-theme="parchment"] .er-pass {
  filter: drop-shadow(0 0 1px rgba(20, 90, 110, .6));
}

:root[data-theme="parchment"] .er-after,
:root[data-theme="parchment"] .er-skip {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .er-skip {
  background: radial-gradient(70% 70% at var(--moon-x, 72%) var(--moon-y, 48%), rgba(90, 170, 195, .14), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .er-pass,
  .er-after,
  .er-skip {
    animation: none !important;
  }
}
</style>
