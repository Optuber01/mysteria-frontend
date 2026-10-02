<template>
  <aside v-if="visible" class="variant-switcher" :class="{ 'is-open': open }" aria-label="Design variants">
    <button type="button" class="variant-switcher__toggle" :aria-expanded="open" @click="open = !open">
      Variants
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
import type {HomeVariant} from './useHomeVariant';

type Group = { param: string; label: string; variants: readonly HomeVariant[] };

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
  left: 16px;
  bottom: 16px;
  font: 500 .8rem/1.2 var(--font-body);
}

.variant-switcher__toggle {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--bone);
  background: var(--fog-2);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
}

.variant-switcher__panel {
  position: absolute;
  left: 0;
  bottom: 50px;
  display: grid;
  gap: 12px;
  min-width: 230px;
  padding: 14px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--fog-1);
  box-shadow: var(--shadow-deep);
}

.variant-switcher__panel label {
  display: grid;
  gap: 6px;
  color: var(--ash);
}

.variant-switcher__panel select {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--bone);
  background: var(--fog-2);
}
</style>
