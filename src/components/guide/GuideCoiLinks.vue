<template>
  <!-- The optional COI Client, from the same official pages the homepage links to. -->
  <div class="guide-coi">
    <p :id="labelId" class="guide-coi__label">{{ t('guidePage.coiClient') }}</p>
    <ul class="guide-coi__links" :aria-labelledby="labelId">
      <li v-for="platform in PLATFORMS" :key="platform.url">
        <a :href="platform.url" class="arc-btn arc-btn--ghost arc-btn--sm" target="_blank" rel="noopener noreferrer">
          <component :is="platform.icon" class="arc-btn__icon" aria-hidden="true"/>
          {{ platform.name }}
          <span class="arc-sr">({{ t('header.newTab') }})</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {useId} from 'vue';
import IconCurseForge from '@/assets/icons/IconCurseForge.vue';
import IconGithub from '@/assets/icons/IconGithub.vue';
import IconModrinth from '@/assets/icons/IconModrinth.vue';
import {useI18n} from '@/composables/useI18n';

const {t} = useI18n();
const labelId = `guide-coi-${useId()}`;

/* the links SectionCompanion uses: the releases page first, then the two mod sites */
const PLATFORMS = [
  {name: 'GitHub', url: 'https://github.com/ikeepcalm/coi-client/releases', icon: IconGithub},
  {name: 'Modrinth', url: 'https://modrinth.com/mod/coi-client', icon: IconModrinth},
  {name: 'CurseForge', url: 'https://www.curseforge.com/minecraft/mc-mods/coi-client', icon: IconCurseForge},
];
</script>

<style scoped>
.guide-coi {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
}

.guide-coi__label {
  margin: 0;
  font-weight: 600;
}

.guide-coi__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
