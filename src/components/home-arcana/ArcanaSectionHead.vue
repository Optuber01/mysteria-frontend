<template>
  <!--
    Every chapter opens the same way: a small tarot card carrying the drawn
    Pathway's sigil, the chapter's caps label, the display title, and a lede
    (beside the title in `split` mode, below it otherwise).
  -->
  <header class="arc-head" :class="{'is-center': center, 'is-split': split}">
    <div class="arc-head__main">
      <p class="arc-head__position">
        <span class="arc-head__card" aria-hidden="true">
          <Transition name="arc-head-sigil" mode="out-in">
            <img :key="card.id" :src="sigilThumb(card.id)" alt="" width="64" height="64" decoding="async" loading="lazy">
          </Transition>
          <span v-if="numeral" class="arc-head__numeral">{{ numeral }}</span>
        </span>
        <span>{{ position }}</span>
      </p>
      <h2 :id="titleId" class="arc-head__title">
        <slot name="title">{{ title }}</slot>
      </h2>
    </div>
    <div v-if="$slots.default || $slots.aside" class="arc-head__aside">
      <p v-if="$slots.default" class="arc-head__lede">
        <slot/>
      </p>
      <slot name="aside"/>
    </div>
  </header>
</template>

<script setup lang="ts">
import {sigilThumb} from './arcana-data';
import {useArcana} from './useArcana';

withDefaults(defineProps<{
  numeral?: string;
  position: string;
  title?: string;
  titleId?: string;
  center?: boolean;
  /** Title on the left, lede on the right (stacks below 900px). */
  split?: boolean;
}>(), {numeral: '', title: '', titleId: undefined, center: false, split: false});

const {card} = useArcana();
</script>

<style scoped>
.arc-head {
  max-width: 820px;
  margin-bottom: var(--arc-head-gap, clamp(32px, 4vw, 56px));
}

.arc-head.is-center {
  margin-inline: auto;
  text-align: center;
}

.arc-head.is-split {
  max-width: none;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: end;
  gap: 20px clamp(32px, 5vw, 72px);
}

.arc-head__position {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 20px;
  font-family: var(--arc-caps);
  font-size: 11.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--acc);
  transition: color .6s ease;
}

/* a face-up card: the drawn sigil, the chapter numeral in its corner */
.arc-head__card {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 44px;
  border: 1.5px solid var(--acc);
  border-radius: 4px;
  background: color-mix(in oklab, var(--acc) 12%, #0e0e12);
  transform: rotate(-8deg);
  transition: border-color .6s ease, background-color .6s ease;
}

.arc-head__card img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.arc-head__numeral {
  position: absolute;
  top: 2px;
  left: 3px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 7.5px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.arc-head-sigil-enter-active,
.arc-head-sigil-leave-active {
  transition: opacity .3s ease, transform .4s cubic-bezier(.2, .8, .2, 1);
}

.arc-head-sigil-enter-from,
.arc-head-sigil-leave-to {
  opacity: 0;
  transform: rotateY(90deg);
}

.arc-head__title {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-display, clamp(36px, 4.8vw, 68px));
  line-height: 1;
  letter-spacing: -.025em;
  color: var(--arc-ink);
  text-wrap: balance;
}

.arc-head__title :deep(em) {
  font-style: normal;
  color: var(--acc);
  transition: color .6s ease;
}

.arc-head__lede {
  max-width: 40em;
  margin: 22px 0 0;
  font-size: var(--arc-fs-lede, clamp(16px, 1.15vw, 18px));
  line-height: 1.65;
  color: var(--arc-muted);
  text-wrap: pretty;
}

.arc-head.is-center .arc-head__lede {
  margin-inline: auto;
}

.is-split .arc-head__aside {
  display: grid;
  justify-items: end;
  gap: 18px;
}

.is-split .arc-head__lede {
  max-width: 34em;
  margin: 0;
  text-align: right;
}

@media (max-width: 900px) {
  .arc-head.is-split {
    grid-template-columns: 1fr;
  }

  .is-split .arc-head__aside {
    justify-items: start;
  }

  .is-split .arc-head__lede {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-head-sigil-enter-active,
  .arc-head-sigil-leave-active {
    transition: opacity .2s ease;
  }

  .arc-head-sigil-enter-from,
  .arc-head-sigil-leave-to {
    transform: none;
  }
}
</style>
