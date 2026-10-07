<template>
  <!-- A Pathway's sigil on its own dark medallion, ringed in its own colour, as on the homepage's orbit. -->
  <span class="pw-seal" :class="{'pw-seal--lg': large}" :style="{'--tok': accent}" aria-hidden="true">
    <img
        :src="large ? sigilNative(id) : sigilThumb(id)"
        alt=""
        :width="large ? 512 : 256"
        :height="large ? 512 : 256"
        decoding="async"
        :loading="eager ? 'eager' : 'lazy'"
        draggable="false"
    >
  </span>
</template>

<script setup lang="ts">
import {sigilNative, sigilThumb} from '@/components/home-arcana/arcana-data';

withDefaults(defineProps<{id: string; accent: string; large?: boolean; eager?: boolean}>(), {large: false, eager: false});
</script>

<style scoped>
/* the medallion stays dark on paper too: the sigils are drawn to glow on night */
.pw-seal {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--pw-seal, 60px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--tok) 20%, #15151b), #0b0b0e 70%);
  box-shadow:
    inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--tok) 38%, transparent),
    0 10px 24px var(--arc-shadow);
  transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .3s ease;
}

.pw-seal img {
  width: 84%;
  height: 84%;
  object-fit: contain;
}

.pw-seal--lg {
  --pw-seal: clamp(120px, 14vw, 184px);
  box-shadow:
    inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--tok) 45%, transparent),
    0 0 60px color-mix(in oklab, var(--tok) 22%, transparent),
    0 18px 40px var(--arc-shadow);
}

@media (prefers-reduced-motion: reduce) {
  .pw-seal {
    transition: none;
  }
}
</style>
