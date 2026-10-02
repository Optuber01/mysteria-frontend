<template>
  <div :class="['a-ip', `a-ip--${tone}`, `is-${state}`]">
    <span class="a-ip__label">{{ t('home.ascent.ip.label') }}</span>
    <button
        type="button"
        class="a-ip__button"
        :aria-label="t('home.ascent.ip.copyAria').replace('{ip}', ip)"
        @click="copy(addressRef)"
    >
      <span ref="addressRef" class="a-ip__address">{{ ip }}</span>
      <span class="a-ip__action" aria-hidden="true">
        <i :class="icon"></i>
        <span>{{ actionText }}</span>
      </span>
    </button>
    <span class="a-ip__live" role="status" aria-live="polite">{{ liveText }}</span>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useAscentCopy} from './useAscentCopy';

withDefaults(defineProps<{ tone?: 'dark' | 'light' }>(), {tone: 'dark'});

const {t} = useI18n();
const {state, copy, ip} = useAscentCopy();
const addressRef = ref<HTMLElement | null>(null);

const actionText = computed(() => {
  if (state.value === 'copied') return t('home.ascent.ip.copied');
  if (state.value === 'failed') return t('home.ascent.ip.failedShort');
  return t('home.ascent.ip.copy');
});
const icon = computed(() => {
  if (state.value === 'copied') return 'fa-solid fa-check';
  if (state.value === 'failed') return 'fa-solid fa-triangle-exclamation';
  return 'fa-solid fa-copy';
});
const liveText = computed(() => {
  if (state.value === 'copied') return t('home.ascent.ip.copiedLive');
  if (state.value === 'failed') return t('home.ascent.ip.failed');
  return '';
});
</script>

<style scoped>
.a-ip {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.a-ip__label {
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-ink-3);
}

.a-ip__button {
  display: inline-flex;
  align-items: stretch;
  min-height: 56px;
  padding: 0;
  border: 1px solid var(--a-line-strong);
  background: rgba(10, 11, 13, 0.55);
  color: var(--a-ink);
  cursor: pointer;
  transition: border-color 0.25s ease, background-color 0.25s ease;
}

.a-ip__button:hover {
  border-color: var(--a-accent);
}

.a-ip__address {
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-family: var(--a-mono);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: all;
}

.a-ip__action {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 112px;
  padding: 0 18px;
  border-left: 1px solid var(--a-line-strong);
  font-family: var(--a-mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--a-accent);
  transition: background-color 0.25s ease, color 0.25s ease;
}

.is-copied .a-ip__action {
  background: var(--a-accent);
  color: var(--a-on-accent);
}

.is-failed .a-ip__button {
  border-color: var(--a-warn);
}

.is-failed .a-ip__action {
  color: var(--a-warn);
}

.a-ip__live {
  min-height: 1.2em;
  font-size: 13px;
  color: var(--a-ink-2);
}

.a-ip__live:empty {
  visibility: hidden;
}

.a-ip--light .a-ip__label {
  color: var(--l-muted);
}

.a-ip--light .a-ip__button {
  border-color: rgba(11, 12, 14, 0.28);
  background: rgba(255, 255, 255, 0.7);
  color: var(--l-ink);
}

.a-ip--light .a-ip__button:hover {
  border-color: var(--l-accent);
}

.a-ip--light .a-ip__action {
  border-left-color: rgba(11, 12, 14, 0.2);
  color: var(--l-accent);
}

.a-ip--light.is-copied .a-ip__action {
  background: var(--l-ink);
  color: #fff;
}

.a-ip--light.is-failed .a-ip__action,
.a-ip--light .a-ip__live {
  color: var(--l-muted);
}

@media (max-width: 480px) {
  .a-ip__address {
    padding: 0 14px;
    font-size: 14px;
  }

  .a-ip__action {
    min-width: 0;
    padding: 0 14px;
  }
}
</style>
