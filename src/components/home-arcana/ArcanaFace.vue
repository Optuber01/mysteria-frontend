<template>
  <!-- The face of a card. Sized by its container; all type scales with cqw. -->
  <div class="arc-face" :class="{'is-boon': card.boon}" :style="{'--card-acc': card.accent}">
    <span class="arc-face__frame" aria-hidden="true">
      <i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
    </span>
    <span class="arc-face__numeral">{{ card.boon ? boonLabel : card.numeral }}</span>
    <span class="arc-face__halo" aria-hidden="true"></span>
    <img
        class="arc-face__sigil"
        :src="large ? sigilNative(card.id) : sigilThumb(card.id)"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        draggable="false"
        width="512"
        height="512"
    >
    <span class="arc-face__name">{{ name }}</span>
    <span v-if="role" class="arc-face__role">{{ role }}</span>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {cardById, sigilNative, sigilThumb} from './arcana-data';

const props = withDefaults(defineProps<{
  id: string;
  name: string;
  role?: string;
  boonLabel?: string;
  alt?: string;
  large?: boolean;
  eager?: boolean;
}>(), {role: '', boonLabel: 'Boon', alt: '', large: false, eager: false});

const card = computed(() => cardById(props.id));
</script>

<style scoped>
.arc-face {
  --card-acc: #a78bfa;
  position: absolute;
  inset: 0;
  container-type: inline-size;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  justify-items: center;
  padding: 9cqw 8cqw 10cqw;
  border-radius: 5cqw;
  overflow: hidden;
  color: #f1f0f5;
  background:
    radial-gradient(120% 70% at 50% 42%, color-mix(in oklab, var(--card-acc) 30%, transparent) 0%, transparent 62%),
    linear-gradient(170deg, #1b1b22 0%, #0e0e12 70%);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--card-acc) 45%, transparent);
}

.arc-face__frame {
  position: absolute;
  inset: 4.5cqw;
  border: max(1px, .5cqw) solid color-mix(in oklab, var(--card-acc) 38%, transparent);
  border-radius: 2.5cqw;
  pointer-events: none;
}

.arc-face__frame .c {
  position: absolute;
  width: 4cqw;
  height: 4cqw;
  background: var(--card-acc);
  transform: rotate(45deg);
}

.c.tl { top: -2cqw; left: -2cqw; }
.c.tr { top: -2cqw; right: -2cqw; }
.c.bl { bottom: -2cqw; left: -2cqw; }
.c.br { bottom: -2cqw; right: -2cqw; }

.arc-face__numeral {
  position: relative;
  font-family: var(--arc-caps);
  font-weight: 500;
  font-size: 7.5cqw;
  line-height: 1;
  letter-spacing: .08em;
  /* lifted toward white: the deepest accents (Abyss, Hermit) sit under 4.5:1 on the dark face */
  color: color-mix(in oklab, var(--card-acc) 72%, #fff);
}

.is-boon .arc-face__numeral {
  font-family: var(--arc-caps);
  font-size: 4.6cqw;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  padding-top: 2cqw;
}

.arc-face__halo {
  position: absolute;
  left: 50%;
  top: 44%;
  width: 92cqw;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  border: max(1px, .4cqw) dashed color-mix(in oklab, var(--card-acc) 30%, transparent);
}

.arc-face__sigil {
  position: relative;
  align-self: center;
  width: 86cqw;
  height: auto;
  aspect-ratio: 1;
  object-fit: contain;
  filter: drop-shadow(0 0 5cqw color-mix(in oklab, var(--card-acc) 55%, transparent));
  user-select: none;
}

.arc-face__name {
  position: relative;
  max-width: 100%;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 8.4cqw;
  line-height: 1.1;
  letter-spacing: .04em;
  text-align: center;
  text-transform: uppercase;
  text-wrap: balance;
}

.arc-face__role {
  position: relative;
  margin-top: 2.6cqw;
  font-family: var(--arc-caps);
  font-size: 4.6cqw;
  line-height: 1.3;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--card-acc) 70%, #fff);
  text-align: center;
}
</style>
