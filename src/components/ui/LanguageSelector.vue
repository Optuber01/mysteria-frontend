<template>
  <div ref="rootRef" class="lang-ritual-selector">
    <button
        ref="triggerRef"
        :aria-expanded="isOpen"
        :aria-label="`${LOCALES[currentLanguage].short}, ${t('header.languageLabel')}`"
        aria-haspopup="listbox"
        class="lang-ritual-trigger"
        type="button"
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
            type="button"
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
const triggerRef = ref<HTMLButtonElement | null>(null);

// the list is hidden from the tab order once shut: focus goes back to its button
const close = () => {
  if (!isOpen.value) return;
  const focusInside = rootRef.value?.contains(document.activeElement);
  isOpen.value = false;
  if (focusInside) triggerRef.value?.focus();
};

/*
 * Language lives in the URL, so switching is a navigation: swap the `lang`
 * param and keep everything else - path, params, query, hash - intact. The
 * router guard then applies the new locale. `replace` rather than `push` so the
 * back button doesn't walk through language changes.
 */
const choose = (code: Language) => {
  close();
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
  if (event.key === "Escape") close();
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

/* a header control (the bar restates the hairline and hover): 36px at the 10px radius */
.lang-ritual-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px;
  border: var(--arc-bw) solid var(--arc-line);
  border-radius: 10px;
  background: var(--arc-glass);
  color: var(--arc-ink);
  cursor: pointer;
  transition:
    border-color var(--arc-dur-2) var(--arc-ease),
    background-color var(--arc-dur-2) var(--arc-ease);
}

.lang-ritual-trigger:hover {
  border-color: var(--arc-line-hot);
}

/* the code in the page's own type: plain Commissioner, no caps styling (the codes are already EN, UK, ...) */
.lang-label {
  font-family: var(--arc-caps);
  font-size: 13px;
  font-weight: 600;
  color: var(--arc-ink);
}

.lang-caret {
  font-size: 8px;
  color: var(--arc-muted);
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
  min-width: 176px;
  --arc-popover-origin: top right;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--arc-r-md);
  /* opaque: the page behind must not show through the list */
  background: var(--arc-surface);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 18px 40px var(--arc-shadow);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: transparent;
  color: var(--arc-ink);
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--arc-dur-1) var(--arc-ease);
}

.lang-option:hover {
  background: var(--arc-glass);
}

.lang-option.active {
  background: color-mix(in oklab, var(--acc) 10%, transparent);
}

.lang-option-short {
  min-width: 24px;
  font-family: var(--arc-caps);
  font-size: 13px;
  font-weight: 600;
  color: var(--arc-muted);
}

.lang-option-name {
  flex: 1;
  font-size: var(--arc-fs-small);
  color: var(--arc-ink);
}

.lang-option.active .lang-option-short,
.lang-option.active .lang-option-name,
.lang-check {
  color: var(--acc-ink);
}

.lang-check {
  font-size: 10px;
}
</style>
