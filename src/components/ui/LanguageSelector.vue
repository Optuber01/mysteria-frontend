<template>
  <div :aria-label="languageLabel" class="lang-ritual-selector" role="group">
    <button
        v-for="lang in ['en', 'uk']"
        :key="lang"
         :class="{ active: currentLanguage === lang }"
         :aria-label="languageNames[lang as Language]"
         :aria-pressed="currentLanguage === lang"
         class="lang-ritual-btn"
         type="button"
        @click="setLanguage(lang as Language)"
    >
      <span class="lang-label">{{ lang === 'uk' ? 'УКР' : 'EN' }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import type {Language} from '@/composables/useI18n';
import {useI18n} from '@/composables/useI18n';

const {currentLanguage, setLanguage} = useI18n();
const languageLabel = computed(() => currentLanguage.value === 'uk' ? 'Мова' : 'Language');
const languageNames: Record<Language, string> = {en: 'English', uk: 'Українська'};
</script>

<style scoped>
.lang-ritual-selector {
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, .025);
  padding: 2px;
  border: 1px solid rgba(200, 178, 115, .22);
  border-radius: var(--radius-md);
}

.lang-ritual-btn {
  background: transparent;
  border: none;
  min-width: 48px;
  height: 38px;
  padding: 0 10px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-sm);
}

.lang-label {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 650;
  text-transform: uppercase;
  color: #aaa6a0;
  letter-spacing: .06em;
}

.lang-ritual-btn.active {
  background: rgba(200, 178, 115, .11);
}

.lang-ritual-btn.active .lang-label {
  color: var(--myst-gold);
  font-weight: 700;
}

.lang-ritual-btn:hover:not(.active) .lang-label {
  color: #f0ece4;
}
</style>
