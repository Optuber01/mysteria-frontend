<template>
  <!--
    Wheel of Fortune: the sky turns iridescent. Curtains of pearly aurora, mint into violet
    (the Monster's potion is "imbued with iridescent aurora"), unfurl across the upper sky
    and sway; a shooting star crosses once, for luck. Light only, in the open sky above the
    deck and to its right, where it can be seen.
  -->
  <div class="fo" aria-hidden="true">
    <template v-if="layer === 'back'">
      <div class="fo__aurora">
        <div class="fo__curtain fo__curtain--a"><i class="fo__rays"></i></div>
        <div class="fo__curtain fo__curtain--b"><i class="fo__rays"></i></div>
        <div class="fo__curtain fo__curtain--c"><i class="fo__rays"></i></div>
      </div>
      <i class="fo__glow"></i>
      <div class="fo__star"><i></i></div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({name: 'SignatureFortune'});
defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.fo {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* the band of sky the curtains hang in: above the deck, widest toward the right */
.fo__aurora {
  position: absolute;
  left: 22%;
  right: -6%;
  top: calc(var(--site-header-stack, 96px) - 30px);
  height: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 22%, #000 85%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 22%, #000 85%, transparent);
}

/* one curtain: vertical rays of light, brightest along their lower hem, fading upward */
.fo__curtain {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  will-change: transform, opacity;
  animation: fo-unfurl 1.6s cubic-bezier(.2, .7, .2, 1) both, fo-sway 18s ease-in-out 2s infinite alternate;
}

.fo__rays {
  position: absolute;
  inset: 0;
  /* three ray sets at unrelated spacings, so the folds never repeat; a bright hem below */
  background:
    repeating-linear-gradient(90deg, transparent 0 11px, var(--ray) 14px 15px, transparent 19px 31px),
    repeating-linear-gradient(90deg, transparent 0 23px, var(--ray) 27px 30px, transparent 34px 53px),
    repeating-linear-gradient(90deg, transparent 0 5px, var(--ray) 6px, transparent 7px 17px),
    linear-gradient(0deg, var(--hem) 0%, transparent 55%);
  filter: blur(1.5px);
  -webkit-mask-image: linear-gradient(0deg, transparent 0%, #000 12%, rgba(0, 0, 0, .55) 45%, transparent 92%);
  mask-image: linear-gradient(0deg, transparent 0%, #000 12%, rgba(0, 0, 0, .55) 45%, transparent 92%);
}

/* three curtains at different heights and slants, mint below, violet above */
.fo__curtain--a {
  --ray: rgba(130, 240, 200, .22);
  --hem: rgba(110, 231, 192, .32);
  inset: 18% 4% 6% 0;
  rotate: -4deg;
}

.fo__curtain--b {
  --ray: rgba(150, 170, 255, .18);
  --hem: rgba(167, 139, 250, .26);
  inset: 0 0 34% 18%;
  rotate: 3deg;
  animation-delay: .25s, 2.6s;
  animation-duration: 1.8s, 23s;
}

.fo__curtain--c {
  --ray: rgba(200, 255, 230, .14);
  --hem: rgba(200, 255, 230, .18);
  inset: 30% 30% 14% 30%;
  rotate: -9deg;
  animation-delay: .5s, 3s;
  animation-duration: 1.6s, 15s;
}

/* the light the aurora throws on the sky round it */
.fo__glow {
  position: absolute;
  left: 20%;
  right: -10%;
  top: 0;
  height: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .2);
  background:
    radial-gradient(55% 60% at 60% 70%, rgba(110, 231, 192, .16), transparent 72%),
    radial-gradient(40% 50% at 82% 40%, rgba(167, 139, 250, .14), transparent 72%);
  animation: fo-glow 2s ease .3s both;
}

@keyframes fo-unfurl {
  from { opacity: 0; transform: scaleY(.15) translate3d(0, 20%, 0); }
}

@keyframes fo-sway {
  from { transform: translate3d(-2%, 0, 0) skewX(-3deg); }
  to { transform: translate3d(2%, 0, 0) skewX(3deg); }
}

@keyframes fo-glow {
  from { opacity: 0; }
}

/* a shooting star, once: good luck crossing the top right */
.fo__star {
  position: absolute;
  right: 8%;
  top: calc(var(--site-header-stack, 96px) + 10px);
  width: 0;
  height: 0;
  rotate: 152deg;
}

.fo__star i {
  position: absolute;
  left: 0;
  top: -1px;
  width: 160px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(240, 255, 250, 0), rgba(220, 255, 245, .9));
  opacity: 0;
  animation: fo-star 1.1s cubic-bezier(.3, 0, .6, 1) 1.6s both;
}

@keyframes fo-star {
  0% { opacity: 0; transform: translate3d(-40px, 0, 0); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(320px, 0, 0); }
}

@media (max-width: 900px) {
  .fo__aurora {
    left: 0;
    right: 0;
    height: calc(var(--site-header-stack, 96px) + 160px);
  }
}

/* paper: the curtains as a pale mint and lilac sheen on the haze */
:root[data-theme="parchment"] .fo__aurora {
  opacity: .55;
}

:root[data-theme="parchment"] .fo__glow {
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .fo__curtain,
  .fo__glow {
    animation: none;
  }

  .fo__star {
    display: none;
  }
}
</style>
