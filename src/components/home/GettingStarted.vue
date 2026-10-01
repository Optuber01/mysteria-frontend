<template>
  <section class="getting-started" aria-labelledby="getting-started-title">
    <div class="getting-started__inner">
      <div class="getting-started__heading">
        <p>{{ t('home.gettingStarted.eyebrow') }}</p>
        <h2 id="getting-started-title">{{ t('home.gettingStarted.title') }}</h2>
      </div>

      <ol class="getting-started__steps">
        <li v-for="(step, index) in STEPS" :key="step">
          <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h3>{{ t(`home.gettingStarted.steps.${step}.title`) }}</h3>
            <p>{{ t(`home.gettingStarted.steps.${step}.body`) }}</p>
          </div>
        </li>
      </ol>

      <div class="getting-started__actions">
        <RouterLink :to="$lp('/guide')">{{ t('home.gettingStarted.guideCta') }} <span aria-hidden="true">→</span></RouterLink>
        <RouterLink :to="$lp('/pathways')">{{ t('home.gettingStarted.pathwaysCta') }} <span aria-hidden="true">→</span></RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

/* Keys under home.gettingStarted.steps, in display order. */
const STEPS = ['join', 'direction', 'advance'] as const;

const { t } = useI18n();
</script>

<style scoped>
.getting-started {
  padding: clamp(76px, 9vw, 126px) var(--home-content-gutter, clamp(20px, 4vw, 56px));
  color: var(--ink);
  background: color-mix(in srgb, var(--journey-end) 90%, var(--surface, #fff) 10%);
  border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.getting-started__inner {
  width: min(100%, var(--home-content-max, 1480px));
  margin: 0 auto;
}
.getting-started__heading {
  display: grid;
  grid-template-columns: minmax(180px, .36fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
  margin-bottom: clamp(42px, 6vw, 74px);
}
.getting-started__heading p {
  margin: 7px 0 0;
  color: color-mix(in srgb, var(--ink) 74%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .15em;
  text-transform: uppercase;
}
.getting-started h2 {
  max-width: 900px;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 5vw, 5.5rem);
  line-height: .92;
  letter-spacing: -.025em;
}
.getting-started__steps {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.getting-started__steps li {
  min-height: 190px;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 18px;
  padding: 30px clamp(18px, 2.5vw, 34px) 30px 0;
}
.getting-started__steps li + li {
  padding-left: clamp(18px, 2.5vw, 34px);
  border-left: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.getting-started__steps span {
  color: color-mix(in srgb, var(--ink) 70%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .72rem;
  font-weight: 750;
}
.getting-started__steps h3 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2vw, 2.15rem);
  line-height: 1;
}
.getting-started__steps p {
  max-width: 330px;
  margin: 0;
  color: color-mix(in srgb, var(--ink) 76%, transparent);
  font-size: .93rem;
  line-height: 1.65;
}
.getting-started__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  margin-top: 28px;
}
.getting-started__actions a {
  color: var(--ink);
  font-size: .84rem;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 36%, transparent);
  padding-bottom: 3px;
}
.getting-started__actions a:hover { color: var(--primary-deep); border-color: currentColor; }
.getting-started__actions a:active { color: var(--ink); }
.getting-started__actions a:focus-visible { outline: 3px solid var(--primary); outline-offset: 4px; }

@media (max-width: 800px) {
  .getting-started__heading { grid-template-columns: 1fr; gap: 14px; }
  .getting-started__steps { grid-template-columns: 1fr; }
  .getting-started__steps li { min-height: 0; padding: 24px 0; }
  .getting-started__steps li + li { padding-left: 0; border-left: 0; border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
}
</style>
