<template>
  <!-- The handbook's front page: the address, the first hour, the starter choice, then help by goal or by search. -->
  <div class="guide-home">
    <div class="guide-start">
      <GuideJoin :ui="content.ui"/>

      <dl class="guide-facts">
        <div v-for="fact in content.facts" :key="fact.label" class="guide-fact">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </div>

    <!-- first hour: a checklist the reader ticks off, kept on this device -->
    <section id="first-hour" class="guide-block" aria-labelledby="guide-first-hour-title">
      <h2 id="guide-first-hour-title" class="arc-h3">{{ t('guidePage.checklistTitle') }}</h2>
      <p class="arc-lede">{{ t('guidePage.checklistLede') }}</p>

      <div class="guide-progress">
        <span class="guide-progress__label">{{ t('guidePage.checklistProgress') }}</span>
        <span class="guide-progress__count">{{ doneCount }} / {{ steps.length }}</span>
        <span class="guide-progress__track" aria-hidden="true">
          <span class="guide-progress__fill" :style="{transform: `scaleX(${progress})`}"></span>
        </span>
      </div>

      <ol class="arc-rows guide-steps">
        <li v-for="(step, index) in steps" :key="step.title" class="arc-row guide-step" :class="{'is-done': isDone(index)}">
          <button type="button" class="guide-step__toggle" :aria-pressed="isDone(index)" @click="toggleStep(index)">
            <span class="guide-step__check" aria-hidden="true">
              <i v-if="isDone(index)" class="fa-solid fa-check"></i>
            </span>
            <span class="guide-step__n" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="guide-step__text">
              <strong>{{ step.title }}</strong>
              <span>{{ step.description }}</span>
            </span>
          </button>
          <RouterLink v-if="step.topicId" :to="$lp(`/guide/${step.topicId}`)" class="arc-btn arc-btn--ghost arc-btn--sm guide-step__more">
            {{ content.ui.openStep }}
            <span class="arc-sr">: {{ topicTitle(step.topicId) }}</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ol>
    </section>

    <section class="guide-block" aria-labelledby="guide-starter-title">
      <h2 id="guide-starter-title" class="arc-h3">{{ content.ui.starterTitle }}</h2>
      <p class="arc-lede">{{ content.ui.starterLede }}</p>
      <GuideChoiceComparison :choices="content.starterChoices" :ui="content.ui"/>
      <p class="guide-note guide-note--warning">
        <strong>{{ content.ui.important }}</strong>
        {{ content.ui.starterWarning }}
      </p>
    </section>

    <!-- quick help: goals first; typing searches every topic, tags included -->
    <section id="answers" class="guide-block" aria-labelledby="guide-answers-title">
      <h2 id="guide-answers-title" class="arc-h3">{{ content.ui.tasksTitle }}</h2>

      <div class="guide-search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
            id="guide-search"
            v-model.trim="query"
            class="arc-field guide-search__field"
            type="search"
            :aria-label="content.ui.findAnswer"
            :placeholder="content.ui.searchPlaceholder"
        >
        <span class="guide-search__count" aria-live="polite">{{ visibleCards.length }} {{ t('guidePage.topicsCount') }}</span>
      </div>

      <p v-if="query && !visibleCards.length" class="guide-empty">{{ t('guidePage.noTopics') }}</p>

      <ul class="arc-grid guide-cards">
        <li v-for="card in visibleCards" :key="card.topicId">
          <RouterLink :to="$lp(`/guide/${card.topicId}`)" class="arc-panel arc-panel--link guide-card">
            <i :class="card.icon" class="guide-card__icon" aria-hidden="true"></i>
            <span class="guide-card__text">
              <strong>{{ card.title }}</strong>
              <span>{{ card.description }}</span>
            </span>
            <i class="fa-solid fa-arrow-right guide-card__arrow" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="guide-block" aria-labelledby="guide-popular-title">
      <h2 id="guide-popular-title" class="arc-h3">{{ content.ui.popularTitle }}</h2>
      <ul class="arc-rows guide-questions">
        <li v-for="item in content.popularQuestions" :key="item.question" class="arc-row">
          <RouterLink :to="$lp(`/guide/${item.topicId}`)" class="guide-questions__link">
            <span>{{ item.question }}</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ul>
    </section>

    <div class="guide-links">
      <div class="guide-links__row">
        <RouterLink :to="$lp('/profile')" class="arc-btn arc-btn--solid">{{ content.ui.profileCta }}</RouterLink>
        <RouterLink :to="$lp('/pathways')" class="arc-btn arc-btn--ghost">{{ content.ui.pathwaysCta }}</RouterLink>
        <RouterLink :to="$lp('/rules')" class="arc-btn arc-btn--ghost">{{ content.ui.fullRulesCta }}</RouterLink>
        <a class="arc-btn arc-btn--ghost" :href="DISCORD" target="_blank" rel="noopener noreferrer">
          <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
          {{ content.ui.supportCta }}
          <span class="arc-sr">({{ t('header.newTab') }})</span>
        </a>
      </div>
      <GuideCoiLinks/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import GuideChoiceComparison from "./GuideChoiceComparison.vue";
import GuideCoiLinks from "./GuideCoiLinks.vue";
import GuideJoin from "./GuideJoin.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";
import {useI18n} from "@/composables/useI18n";
import type {GuideContent} from "@/data/guideContent";

const props = defineProps<{content: GuideContent}>();

const {t} = useI18n();

const DISCORD = "https://discord.com/invite/jc7GSxBWgb";

const topicTitle = (id: string) => props.content.topics.find(topic => topic.id === id)?.shortTitle ?? "";

/* ---------------- First-hour checklist ---------------- */

/* the same key as before, so a returning reader keeps their ticks */
const STORAGE_KEY = "myst-guide-steps-v1";

const steps = computed(() => props.content.firstHour);

const loadDone = (): number[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((value): value is number => typeof value === "number") : [];
  } catch {
    return [];
  }
};

const done = ref<number[]>(loadDone());

const isDone = (index: number) => done.value.includes(index);
const doneCount = computed(() => done.value.filter(index => index < steps.value.length).length);
const progress = computed(() => (steps.value.length ? doneCount.value / steps.value.length : 0));

const toggleStep = (index: number) => {
  done.value = isDone(index) ? done.value.filter(value => value !== index) : [...done.value, index];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done.value));
  } catch {
    // Private-mode storage: the toggle still works for this session.
  }
};

/* ---------------- Quick help search ---------------- */

const query = ref("");

interface TopicCard {
  topicId: string;
  icon: string;
  title: string;
  description: string;
}

const taskCards = computed<TopicCard[]>(() => props.content.tasks.map(task => ({
  topicId: task.topicId,
  icon: task.icon,
  title: task.title,
  description: task.description,
})));

const normalize = (value: string) =>
    value.toLocaleLowerCase().replace(/[’ʼ`]/g, "'").replace(/\s+/g, " ").trim();

const searchCards = computed<TopicCard[]>(() => {
  const needle = normalize(query.value);
  if (!needle) return [];
  return props.content.topics
      .filter(topic => normalize([topic.title, topic.shortTitle, topic.summary, topic.answer, ...topic.tags].join(" ")).includes(needle))
      .map(topic => ({topicId: topic.id, icon: topic.icon, title: topic.shortTitle, description: topic.summary}));
});

const visibleCards = computed(() => (query.value ? searchCards.value : taskCards.value));
</script>

<style scoped>
.guide-home > * + * {
  margin-top: var(--arc-block-gap);
}

.guide-block {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 24px);
}

.guide-block > .arc-h3 + * {
  margin-top: 14px;
}

.guide-block > .arc-lede + *,
.guide-block > .arc-h3 + .guide-search,
.guide-block > .arc-h3 + .guide-questions {
  margin-top: var(--arc-group-gap);
}

/* ---------- the address and the three facts beside it ---------- */
.guide-start {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--arc-grid-gap);
  align-items: start;
}

.guide-facts {
  margin: 0;
}

.guide-fact {
  padding: 14px 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.guide-fact:first-child {
  border-top: 0;
  padding-top: 4px;
}

.guide-fact dt {
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.guide-fact dd {
  margin: 4px 0 0;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
}

/* ---------- first hour ---------- */
.guide-progress {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  gap: 8px 16px;
  max-width: 420px;
}

.guide-progress__label {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.guide-progress__count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.guide-progress__track {
  grid-column: 1 / -1;
  height: 6px;
  overflow: hidden;
  border-radius: var(--arc-r-sm);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.guide-progress__fill {
  display: block;
  height: 100%;
  background: var(--acc-solid);
  transform-origin: left;
  transition: transform .4s cubic-bezier(.2, .8, .2, 1);
}

.guide-steps {
  margin-top: var(--arc-group-gap);
}

.guide-step {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  padding: 8px 0;
}

.guide-step__toggle {
  display: grid;
  flex: 1 1 340px;
  grid-template-columns: 26px 2.2em minmax(0, 1fr);
  align-items: baseline;
  gap: 14px;
  padding: 10px 4px;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.guide-step__check {
  display: inline-grid;
  place-items: center;
  align-self: center;
  width: 24px;
  height: 24px;
  border-radius: var(--arc-r-sm);
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--arc-line-hot);
  color: var(--arc-on-acc);
  font-size: 13px;
  transition: background-color .2s ease, box-shadow .2s ease;
}

.guide-step.is-done .guide-step__check {
  background: var(--acc-solid);
  box-shadow: none;
}

.guide-step__toggle:hover .guide-step__check {
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.guide-step__n {
  color: var(--acc-ink);
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

.guide-step__text > span {
  color: var(--arc-muted);
  line-height: 1.55;
}

.guide-step.is-done .guide-step__text strong {
  color: var(--arc-muted);
  text-decoration: line-through;
  text-decoration-color: var(--arc-line-hot);
}

.guide-step__more {
  flex: none;
  margin-left: calc(26px + 2.2em + 32px);
}

/* ---------- warning under the starter choice ---------- */
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

/* ---------- search and the cards it filters ---------- */
.guide-search {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}

.guide-search > i {
  position: absolute;
  top: 22px;
  left: 16px;
  color: var(--arc-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.guide-search__field {
  flex: 1 1 320px;
  padding-left: 44px;
}

.guide-search__count {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.guide-empty {
  margin: var(--arc-group-gap) 0 0;
  color: var(--arc-muted);
}

.guide-cards {
  --arc-grid-min: 250px;
  margin: var(--arc-group-gap) 0 0;
  padding: 0;
  list-style: none;
}

.guide-card {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  height: 100%;
}

.guide-card__icon {
  margin-top: 3px;
  color: var(--acc-ink);
  font-size: 17px;
  text-align: center;
}

.guide-card__text {
  display: grid;
  gap: 4px;
}

.guide-card__text strong {
  font-weight: 600;
}

.guide-card__text span {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}

.guide-card__arrow {
  margin-top: 4px;
  color: var(--arc-muted);
  font-size: .85em;
  transition: color .2s ease, transform .25s ease;
}

.guide-card:hover .guide-card__arrow {
  color: var(--acc-ink);
  transform: translateX(3px);
}

/* ---------- popular questions ---------- */
.guide-questions {
  max-width: var(--arc-measure);
}

.guide-questions .arc-row {
  padding: 0;
}

.guide-questions__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 10px 2px;
  color: var(--arc-ink);
  font-weight: 500;
  text-decoration: none;
}

.guide-questions__link i {
  color: var(--arc-muted);
  font-size: .85em;
  transition: color .2s ease, transform .25s ease;
}

.guide-questions__link:hover {
  color: var(--acc-ink);
}

.guide-questions__link:hover i {
  color: var(--acc-ink);
  transform: translateX(3px);
}

/* ---------- where to go next ---------- */
.guide-links {
  padding-top: var(--arc-group-gap);
  border-top: var(--arc-bw) solid var(--arc-line);
}

.guide-links__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: var(--arc-group-gap);
}

@media (max-width: 760px) {
  .guide-start {
    grid-template-columns: minmax(0, 1fr);
  }

  .guide-facts {
    margin-top: 8px;
  }
}

@media (max-width: 640px) {
  .guide-step__toggle {
    grid-template-columns: 24px 1.6em minmax(0, 1fr);
    gap: 10px;
  }

  .guide-step__more {
    margin-left: calc(24px + 1.6em + 24px);
  }

  .guide-links__row > * {
    flex: 1 1 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-progress__fill,
  .guide-card__arrow,
  .guide-questions__link i {
    transition: none;
  }

  .guide-card:hover .guide-card__arrow,
  .guide-questions__link:hover i {
    transform: none;
  }
}
</style>
