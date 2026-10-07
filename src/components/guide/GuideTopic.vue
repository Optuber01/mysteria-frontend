<template>
  <!-- One topic: the short answer, its sections as long text, then what to read next. -->
  <article class="guide-topic">
    <section class="arc-panel guide-answer" :aria-labelledby="`${topic.id}-answer`">
      <h2 :id="`${topic.id}-answer`" class="guide-answer__label">{{ content.ui.quickAnswer }}</h2>
      <p>{{ topic.answer }}</p>
    </section>

    <!-- phones fold the contents column away, so the sections are listed here as well -->
    <nav class="guide-index" :aria-label="content.ui.onThisPage">
      <p class="guide-index__label" aria-hidden="true">{{ content.ui.onThisPage }}</p>
      <ul>
        <li v-for="(section, index) in topic.sections" :key="section.title">
          <a :href="`#${sectionId(topic.id, index)}`" class="arc-link">{{ section.title }}</a>
        </li>
      </ul>
    </nav>

    <section v-if="topic.id === 'connect'" class="guide-shots" aria-labelledby="guide-shots-label">
      <h2 id="guide-shots-label" class="guide-shots__label">{{ content.ui.screenshotsLabel }}</h2>
      <div class="guide-shots__grid">
        <figure v-for="(shot, index) in SHOTS" :key="shot.key">
          <img
              :src="shot.src"
              :width="shot.width"
              :height="shot.height"
              :alt="content.ui[shot.key]"
              loading="lazy"
              decoding="async"
          >
          <figcaption aria-hidden="true">{{ String(index + 1).padStart(2, '0') }} · {{ content.ui[shot.key] }}</figcaption>
        </figure>
      </div>
    </section>

    <GuideChoiceComparison v-if="topic.id === 'starter-choice'" :choices="content.starterChoices" :ui="content.ui"/>

    <div class="guide-sections">
      <template v-for="(section, index) in topic.sections" :key="section.title">
        <section
            :id="sectionId(topic.id, index)"
            class="arc-prose guide-section"
            :aria-labelledby="`${sectionId(topic.id, index)}-title`"
        >
          <h2 :id="`${sectionId(topic.id, index)}-title`">{{ section.title }}</h2>

          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>

          <ul v-if="section.bullets">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>

          <ol v-if="section.steps">
            <li v-for="step in section.steps" :key="step">{{ step }}</li>
          </ol>

          <!-- the command is each row's header, so the table needs no column titles -->
          <div v-if="section.commands" class="arc-table-wrap">
            <table class="arc-table guide-commands">
              <tbody>
                <tr v-for="command in section.commands" :key="command.command">
                  <th scope="row"><code>{{ command.command }}</code></th>
                  <td>{{ command.purpose }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="section.warning" class="guide-note guide-note--warning">
            <strong>{{ content.ui.commonMistake }}</strong>
            {{ section.warning }}
          </p>
          <p v-if="section.tip" class="guide-note">
            <strong>{{ content.ui.usefulTip }}</strong>
            {{ section.tip }}
          </p>
        </section>

        <!-- the optional client belongs beside "no client mods are required" -->
        <GuideCoiLinks v-if="topic.id === 'connect' && index === 0" class="arc-panel guide-topic__coi"/>
      </template>
    </div>

    <section v-if="related.length" class="guide-topic__block" aria-labelledby="guide-read-next">
      <h2 id="guide-read-next" class="arc-h4">{{ content.ui.relatedTopics }}</h2>
      <ul class="arc-grid guide-next">
        <li v-for="next in related" :key="next.id">
          <RouterLink :to="$lp(`/guide/${next.id}`)" class="arc-panel arc-panel--link guide-next__item">
            <span class="guide-next__title">
              <i :class="next.icon" class="guide-next__icon" aria-hidden="true"></i>
              {{ next.shortTitle }}
              <i class="fa-solid fa-arrow-right guide-next__arrow" aria-hidden="true"></i>
            </span>
            <span class="guide-next__body">{{ next.summary }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </article>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import GuideChoiceComparison from "./GuideChoiceComparison.vue";
import GuideCoiLinks from "./GuideCoiLinks.vue";
import {sectionId} from "./sectionId";
import type {GuideContent, GuideTopic} from "@/data/guideContent";
import ipShot from "@/assets/images/guide/ip.webp";
import joinShot from "@/assets/images/guide/join.webp";
import portalShot from "@/assets/images/guide/portal.webp";

const props = defineProps<{
  content: GuideContent;
  topic: GuideTopic;
}>();

/* the joining screenshots in the order a player meets them, at their real sizes so nothing jumps */
const SHOTS = [
  {key: "screenshotIp", src: ipShot, width: 606, height: 259},
  {key: "screenshotJoin", src: joinShot, width: 652, height: 186},
  {key: "screenshotPortal", src: portalShot, width: 447, height: 244},
] as const;

const related = computed(() => props.topic.related
    .map(id => props.content.topics.find(topic => topic.id === id))
    .filter((topic): topic is GuideTopic => Boolean(topic)));
</script>

<style scoped>
.guide-topic > * + * {
  margin-top: var(--arc-block-gap);
}

.guide-topic > .guide-answer + *,
.guide-topic > .guide-index + * {
  margin-top: var(--arc-group-gap);
}

/* the quick answer: the one paragraph to read if nothing else */
.guide-answer {
  max-width: var(--arc-measure);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
}

.guide-answer__label,
.guide-shots__label,
.guide-index__label {
  margin: 0;
  color: var(--arc-muted);
  font-family: var(--arc-body);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  line-height: 1.4;
}

.guide-answer p {
  margin: 8px 0 0;
  font-size: var(--arc-fs-lede);
  line-height: 1.6;
}

/* on this page: phones only; wide screens have the contents column */
.guide-index {
  display: none;
}

.guide-index ul {
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.guide-index a {
  display: inline-block;
  padding: 2px 0;
}

@media (max-width: 900px) {
  .guide-index {
    display: block;
  }
}

.guide-shots__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  align-items: start;
  gap: var(--arc-grid-gap);
  margin-top: 12px;
}

.guide-shots figure {
  margin: 0;
}

.guide-shots img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--arc-r-md);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.guide-shots figcaption {
  margin-top: 8px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  line-height: 1.4;
}

/* each section starts below the sticky header when reached from the contents */
.guide-section {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 24px);
}

.guide-sections > * + * {
  margin-top: 2.4em;
}

.guide-section > h2 {
  margin-top: 0;
}

.guide-topic__coi {
  max-width: var(--arc-measure);
}

.guide-section .arc-table-wrap {
  margin-top: 1em;
}

.guide-commands th {
  width: 40%;
  font-weight: 400;
  text-align: left;
  vertical-align: top;
}

.guide-commands code {
  font-family: var(--arc-mono);
  font-weight: 600;
  white-space: nowrap;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* phones: commands wrap rather than push the table sideways */
@media (max-width: 640px) {
  .guide-commands :is(th, td) {
    padding-inline: 12px;
  }

  .guide-commands code {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

/* a mistake or a tip: an edge in the warning colour or the accent, the label in ink */
.guide-note {
  padding: 4px 0 4px 18px;
  border-left: var(--arc-bw-accent) solid var(--arc-line-acc);
}

.guide-note--warning {
  border-left-color: var(--arc-warn);
}

.guide-note strong {
  margin-right: 6px;
}

/* continue reading */
.guide-topic__block > .arc-h4 + * {
  margin-top: 12px;
}

.guide-next {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.guide-next__item {
  display: grid;
  gap: 6px;
  align-content: start;
  height: 100%;
}

.guide-next__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.guide-next__icon {
  width: 18px;
  color: var(--acc-ink);
  text-align: center;
}

.guide-next__arrow {
  margin-left: auto;
  color: var(--arc-muted);
  font-size: .85em;
}

.guide-next__item:hover .guide-next__arrow {
  color: var(--acc-ink);
}

.guide-next__body {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}
</style>
