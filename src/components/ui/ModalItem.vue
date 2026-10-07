<template>
  <Teleport to="body">
    <!-- the shared dialog motion (arcana.css): the backdrop fades, the panel rises in and sinks back -->
    <Transition name="arc-dialog">
      <div v-if="localShow" class="arc-modal" @click="handleOverlayClick">
        <div
            ref="panel"
            :aria-labelledby="titleId"
            :class="[size, { 'has-footer': $slots.footer }]"
            aria-modal="true"
            class="arc-modal__panel"
            role="dialog"
            tabindex="-1"
            @click.stop
            @keydown="onKeydown"
        >
          <div class="arc-modal__head">
            <h2 :id="titleId" class="arc-h4 arc-modal__title">
              <slot name="header">{{ localTitle }}</slot>
            </h2>
            <button :aria-label="t('close')" class="arc-modal__close" type="button" @click="close">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="arc-modal__body">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="arc-modal__foot">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {nextTick, ref, useId, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';

const props = withDefaults(defineProps<{
  show?: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
}>(), {
  show: false,
  size: 'md',
  closeOnOverlay: true
});

const emit = defineEmits(['close', 'confirm', 'cancel']);
const {t} = useI18n();
const titleId = `arc-modal-${useId()}`;
const panel = ref<HTMLElement | null>(null);

const localShow = ref(props.show);
const localTitle = ref(props.title);
const onConfirmCallback = ref<(() => void) | null>(null);
const onCancelCallback = ref<(() => void) | null>(null);

watch(() => props.show, (newVal) => {
  localShow.value = newVal;
});

/* a dialog takes focus when it opens, keeps Tab inside, closes on Escape, and hands
   focus back to whatever opened it */
let opener: HTMLElement | null = null;
watch(localShow, async (open) => {
  if (open) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await nextTick();
    const first = panel.value?.querySelector<HTMLElement>('input, select, textarea, [autofocus]');
    (first ?? panel.value)?.focus();
  } else {
    opener?.focus();
    opener = null;
  }
});

const focusables = () => [...(panel.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
) ?? [])];

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close();
  }
};

const showModal = (config: { title?: string, onConfirm?: () => void, onCancel?: () => void }) => {
  if (config.title) localTitle.value = config.title;
  onConfirmCallback.value = config.onConfirm || null;
  onCancelCallback.value = config.onCancel || null;
  localShow.value = true;
};

const close = () => {
  localShow.value = false;
  emit('close');
  if (onCancelCallback.value) onCancelCallback.value();
};

const onConfirm = () => {
  if (onConfirmCallback.value) onConfirmCallback.value();
  emit('confirm');
  localShow.value = false;
};

const onCancel = () => {
  close();
};

defineExpose({
  showModal,
  closeModal: close,
  isVisible: localShow,
  onConfirm,
  onCancel
});
</script>

<style scoped>
.arc-modal {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in oklab, var(--arc-bg) 72%, transparent);
  backdrop-filter: blur(8px);
}

.arc-modal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 24px 70px var(--arc-shadow-strong);
  color: var(--arc-ink);
}

.arc-modal__panel:focus-visible {
  outline: none;
}

.arc-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px var(--arc-pad);
  border-bottom: var(--arc-bw) solid var(--arc-line);
}

.arc-modal__close {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: none;
  color: var(--arc-muted);
  font-size: 18px;
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease;
}

.arc-modal__close:hover {
  background: var(--arc-glass);
  color: var(--arc-ink);
}

.arc-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--arc-pad);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.arc-modal__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px var(--arc-pad);
  border-top: var(--arc-bw) solid var(--arc-line);
}

/* Sizes */
.sm {
  max-width: 400px;
}

.md {
  max-width: 560px;
}

.lg {
  max-width: 800px;
}

.xl {
  max-width: 1000px;
}

.full {
  max-width: 95vw;
  height: 95vh;
}

@media (max-width: 520px) {
  .arc-modal {
    align-items: flex-end;
    padding: 10px;
  }

  .arc-modal__foot > :deep(*) {
    flex: 1 1 auto;
  }
}
</style>
