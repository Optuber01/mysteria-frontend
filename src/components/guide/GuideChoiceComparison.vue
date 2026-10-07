<template>
  <!-- The two starter bonuses side by side; the one that keeps full power is marked. -->
  <div class="guide-choices arc-grid">
    <article
        v-for="choice in choices"
        :key="choice.name"
        class="guide-choice arc-panel"
        :class="{'is-recommended': choice.recommended}"
    >
      <header class="guide-choice__head">
        <h3 class="arc-h4">{{ choice.name }}</h3>
        <span v-if="choice.recommended" class="arc-tag arc-tag--acc">{{ ui.recommended }}</span>
      </header>
      <!-- what the choice is for, under its name rather than as a label above it -->
      <p class="guide-choice__line">{{ choice.eyebrow }}</p>
      <dl class="guide-choice__terms">
        <div>
          <dt>{{ ui.benefit }}</dt>
          <dd>{{ choice.benefit }}</dd>
        </div>
        <div>
          <dt>{{ ui.cost }}</dt>
          <dd>{{ choice.cost }}</dd>
        </div>
        <div>
          <dt>{{ ui.bestFor }}</dt>
          <dd>{{ choice.bestFor }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>

<script lang="ts" setup>
import type {GuideChoice, GuideContent} from "@/data/guideContent";

defineProps<{
  choices: GuideChoice[];
  ui: GuideContent["ui"];
}>();
</script>

<style scoped>
.guide-choices {
  /* the two choices always share the row (auto-fit), never leave a third column empty */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}

.guide-choice.is-recommended {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
}

.guide-choice__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.guide-choice__line {
  margin: 6px 0 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.guide-choice__terms {
  margin: 16px 0 0;
}

.guide-choice__terms > div {
  padding: 12px 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.guide-choice__terms > div:last-child {
  padding-bottom: 0;
}

.guide-choice__terms dt {
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.guide-choice__terms dd {
  margin: 4px 0 0;
  line-height: 1.55;
}
</style>
