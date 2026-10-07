<template>
  <!--
    A page's contents (guide topics, rules sections, the pathway list): a sticky column
    beside the content on wide screens, a closed "contents" disclosure above it on phones.
    Entries are links (`to`) or in-page anchors (`href`); the current one is marked.
  -->
  <nav ref="nav" class="arc-toc" :aria-label="label">
    <details class="arc-toc__fold arc-details" :open="wide || undefined">
      <summary class="arc-toc__summary">
        <span>{{ label }}</span>
        <span v-if="currentLabel" class="arc-toc__current">{{ currentLabel }}</span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </summary>
      <!-- one box for everything under the summary, so the fold can ease open and shut -->
      <div class="arc-details__body arc-toc__body">
        <template v-for="group in groups" :key="group.title ?? 'all'">
          <p v-if="group.title" class="arc-toc__group">{{ group.title }}</p>
          <ul class="arc-toc__list">
            <li v-for="item in group.items" :key="item.id">
              <component
                  :is="item.to ? RouterLink : 'a'"
                  :to="item.to"
                  :href="item.to ? undefined : item.href ?? `#${item.id}`"
                  class="arc-toc__link"
                  :class="{'is-current': item.id === current, 'is-sub': item.sub}"
                  :aria-current="item.id === current ? (item.to ? 'page' : 'location') : undefined"
                  @click="$emit('pick', item.id)"
              >
                <span v-if="item.mark" class="arc-toc__mark">{{ item.mark }}</span>
                <span class="arc-toc__text">{{ item.label }}</span>
              </component>
            </li>
          </ul>
        </template>
      </div>
    </details>
  </nav>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {RouterLink} from 'vue-router';

export type TocItem = {id: string; label: string; to?: string; href?: string; mark?: string; sub?: boolean};
export type TocGroup = {title?: string; items: TocItem[]};

const props = defineProps<{
  label: string;
  groups: TocGroup[];
  current?: string;
}>();
defineEmits<{(e: 'pick', id: string): void}>();

const currentLabel = computed(() => props.groups.flatMap(g => g.items).find(i => i.id === props.current)?.label ?? '');

/* open beside the content on wide screens; folded on phones until asked for */
const wide = ref(true);
let query: MediaQueryList | null = null;
const sync = () => (wide.value = !!query?.matches);
onMounted(() => {
  query = window.matchMedia('(min-width: 901px)');
  sync();
  query.addEventListener('change', sync);
});
onUnmounted(() => query?.removeEventListener('change', sync));

/*
 * A long list scrolls inside its sticky column: keep the current entry in sight there,
 * moving the list only (scrollIntoView would move the page too).
 */
const nav = ref<HTMLElement | null>(null);
const revealCurrent = () => {
  const box = nav.value;
  const link = box?.querySelector<HTMLElement>('.is-current');
  if (!box || !link || !wide.value || box.scrollHeight <= box.clientHeight) return;
  const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
  if (top < box.scrollTop + 24) box.scrollTop = Math.max(0, top - 24);
  else if (top + link.offsetHeight > box.scrollTop + box.clientHeight - 24) box.scrollTop = top + link.offsetHeight - box.clientHeight + 24;
};
watch(() => props.current, () => nextTick(revealCurrent));
onMounted(() => nextTick(revealCurrent));
</script>

<style scoped>
.arc-toc {
  position: sticky;
  top: calc(var(--site-header-stack, 106px) + 16px);
  max-height: calc(100vh - var(--site-header-stack, 106px) - 32px);
  overflow-y: auto;
  overscroll-behavior: contain;
  /* a quiet scrollbar shows there is more below when the list outgrows the window */
  scrollbar-width: thin;
  scrollbar-color: var(--arc-line) transparent;
}

.arc-toc__summary {
  display: none;
}

.arc-toc__group {
  margin: 20px 0 8px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.arc-toc__group:first-of-type {
  margin-top: 0;
}

.arc-toc__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.arc-toc__link {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: var(--arc-r-md);
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 500;
  line-height: 1.35;
  text-decoration: none;
  transition: color .2s ease, background-color .2s ease;
}

.arc-toc__link.is-sub {
  padding-left: 26px;
}

.arc-toc__link:hover {
  color: var(--arc-ink);
  background: var(--arc-glass);
}

.arc-toc__link.is-current {
  color: var(--arc-ink);
  background: color-mix(in oklab, var(--acc) 10%, transparent);
  box-shadow: inset var(--arc-bw-accent) 0 0 var(--acc-ink);
}

.arc-toc__mark {
  flex: none;
  min-width: 1.6em;
  color: var(--acc-ink);
  font-variant-numeric: tabular-nums;
}

/* phones: one closed row above the content that opens into the list */
@media (max-width: 900px) {
  .arc-toc {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .arc-toc__fold {
    border-radius: var(--arc-r-lg);
    background: var(--arc-raised);
    box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  }

  .arc-toc__summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 18px;
    cursor: pointer;
    font-weight: 600;
    list-style: none;
  }

  .arc-toc__summary::-webkit-details-marker {
    display: none;
  }

  .arc-toc__current {
    overflow: hidden;
    color: var(--arc-muted);
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arc-toc__summary i {
    margin-left: auto;
    color: var(--arc-muted);
    transition: transform var(--arc-dur-2) var(--arc-ease);
  }

  .arc-toc__fold[open] .arc-toc__summary i {
    transform: rotate(180deg);
  }

  .arc-toc__body {
    padding: 0 8px 8px;
  }

  .arc-toc__group {
    margin-inline: 12px;
  }
}
</style>
