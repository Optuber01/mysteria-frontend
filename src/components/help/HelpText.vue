<template>
  <!-- Help copy marks commands with backticks (`/verify <code>`): they render as code, the rest as plain text. -->
  <component :is="tag"><template v-for="(part, index) in parts" :key="index"><code v-if="part.code">{{ part.text }}</code><template v-else>{{ part.text }}</template></template></component>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const props = withDefaults(defineProps<{text: string; tag?: string}>(), {tag: 'p'});

/* odd segments between backticks are commands */
const parts = computed(() =>
    props.text.split('`').map((text, index) => ({text, code: index % 2 === 1})).filter(part => part.text));
</script>
