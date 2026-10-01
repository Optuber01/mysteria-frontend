<template>
  <section id="what-is" class="what-is" aria-labelledby="what-is-title">
    <div class="what-is__inner">
      <div class="what-is__intro">
        <p class="what-is__eyebrow">{{ t('home.whatIs.eyebrow') }}</p>
        <h2 id="what-is-title">{{ t('home.whatIs.title') }}</h2>
        <p>{{ t('home.whatIs.summary') }}</p>
      </div>

      <ol class="what-is__grid">
        <li v-for="(pillar, index) in PILLARS" :key="pillar">
          <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3>{{ t(`home.whatIs.pillars.${pillar}.title`) }}</h3>
          <p>{{ t(`home.whatIs.pillars.${pillar}.body`) }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

/* Keys under home.whatIs.pillars, in display order. */
const PILLARS = ['pathway', 'sequences', 'world'] as const;

const { t } = useI18n();
</script>

<style scoped>
.what-is {
  position: relative;
  padding: clamp(78px, 10vw, 144px) var(--home-content-gutter, clamp(20px, 4vw, 56px));
  color: var(--ink);
  background: color-mix(in srgb, var(--journey-mid) 94%, var(--surface, #fff) 6%);
  border-top: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
}

.what-is__inner {
  width: min(100%, var(--home-content-max, 1480px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: clamp(46px, 7vw, 104px);
  align-items: start;
}

.what-is__intro { max-width: 650px; }
.what-is__eyebrow {
  margin: 0 0 18px;
  color: color-mix(in srgb, var(--ink) 74%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .15em;
  text-transform: uppercase;
}
.what-is h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 4.8vw, 5.25rem);
  line-height: .95;
  letter-spacing: -.025em;
  font-weight: 700;
  text-wrap: balance;
}
.what-is__intro > p:last-child {
  max-width: 590px;
  margin: 26px 0 0;
  color: color-mix(in srgb, var(--ink) 78%, transparent);
  font-size: clamp(1rem, 1.25vw, 1.16rem);
  line-height: 1.72;
}

.what-is__grid {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.what-is__grid li {
  display: grid;
  grid-template-columns: 56px minmax(0, .75fr) minmax(220px, 1.25fr);
  gap: 22px;
  align-items: start;
  padding: 26px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.what-is__grid li span {
  padding-top: 3px;
  color: color-mix(in srgb, var(--ink) 70%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .72rem;
  font-weight: 750;
}
.what-is__grid li h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1;
}
.what-is__grid li p {
  margin: 0;
  color: color-mix(in srgb, var(--ink) 76%, transparent);
  font-size: .94rem;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .what-is__inner { grid-template-columns: 1fr; gap: 48px; }
  .what-is__intro { max-width: 760px; }
}

@media (max-width: 620px) {
  .what-is { padding-top: 64px; padding-bottom: 64px; }
  .what-is__grid li { grid-template-columns: 38px 1fr; gap: 10px 14px; }
  .what-is__grid li p { grid-column: 2; }
}
</style>
