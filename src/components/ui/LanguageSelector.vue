<template>
  <div class="lang-ritual-selector">
    <button
        v-for="lang in ['en', 'uk']"
        :key="lang"
        :class="{ active: currentLanguage === lang }"
        class="lang-ritual-btn"
        @click="setLanguage(lang as Language)"
    >
      <span class="lang-label">{{ lang }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type {Language} from "@/composables/useI18n";
import {useI18n} from "@/composables/useI18n";

const {currentLanguage, setLanguage} = useI18n();
</script>

<style scoped>
.lang-ritual-selector {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 999px;
  background: rgba(255, 255, 255, .58);
  box-shadow: 0 5px 14px rgba(34, 28, 20, .05);
  backdrop-filter: blur(12px);
}

.lang-ritual-btn {
  min-width: 32px;
  min-height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  color: var(--ink-muted, #756b5c);
  background: transparent;
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.lang-label {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: .58rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.lang-ritual-btn.active {
  color: #fff;
  background: var(--primary, #7458e8);
  box-shadow: 0 5px 12px rgba(116, 88, 232, .2);
}

.lang-ritual-btn:hover:not(.active) { color: var(--ink, #221c14); background: var(--primary-tint, rgba(116, 88, 232, .12)); }
.lang-ritual-btn:active { transform: scale(.95); }
.lang-ritual-btn:focus-visible { outline: 2px solid var(--primary, #7458e8); outline-offset: 2px; }
</style>
