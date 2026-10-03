<template>
  <ArcanaHome/>
</template>

<script setup lang="ts">
import ArcanaHome from '@/components/home-arcana/ArcanaHome.vue';
import {useI18n} from '@/composables/useI18n';
import {useSeo, videoGameLd} from '@/composables/useSeo';
import {useBeyonderStats} from '@/composables/useBeyonderStats';

const {t} = useI18n();
const {totalBeyonders} = useBeyonderStats();

useSeo(() => ({
  // The home page owns the bare brand title; every other route appends it.
  title: null,
  description: t('homePage.heroTagline'),
  path: '/',
  imageAlt: 'Mysterria - a Lord of the Mysteries Minecraft server',
  jsonLd: [videoGameLd(totalBeyonders.value)],
}));
</script>
