<template>
  <component :is="concept.component" v-if="concept" :key="concept.id"/>
  <ConceptSwitcher :groups="groups"/>
</template>

<script setup lang="ts">
import ConceptSwitcher from '@/components/home-concepts/ConceptSwitcher.vue';
import {HOME_CONCEPTS, useHomeConcept} from '@/components/home-concepts/concepts';
import {useI18n} from '@/composables/useI18n';
import {useSeo, videoGameLd} from '@/composables/useSeo';
import {useBeyonderStats} from '@/composables/useBeyonderStats';

const {t} = useI18n();
const {totalBeyonders} = useBeyonderStats();
const concept = useHomeConcept();
const groups = [{param: 'concept', label: 'Homepage concept', variants: HOME_CONCEPTS}];

useSeo(() => ({
  // The home page owns the bare brand title; every other route appends it.
  title: null,
  description: t('homePage.heroTagline'),
  path: '/',
  imageAlt: 'Mysterria - a Lord of the Mysteries Minecraft server',
  jsonLd: [videoGameLd(totalBeyonders.value)],
}));
</script>
