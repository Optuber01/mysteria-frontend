<template>
  <!-- The address to copy, what joining needs, and the optional client. -->
  <div class="guide-join arc-panel">
    <p :id="labelId" class="guide-join__label">{{ ui.serverAddress }}</p>
    <button
        type="button"
        class="guide-ip"
        :class="`is-${copyState}`"
        :aria-describedby="labelId"
        @click="copy"
    >
      <span ref="addressRef" class="guide-ip__address">{{ address }}</span>
      <span class="guide-ip__hint" aria-live="polite">
        <i :class="copyState === 'copied' ? 'fa-solid fa-check' : 'fa-solid fa-copy'" aria-hidden="true"></i>
        {{ copyState === 'copied' ? ui.copied : ui.copyAddress }}
      </span>
    </button>

    <ul class="guide-join__points">
      <li v-for="key in POINTS" :key="key">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
        {{ t(`guidePage.${key}`) }}
      </li>
    </ul>

    <!-- "No mods required" always raises the same follow-up question, so the answer sits right under it -->
    <RouterLink :to="$lp('/#companion')" class="arc-link guide-join__companion">
      {{ t('guidePage.joinCompanion') }}
      <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import {ref, useId} from 'vue';
import {useCopyAddress} from '@/components/home-arcana/useCopyAddress';
import {useI18n} from '@/composables/useI18n';
import type {GuideContent} from '@/data/guideContent';

defineProps<{ui: GuideContent['ui']}>();

const {t} = useI18n();
const labelId = `guide-join-${useId()}`;

const POINTS = ['joinNoMods', 'joinBedrock', 'joinFree'] as const;

/* a blocked clipboard leaves the address selected, ready for Ctrl+C */
const addressRef = ref<HTMLElement | null>(null);
const {state: copyState, copy, address} = useCopyAddress(addressRef);
</script>

<style scoped>
.guide-join__label {
  margin: 0 0 10px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

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
  font-size: var(--arc-fs-h4);
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

.guide-join__points {
  display: grid;
  gap: 10px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.guide-join__points li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  line-height: 1.5;
}

.guide-join__points i {
  color: var(--acc-ink);
}

.guide-join__companion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-top: 18px;
  padding-top: 16px;
  font-weight: 600;
}

.guide-join__companion i {
  font-size: .8em;
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
