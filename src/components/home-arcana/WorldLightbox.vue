<template>
  <!-- A player screenshot at full size, its credit, and a way to the post it came from. -->
  <dialog ref="dialogRef" class="lightbox" :aria-label="label" @close="emit('close')" @click="onBackdrop">
    <figure v-if="shot" class="lightbox__figure">
      <img :src="shot.src" :alt="shot.place" :width="shot.w" :height="shot.h" decoding="async">
      <figcaption class="lightbox__caption">
        <span class="lightbox__credit"><strong>{{ shot.place }}</strong> · {{ creditText }}</span>
        <a v-if="shot.source" :href="shot.source" class="lightbox__source" target="_blank" rel="noopener noreferrer">
          <IconDiscord class="lightbox__icon" aria-hidden="true"/>
          {{ t('home.world.gallery.source') }}
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>
      </figcaption>
    </figure>

    <button type="button" class="lightbox__nav lightbox__nav--prev" :aria-label="t('home.world.gallery.prev')" @click="step(-1)">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
    </button>
    <button type="button" class="lightbox__nav lightbox__nav--next" :aria-label="t('home.world.gallery.next')" @click="step(1)">
      <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
    </button>
    <button type="button" class="lightbox__close" :aria-label="t('home.world.gallery.close')" @click="close">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  </dialog>
</template>

<script setup lang="ts">
import {computed, nextTick, onUnmounted, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import type {WorldShot} from './WorldShots';

const props = defineProps<{shots: readonly WorldShot[]; index: number | null}>();
const emit = defineEmits<{(e: 'close'): void; (e: 'update:index', value: number): void}>();

const {t} = useI18n();
const dialogRef = ref<HTMLDialogElement | null>(null);
const shot = computed(() => (props.index === null ? null : props.shots[props.index] ?? null));
const creditText = computed(() => (shot.value ? t('home.world.credit').replace('{author}', shot.value.author) : ''));
const label = computed(() => t('home.world.gallery.label'));

function step(by: number) {
  if (props.index === null) return;
  const n = props.shots.length;
  emit('update:index', (props.index + by + n) % n);
}

function close() {
  dialogRef.value?.close();
}

/* a click on the dark around the picture closes it (the dialog itself is the backdrop's box) */
function onBackdrop(event: MouseEvent) {
  if (event.target === dialogRef.value) close();
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') step(-1);
  if (event.key === 'ArrowRight') step(1);
}

watch(() => props.index, async (index, before) => {
  const dialog = dialogRef.value;
  if (!dialog) return;
  if (index !== null && before === null) {
    await nextTick();
    dialog.showModal();
    window.addEventListener('keydown', onKey);
  } else if (index === null && dialog.open) {
    dialog.close();
  }
  if (index === null) window.removeEventListener('keydown', onKey);
});

onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.lightbox {
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: clamp(16px, 4vw, 64px);
  border: 0;
  background: transparent;
  color: #efeef3;
}

.lightbox[open] {
  display: grid;
  place-items: center;
}

.lightbox::backdrop {
  background: rgba(8, 8, 11, .9);
}

.lightbox__figure {
  display: grid;
  gap: 14px;
  max-width: min(1400px, 100%);
  margin: 0;
}

.lightbox__figure img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: calc(100dvh - 160px);
  margin: 0 auto;
  border-radius: var(--arc-r-md, 10px);
}

.lightbox__caption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 24px;
  font-size: var(--arc-fs-small, 14px);
}

.lightbox__credit strong {
  font-weight: 600;
}

.lightbox__source {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #efeef3;
  font-weight: 600;
  text-decoration: none;
}

.lightbox__source:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.lightbox__icon {
  width: 18px;
  height: 18px;
}

.lightbox__nav,
.lightbox__close {
  position: fixed;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .1);
  color: #efeef3;
  cursor: pointer;
}

.lightbox__nav:hover,
.lightbox__close:hover {
  background: rgba(255, 255, 255, .2);
}

.lightbox__nav:focus-visible,
.lightbox__close:focus-visible,
.lightbox__source:focus-visible {
  outline: 2px solid #efeef3;
  outline-offset: 3px;
}

.lightbox__nav {
  top: 50%;
  translate: 0 -50%;
}

.lightbox__nav--prev { left: clamp(8px, 2vw, 24px); }
.lightbox__nav--next { right: clamp(8px, 2vw, 24px); }

.lightbox__close {
  top: clamp(8px, 2vw, 24px);
  right: clamp(8px, 2vw, 24px);
}

@media (max-width: 600px) {
  .lightbox__nav {
    top: auto;
    bottom: 16px;
    translate: none;
  }
}
</style>
