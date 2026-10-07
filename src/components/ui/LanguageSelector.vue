<template>
  <div ref="rootRef" class="lang-ritual-selector">
    <button
        :aria-expanded="isOpen"
        :aria-label="`${LOCALES[currentLanguage].short}, ${t('header.languageLabel')}`"
        aria-haspopup="listbox"
        class="lang-ritual-trigger"
        @click="isOpen = !isOpen"
    >
      <span class="lang-label">{{ LOCALES[currentLanguage].short }}</span>
      <i :class="{ open: isOpen }" aria-hidden="true" class="fa-solid fa-chevron-down lang-caret"></i>
    </button>

    <!-- kept in the page while shut (hidden from all), so it eases out as it eased in -->
    <ul class="lang-menu arc-popover" :class="{'is-open': isOpen}" role="listbox" :aria-label="t('header.languageLabel')">
      <li v-for="code in LANGUAGES" :key="code" role="none">
        <button
            :aria-selected="code === currentLanguage"
            :class="{ active: code === currentLanguage }"
            class="lang-option"
            role="option"
            @click="choose(code)"
        >
          <span class="lang-option-short">{{ LOCALES[code].short }}</span>
          <span class="lang-option-name">{{ LOCALES[code].nativeName }}</span>
          <i v-if="code === currentLanguage" aria-hidden="true" class="fa-solid fa-check lang-check"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "@/composables/useI18n";
import {type Language, LANGUAGES, LOCALES} from "@/locales";

const {t, currentLanguage} = useI18n();
const router = useRouter();
const route = useRoute();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

/*
 * Language lives in the URL, so switching is a navigation: swap the `lang`
 * param and keep everything else - path, params, query, hash - intact. The
 * router guard then applies the new locale. `replace` rather than `push` so the
 * back button doesn't walk through language changes.
 */
const choose = (code: Language) => {
  isOpen.value = false;
  if (code === currentLanguage.value) return;

  void router.replace({
    name: route.name ?? undefined,
    params: {...route.params, lang: code},
    query: route.query,
    hash: route.hash,
  });
};

const onDocumentClick = (event: MouseEvent) => {
  if (!isOpen.value) return;
  if (!rootRef.value?.contains(event.target as Node)) isOpen.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") isOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.lang-ritual-selector {
  position: relative;
  display: inline-flex;
}

.lang-ritual-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, var(--myst-ink) 3%, transparent);
  padding: 6px 10px;
  border: 1px solid var(--myst-line-14, rgba(255, 255, 255, 0.05));
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.lang-ritual-trigger:hover {
  border-color: var(--myst-line-40, rgba(255, 255, 255, 0.18));
}

.lang-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--myst-gold);
  font-weight: 700;
  letter-spacing: 1px;
}

.lang-caret {
  font-size: 8px;
  color: color-mix(in srgb, var(--myst-ink-muted) 75%, transparent);
  transition: transform var(--arc-dur-2) var(--arc-ease);
}

.lang-caret.open {
  transform: rotate(180deg);
}

/* ---- Menu ---- */
.lang-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 1200;
  min-width: 168px;
  --arc-popover-origin: top right;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--myst-bg);
  border: 1px solid var(--myst-line-18, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
}

:root[data-theme="parchment"] .lang-menu {
  box-shadow: 0 16px 36px rgba(24, 20, 30, 0.16);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.lang-option:hover {
  background: color-mix(in srgb, var(--myst-ink) 5%, transparent);
}

.lang-option.active {
  background: rgba(200, 178, 115, 0.1);
}

.lang-option-short {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--myst-ink-muted);
  min-width: 22px;
}

.lang-option-name {
  flex: 1;
  font-size: 12.5px;
  color: var(--myst-ink);
}

.lang-option.active .lang-option-short,
.lang-option.active .lang-option-name {
  color: var(--myst-gold);
}

.lang-check {
  font-size: 9px;
  color: var(--myst-gold);
}

/* Light theme */
:root[data-theme="parchment"] .lang-option.active {
  background: var(--myst-wash);
}
</style>
