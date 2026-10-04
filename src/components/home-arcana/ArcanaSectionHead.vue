<template>
  <!--
    Every chapter opens the same way: the display title and a lede (beside the
    title in `split` mode, below it otherwise). Nothing above the title.
  -->
  <header class="arc-head" :class="{'is-center': center, 'is-split': split}">
    <div class="arc-head__main">
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
withDefaults(defineProps<{
  title?: string;
  titleId?: string;
  center?: boolean;
  /** Title on the left, lede on the right (stacks below 900px). */
  split?: boolean;
}>(), {title: '', titleId: undefined, center: false, split: false});
</script>

<style scoped>
.arc-head {
  max-width: 820px;
  margin-bottom: var(--arc-head-gap);
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
  color: var(--acc-ink);
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
  /* right-aligned lines read best evenly balanced, with no short last line */
  text-wrap: balance;
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
</style>
