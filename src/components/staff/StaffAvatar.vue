<template>
  <img
      v-if="src && !failed"
      :src="src"
      :width="size"
      :height="size"
      alt=""
      class="staff-avatar"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
  >
  <span v-else class="staff-avatar staff-avatar--initial" :style="{width: `${size}px`, height: `${size}px`}" aria-hidden="true">
    {{ initialOf(name) }}
  </span>
</template>

<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {avatarSrc, initialOf} from "./staffRoster";

// Decorative: the name always sits beside it, so the image carries no alt text of its own.
const props = defineProps<{url: string | null | undefined; name: string; size: number}>();

const failed = ref(false);
const src = computed(() => avatarSrc(props.url));
watch(src, () => { failed.value = false; });
</script>

<style scoped>
.staff-avatar {
  flex: none;
  display: block;
  border-radius: var(--arc-r-sm);
  object-fit: cover;
  background: var(--arc-glass);
}

.staff-avatar--initial {
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--acc-ink);
  font-size: .9em;
  font-weight: 700;
  line-height: 1;
}
</style>
