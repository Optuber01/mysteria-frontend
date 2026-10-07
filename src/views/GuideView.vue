<template>
  <ArcPage
      :title="content ? (topic ? topic.title : content.ui.title) : undefined"
      :lede="content ? (topic ? topic.summary : content.ui.lede) : undefined"
      :back="content && topic ? {to: localePath('/guide', currentLanguage), label: content.ui.backToGuide} : undefined"
  >
    <template v-if="content && !topic" #actions>
      <a href="#first-hour" class="arc-btn arc-btn--solid">
        {{ content.ui.startJourney }}
        <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
      </a>
      <a href="#answers" class="arc-btn arc-btn--ghost" @click="focusSearch">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        {{ content.ui.findAnswer }}
      </a>
    </template>

    <ArcState v-if="!content" kind="loading"/>
    <div v-else class="arc-split guide-layout">
      <!-- every topic by group; on a topic page its sections sit under it -->
      <ArcToc
          :key="topic?.id ?? 'hub'"
          :label="topic ? content.ui.mobileBrowse : t('guidePage.browseAll')"
          :groups="tocGroups"
          :current="topic?.id"
      />
      <GuideTopic v-if="topic" :key="topic.id" :content="content" :topic="topic"/>
      <GuideHome v-else :content="content"/>
    </div>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, shallowRef, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcState from "@/components/arcana/ArcState.vue";
import ArcToc, {type TocGroup} from "@/components/arcana/ArcToc.vue";
import GuideHome from "@/components/guide/GuideHome.vue";
import GuideTopic from "@/components/guide/GuideTopic.vue";
import {sectionId} from "@/components/guide/sectionId";
import {useI18n} from "@/composables/useI18n";
import {localePath} from "@/composables/useLocalePath";
import {breadcrumbLd, faqLd, useSeo} from "@/composables/useSeo";
import {type GuideCategory, type GuideContent, type GuideTopic as Topic, loadGuide} from "@/data/guideContent";

const {t, currentLanguage} = useI18n();
const route = useRoute();
const router = useRouter();

/* only the reader's language is fetched; switching language swaps it */
const content = shallowRef<GuideContent | null>(null);
watch(currentLanguage, async language => {
  const loaded = await loadGuide(language);
  if (language === currentLanguage.value) content.value = loaded;
}, {immediate: true});

const topicId = computed(() => (typeof route.params.topic === "string" ? route.params.topic : ""));
const topic = computed<Topic | null>(() => content.value?.topics.find(entry => entry.id === topicId.value) ?? null);

/* an unknown topic falls back to the guide's front page rather than an empty one */
watch([topicId, content], ([id, loaded]) => {
  if (id && loaded && !loaded.topics.some(entry => entry.id === id)) {
    void router.replace({name: "guide", params: {...route.params, topic: undefined}});
  }
}, {immediate: true});

const CATEGORY_ORDER: GuideCategory[] = ["start", "progression", "world", "community", "help"];

const tocGroups = computed<TocGroup[]>(() => {
  const guide = content.value;
  if (!guide) return [];
  return CATEGORY_ORDER
      .map(category => ({
        title: guide.categories[category],
        items: guide.topics
            .filter(entry => entry.category === category)
            .flatMap(entry => [
              {id: entry.id, label: entry.shortTitle, to: localePath(`/guide/${entry.id}`, currentLanguage.value)},
              ...(entry.id === topic.value?.id
                  ? entry.sections.map((section, index) => ({
                    id: sectionId(entry.id, index),
                    label: section.title,
                    href: `#${sectionId(entry.id, index)}`,
                    sub: true,
                  }))
                  : []),
            ]),
      }))
      .filter(group => group.items.length);
});

/*
 * Each topic stores a question-shaped title with a one-paragraph answer, the
 * shape FAQPage rewards. The front page publishes the whole set; a topic page
 * publishes its own answer plus a breadcrumb.
 */
useSeo(() => {
  const guide = content.value;
  const trail = [{name: "Home", path: "/"}, {name: "Guide", path: "/guide"}];
  if (!guide) return {title: "Guide", description: "", path: topicId.value ? `/guide/${topicId.value}` : "/guide"};

  const current = topic.value;
  if (!current) {
    return {
      title: guide.ui.title,
      description: guide.ui.lede,
      path: "/guide",
      imageAlt: "Getting started on Mysterria",
      jsonLd: [
        breadcrumbLd(trail),
        faqLd(guide.topics
            .filter(entry => entry.summary && entry.answer)
            .map(entry => ({question: entry.title, answer: entry.answer}))),
      ],
    };
  }

  return {
    title: current.title,
    description: current.summary || current.answer,
    path: `/guide/${current.id}`,
    jsonLd: [
      breadcrumbLd([...trail, {name: current.shortTitle, path: `/guide/${current.id}`}]),
      faqLd([{question: current.title, answer: current.answer}]),
    ],
  };
});

/* "Find an answer" lands on the search with the cursor in it, not just beside it */
function focusSearch() {
  requestAnimationFrame(() => document.getElementById("guide-search")?.focus({preventScroll: true}));
}
</script>

<style scoped>
/* the contents start a head's distance under the title, not a whole block's */
.arc-page > .arc-shell > .guide-layout {
  margin-top: var(--arc-head-gap);
}
</style>
