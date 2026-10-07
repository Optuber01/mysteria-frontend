<template>
  <!-- The homepage's join card, in the guide's words: one address for both editions, then what each needs. -->
  <div class="guide-join arc-panel">
    <button
        type="button"
        class="guide-ip"
        :class="`is-${copyState}`"
        aria-describedby="guide-join-note"
        @click="copy"
    >
      <span ref="addressRef" class="guide-ip__address">{{ address }}</span>
      <span class="guide-ip__hint">
        <i :class="copyIcon" aria-hidden="true"></i>
        {{ copyLabel }}
      </span>
    </button>
    <p id="guide-join-note" class="guide-join__note" :class="`is-${copyState}`" aria-live="polite">{{ copyNote }}</p>

    <ul class="guide-join__editions">
      <li v-for="edition in EDITIONS" :key="edition.key" class="guide-join__edition">
        <i :class="edition.icon" aria-hidden="true"></i>
        <div>
          <h3 class="arc-h4">{{ ui[`${edition.key}Name`] }}</h3>
          <p>{{ ui[`${edition.key}Body`] }}</p>
        </div>
      </li>
    </ul>

    <div class="guide-join__foot">
      <p>{{ ui.joinVerify }}</p>
      <RouterLink v-if="moreLabel" :to="$lp('/guide/connect')" class="arc-btn arc-btn--ghost arc-btn--sm">
        {{ moreLabel }}
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useCopyAddress} from '@/components/home-arcana/useCopyAddress';
import type {GuideContent} from '@/data/guideContent';

const props = defineProps<{
  ui: GuideContent['ui'];
  /** The link to the full joining topic (omitted on that topic itself). */
  moreLabel?: string;
}>();

const EDITIONS = [
  {key: 'java', icon: 'fa-solid fa-desktop'},
  {key: 'bedrock', icon: 'fa-solid fa-mobile-screen'},
] as const;

const addressRef = ref<HTMLElement | null>(null);
const {state: copyState, copy, address} = useCopyAddress(addressRef);

const copyLabel = computed(() => ({
  idle: props.ui.copy,
  copied: props.ui.copied,
  failed: props.ui.copyFailed,
}[copyState.value]));
const copyIcon = computed(() => ({
  idle: 'fa-solid fa-copy',
  copied: 'fa-solid fa-check',
  failed: 'fa-solid fa-triangle-exclamation',
}[copyState.value]));
/* the line under the address always holds text, so the copy feedback never shifts the layout */
const copyNote = computed(() => ({
  idle: props.ui.copyHint,
  copied: props.ui.copiedHint,
  failed: props.ui.copyFailedHint,
}[copyState.value]));
</script>

<style scoped>
/* the copy field: the homepage's address control (scoped there, so drawn again here) */
.guide-ip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: var(--arc-btn-h);
  padding: 0 7px 0 18px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--arc-ink);
  font: inherit;
  cursor: pointer;
  transition: box-shadow .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.guide-ip:hover {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
  transform: translateY(-2px);
}

.guide-ip:active {
  transform: scale(.98);
  transition-duration: .08s;
}

.guide-ip__address {
  overflow-wrap: anywhere;
  font-size: var(--arc-fs-body);
  font-weight: 600;
  text-align: left;
  user-select: all;
}

.guide-ip__hint {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 11px;
  border-radius: var(--arc-r-sm);
  background: color-mix(in oklab, var(--acc) 16%, transparent);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  white-space: nowrap;
  transition: background-color .2s ease;
}

.guide-ip:hover .guide-ip__hint {
  background: color-mix(in oklab, var(--acc) 26%, transparent);
}

.guide-ip.is-copied .guide-ip__hint {
  color: var(--arc-ok);
  background: color-mix(in oklab, var(--arc-ok) 14%, transparent);
}

.guide-ip.is-failed .guide-ip__hint {
  color: var(--arc-bad);
  background: color-mix(in oklab, var(--arc-bad) 14%, transparent);
}

.guide-join__note {
  min-height: 1.6em;
  margin: 10px 0 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.6;
}

.guide-join__note.is-copied {
  color: var(--arc-ok);
}

.guide-join__note.is-failed {
  color: var(--arc-bad);
}

.guide-join__editions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
  margin: 22px 0 0;
  padding: 22px 0 0;
  border-top: var(--arc-bw) solid var(--arc-line);
  list-style: none;
}

.guide-join__edition {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 14px;
}

.guide-join__edition > i {
  margin-top: 4px;
  color: var(--acc-ink);
  font-size: 18px;
  text-align: center;
}

.guide-join__edition h3 {
  margin-bottom: 6px;
}

.guide-join__edition p,
.guide-join__foot p {
  margin: 0;
  color: var(--arc-muted);
  line-height: 1.6;
  text-wrap: pretty;
}

.guide-join__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.guide-join__foot p {
  flex: 1 1 32ch;
}

@media (max-width: 640px) {
  .guide-join__editions {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-ip {
    transition: none;
  }

  .guide-ip:hover,
  .guide-ip:active {
    transform: none;
  }
}
</style>
