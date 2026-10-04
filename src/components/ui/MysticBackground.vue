<template>
  <div class="mystic-background" aria-hidden="true">
    <!-- One wash is enough: the second layer was an identical .myst-fog stacked
         on top of the first, so it doubled a full-viewport paint for a change
         no one can see. -->
    <div class="myst-fog"></div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted} from "vue";
import {applyTheme, readSavedTheme} from "@/composables/useTheme";

/* localStorage['myst-theme']: 'parchment' is light, anything else dark (the header toggle writes it). */
onMounted(() => applyTheme(readSavedTheme()));
</script>

<style scoped>
.mystic-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* Two layers at 0.3 composited to 1 - 0.7² = 0.51, so the single layer keeps
   the exact same wash. */
.mystic-background .myst-fog {
  opacity: 0.51;
}

</style>
