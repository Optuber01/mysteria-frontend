<template>
  <!--
    A region that opens and shuts under its trigger, eased both ways (.arc-collapse in
    arcana.css). The trigger keeps its own aria-expanded and aria-controls; id, role and
    labels given here land on the region. `lazy` keeps the content out of the page while
    shut (as v-if did), mounting it to open and dropping it once the close has played.
    For a <details>, use the .arc-details classes instead.
  -->
  <div class="arc-collapse" :class="{'is-open': open, 'is-moving': moving}" @transitionend="onEnd">
    <div class="arc-collapse__inner">
      <slot v-if="mounted"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from 'vue';

const props = withDefaults(defineProps<{open: boolean; lazy?: boolean}>(), {lazy: false});

const moving = ref(false);
const mounted = ref(!props.lazy || props.open);

// longer than --arc-dur-2: the close still ends if no transitionend comes (a hidden tab)
const FALLBACK = 400;
let timer = 0;

const settle = () => {
  window.clearTimeout(timer);
  moving.value = false;
  if (props.lazy && !props.open) mounted.value = false;
};

watch(() => props.open, open => {
  if (open) mounted.value = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return settle();
  moving.value = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(settle, FALLBACK);
});

const onEnd = (event: TransitionEvent) => {
  if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') settle();
};

onBeforeUnmount(() => window.clearTimeout(timer));
</script>
