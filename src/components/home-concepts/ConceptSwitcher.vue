<template>
  <aside v-if="visible" class="variant-switcher" :class="{ 'is-open': open }" aria-label="Homepage concepts">
    <button type="button" class="variant-switcher__toggle" :aria-expanded="open" @click="open = !open">
      Concepts
    </button>
    <div v-if="open" class="variant-switcher__panel">
      <label v-for="group in groups" :key="group.param">
        <span>{{ group.label }}</span>
        <select :value="current(group)" @change="choose(group.param, ($event.target as HTMLSelectElement).value)">
          <option v-for="variant in group.variants" :key="variant.id" :value="variant.id">{{ variant.label }}</option>
        </select>
      </label>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import type {HomeConcept} from './concepts';

type Group = { param: string; label: string; variants: readonly HomeConcept[] };

defineProps<{ groups: Group[] }>();

const route = useRoute();
const router = useRouter();
const open = ref(false);

/* Review tool for preview deployments only; production never shows it. */
const visible = typeof window !== 'undefined'
    && (!/(^|\.)mysterria\.net$/.test(window.location.hostname) || 'variants' in route.query);

function current(group: Group) {
  const wanted = route.query[group.param];
  return group.variants.some(variant => variant.id === wanted) ? wanted : group.variants[0].id;
}

function choose(param: string, id: string) {
  void router.replace({query: {...route.query, [param]: id}, hash: route.hash});
}
</script>

<style scoped>
.variant-switcher {
  position: fixed;
  z-index: 1500;
  left: 0;
  top: 50%;
  font: 500 .8rem/1.2 system-ui, sans-serif;
}

.variant-switcher__toggle {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.22);
  border-left: 0;
  border-radius: 0 999px 999px 0;
  opacity: .8;
  color: #f2f0eb;
  background: #16181d;
  font: 500 .72rem/1 ui-monospace, monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
}

.variant-switcher__panel {
  position: absolute;
  left: 8px;
  top: 40px;
  display: grid;
  gap: 12px;
  min-width: 230px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 12px;
  background: #0e1014;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}

.variant-switcher__panel label {
  display: grid;
  gap: 6px;
  color: #a9adb5;
}

.variant-switcher__panel select {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 8px;
  color: #f2f0eb;
  background: #16181d;
}

</style>
