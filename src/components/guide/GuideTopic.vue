<template>
  <!-- One topic: its sections as plain long text, then where to read more and what to read next. -->
  <article class="guide-topic">
    <GuideJoin v-if="topic.id === 'connect'" :ui="content.ui" class="guide-topic__join"/>
    <GuideChoiceComparison v-if="topic.id === 'starter-choice'" :choices="content.starterChoices" :ui="content.ui"/>

    <div class="arc-prose guide-topic__prose">
      <section
          v-for="(section, index) in topic.sections"
          :id="sectionId(topic.id, index)"
          :key="section.title"
          class="guide-section"
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

        <div v-if="section.commands" class="arc-table-wrap">
          <table class="arc-table guide-commands">
            <thead>
              <tr>
                <th scope="col">{{ content.ui.command }}</th>
                <th scope="col">{{ content.ui.purpose }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="command in section.commands" :key="command.command">
                <td><code>{{ command.command }}</code></td>
                <td>{{ command.purpose }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="section.warning" class="guide-note guide-note--warning">
          <strong>{{ content.ui.warning }}</strong>
          {{ section.warning }}
        </p>
        <p v-if="section.tip" class="guide-note">
          <strong>{{ content.ui.tip }}</strong>
          {{ section.tip }}
        </p>

        <div v-if="section.figures" class="guide-figures">
          <figure v-for="figure in section.figures" :key="figure.image">
            <img
                :src="IMAGES[figure.image].src"
                :width="IMAGES[figure.image].width"
                :height="IMAGES[figure.image].height"
                :alt="figure.caption"
                loading="lazy"
                decoding="async"
            >
            <figcaption aria-hidden="true">{{ figure.caption }}</figcaption>
          </figure>
        </div>
      </section>
    </div>

    <section v-if="topic.links.length" class="guide-topic__block" aria-labelledby="guide-read-more">
      <h2 id="guide-read-more" class="arc-h4">{{ content.ui.readMore }}</h2>
      <ul class="arc-rows guide-links">
        <li v-for="link in topic.links" :key="link.label + (link.wiki ?? link.to)" class="arc-row">
          <a
              v-if="link.wiki"
              :href="wikiUrl(link.wiki, currentLanguage)"
              class="guide-links__item"
              target="_blank"
              rel="noopener noreferrer"
          >
            <span>{{ link.label }}</span>
            <span class="arc-tag">{{ content.ui.wikiTitle }}</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span class="arc-sr">({{ t('header.newTab') }})</span>
          </a>
          <RouterLink v-else-if="link.to" :to="$lp(link.to)" class="guide-links__item">
            <span>{{ link.label }}</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section v-if="related.length" class="guide-topic__block" aria-labelledby="guide-read-next">
      <h2 id="guide-read-next" class="arc-h4">{{ content.ui.readNext }}</h2>
      <ul class="arc-grid guide-next">
        <li v-for="next in related" :key="next.id">
          <RouterLink :to="$lp(`/guide/${next.id}`)" class="arc-panel arc-panel--link guide-next__item">
            <span class="guide-next__title">
              {{ next.shortTitle }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
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
import GuideJoin from "./GuideJoin.vue";
import {sectionId} from "./sectionId";
import {useI18n} from "@/composables/useI18n";
import {type GuideContent, type GuideImage, type GuideTopic, wikiUrl} from "@/data/guideContent";
import ipShot from "@/assets/images/guide/ip.webp";
import joinShot from "@/assets/images/guide/join.webp";
import portalShot from "@/assets/images/guide/portal.webp";
import verifyShot from "@/assets/images/guide/verify.webp";

const props = defineProps<{
  content: GuideContent;
  topic: GuideTopic;
}>();

const {t, currentLanguage} = useI18n();

/* the screenshots' real sizes, so the page doesn't jump as they load */
const IMAGES: Record<GuideImage, {src: string; width: number; height: number}> = {
  ip: {src: ipShot, width: 606, height: 259},
  join: {src: joinShot, width: 652, height: 186},
  portal: {src: portalShot, width: 447, height: 244},
  verify: {src: verifyShot, width: 947, height: 423},
};

const related = computed(() => props.topic.related
    .map(id => props.content.topics.find(topic => topic.id === id))
    .filter((topic): topic is GuideTopic => Boolean(topic)));
</script>

<style scoped>
.guide-topic > * + * {
  margin-top: var(--arc-block-gap);
}

.guide-topic__join + .guide-topic__prose,
.guide-choices + .guide-topic__prose {
  margin-top: var(--arc-head-gap);
}

/* each section starts below the sticky header when reached from the contents */
.guide-section {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 24px);
}

.guide-section:first-child > h2 {
  margin-top: 0;
}

.guide-section > h2 {
  margin-top: 1.9em;
}

.guide-topic__prose .arc-table-wrap {
  margin-top: 1em;
}

.guide-commands code {
  /* the site's one family, as the homepage sets its address; no system monospace */
  font-family: var(--arc-mono);
  font-weight: 600;
  white-space: nowrap;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.guide-commands td:first-child {
  width: 40%;
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

/* a warning or a tip: an edge in the warning colour or the accent, the label in ink */
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

.guide-figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  align-items: start;
  gap: var(--arc-grid-gap);
  margin-top: 1.4em;
}

.guide-figures figure {
  margin: 0;
}

.guide-figures img {
  width: 100%;
  height: auto;
  border-radius: var(--arc-r-md);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.guide-figures figcaption {
  margin-top: 8px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  line-height: 1.4;
}

/* read more: wiki pages and site pages, one row each */
.guide-topic__block > .arc-h4 + * {
  margin-top: 12px;
}

.guide-links {
  max-width: var(--arc-measure);
}

.guide-links .arc-row {
  padding: 0;
}

.guide-links__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 10px 2px;
  color: var(--arc-ink);
  font-weight: 500;
  text-decoration: none;
}

.guide-links__item > span:first-child {
  flex: 1;
}

.guide-links__item i {
  color: var(--arc-muted);
  font-size: .85em;
  transition: color .2s ease;
}

.guide-links__item:hover {
  color: var(--acc-ink);
}

.guide-links__item:hover i {
  color: var(--acc-ink);
}

/* read next */
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
  justify-content: space-between;
  gap: 10px;
  font-weight: 600;
}

.guide-next__title i {
  color: var(--acc-ink);
  font-size: .85em;
}

.guide-next__body {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}
</style>
