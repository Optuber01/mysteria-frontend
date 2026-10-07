<template>
  <!-- The guide's front page: how to join, the first steps in order, what differs, the one choice that sticks. -->
  <div class="guide-home">
    <section class="guide-block" aria-labelledby="guide-join-title">
      <h2 id="guide-join-title" class="arc-h3">{{ content.ui.joinTitle }}</h2>
      <GuideJoin :ui="content.ui" :more-label="content.ui.joinLink"/>
    </section>

    <section class="guide-block" aria-labelledby="guide-steps-title">
      <h2 id="guide-steps-title" class="arc-h3">{{ content.ui.stepsTitle }}</h2>
      <p class="arc-lede">{{ content.ui.stepsLede }}</p>
      <ol class="arc-rows guide-steps">
        <li v-for="(step, index) in content.steps" :key="step.title" class="arc-row guide-step">
          <RouterLink :to="$lp(`/guide/${step.topicId}`)" class="guide-step__link">
            <span class="guide-step__n" aria-hidden="true">{{ index + 1 }}</span>
            <span class="guide-step__text">
              <strong>{{ step.title }}</strong>
              <span>{{ step.description }}</span>
            </span>
            <i class="fa-solid fa-arrow-right guide-step__arrow" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ol>
    </section>

    <section class="guide-block" aria-labelledby="guide-different-title">
      <h2 id="guide-different-title" class="arc-h3">{{ content.ui.differentTitle }}</h2>
      <p class="arc-lede">{{ content.ui.differentLede }}</p>
      <dl class="arc-rows guide-facts">
        <div v-for="fact in content.differences" :key="fact.title" class="arc-row guide-fact">
          <dt>{{ fact.title }}</dt>
          <dd>{{ fact.body }}</dd>
        </div>
      </dl>
    </section>

    <section class="guide-block" aria-labelledby="guide-starter-title">
      <h2 id="guide-starter-title" class="arc-h3">{{ content.ui.starterTitle }}</h2>
      <p class="arc-lede">{{ content.ui.starterLede }}</p>
      <GuideChoiceComparison :choices="content.starterChoices" :ui="content.ui"/>
      <p class="guide-note guide-note--warning">
        <strong>{{ content.ui.warning }}</strong>
        {{ content.ui.starterWarning }}
      </p>
    </section>

    <section class="guide-block" aria-labelledby="guide-more-title">
      <h2 id="guide-more-title" class="arc-h3">{{ content.ui.moreTitle }}</h2>
      <ul class="arc-grid guide-more">
        <li v-for="item in more" :key="item.key">
          <a
              v-if="item.external"
              :href="item.href"
              class="arc-panel arc-panel--link guide-more__item"
              target="_blank"
              rel="noopener noreferrer"
          >
            <span class="guide-more__title">
              {{ item.title }}
              <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              <span class="arc-sr">({{ t('header.newTab') }})</span>
            </span>
            <span class="guide-more__body">{{ item.body }}</span>
          </a>
          <RouterLink v-else :to="$lp(item.href)" class="arc-panel arc-panel--link guide-more__item">
            <span class="guide-more__title">
              {{ item.title }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </span>
            <span class="guide-more__body">{{ item.body }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import GuideChoiceComparison from "./GuideChoiceComparison.vue";
import GuideJoin from "./GuideJoin.vue";
import {useI18n} from "@/composables/useI18n";
import {type GuideContent, wikiUrl} from "@/data/guideContent";

const props = defineProps<{content: GuideContent}>();

const {t, currentLanguage} = useI18n();

const DISCORD = "https://discord.com/invite/jc7GSxBWgb";

/* where to go when the guide runs out: the wiki for depth, Help for the account, people on Discord */
const more = computed(() => {
  const ui = props.content.ui;
  return [
    {key: "wiki", title: ui.wikiTitle, body: ui.wikiBody, href: wikiUrl("", currentLanguage.value), external: true},
    {key: "help", title: ui.helpTitle, body: ui.helpBody, href: "/help", external: false},
    {key: "discord", title: ui.discordTitle, body: ui.discordBody, href: DISCORD, external: true},
    {key: "rules", title: ui.rulesTitle, body: ui.rulesBody, href: "/rules", external: false},
  ];
});
</script>

<style scoped>
.guide-home > * + * {
  margin-top: var(--arc-block-gap);
}

.guide-block > .arc-h3 + * {
  margin-top: 14px;
}

.guide-block > .arc-lede + * {
  margin-top: var(--arc-group-gap);
}

.guide-block > .arc-h3 + .guide-join,
.guide-block > .arc-h3 + .guide-more {
  margin-top: var(--arc-group-gap);
}

/* first steps: numbered rows that lead to their topic */
.guide-step {
  padding: 0;
}

.guide-step__link {
  display: grid;
  grid-template-columns: 2.2em minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 14px;
  width: 100%;
  padding: 16px 4px;
  color: inherit;
  text-decoration: none;
}

.guide-step__n {
  color: var(--acc-ink);
  font-size: var(--arc-fs-h4);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.guide-step__text {
  display: grid;
  gap: 4px;
}

.guide-step__text strong {
  font-weight: 600;
}

.guide-step__text span {
  color: var(--arc-muted);
  line-height: 1.55;
}

.guide-step__arrow {
  align-self: center;
  color: var(--arc-muted);
  transition: transform .25s ease, color .2s ease;
}

.guide-step__link:hover strong {
  color: var(--acc-ink);
}

.guide-step__link:hover .guide-step__arrow {
  color: var(--acc-ink);
  transform: translateX(3px);
}

/* what's different: the rule, then what it means */
.guide-fact {
  display: grid;
  grid-template-columns: minmax(0, 15em) minmax(0, 1fr);
  align-items: baseline;
  gap: 8px 28px;
  padding: 16px 0;
}

.guide-fact dt {
  font-weight: 600;
}

.guide-fact dd {
  margin: 0;
  color: var(--arc-muted);
  line-height: 1.6;
}

/* the one-line warning under the starter choice */
.guide-note {
  max-width: var(--arc-measure);
  margin: var(--arc-group-gap) 0 0;
  padding: 4px 0 4px 18px;
  border-left: var(--arc-bw-accent) solid var(--arc-warn);
  color: var(--arc-muted);
  line-height: 1.6;
}

.guide-note strong {
  margin-right: 6px;
  color: var(--arc-ink);
  font-weight: 650;
}

/* more help */
.guide-more {
  --arc-grid-min: 220px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.guide-more__item {
  display: grid;
  gap: 6px;
  align-content: start;
  height: 100%;
}

.guide-more__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--arc-fs-h4);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
}

.guide-more__title i {
  color: var(--acc-ink);
  font-size: .7em;
}

.guide-more__body {
  color: var(--arc-muted);
  line-height: 1.55;
}

@media (max-width: 640px) {
  .guide-fact {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-step__arrow {
    transition: none;
  }

  .guide-step__link:hover .guide-step__arrow {
    transform: none;
  }
}
</style>
