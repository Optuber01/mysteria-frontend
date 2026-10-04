<template>
  <span :class="`status-${status.toLowerCase()}`" class="status-badge">{{ label }}</span>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {CommissionStatus} from '@/types/commissions';

const props = defineProps<{ status: CommissionStatus }>();
const {t} = useI18n();

const label = computed(() => t(`commissions.status.${props.status}`));
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.status-pending_review {
  background: color-mix(in srgb, rgb(var(--csb-f59e0b)) 25%, transparent);
  color: rgb(var(--csb-fbbf24));
}

.status-approved {
  background: color-mix(in srgb, rgb(var(--csb-10b981)) 25%, transparent);
  color: rgb(var(--csb-34d399));
}

.status-rejected {
  background: color-mix(in srgb, rgb(var(--csb-ef4444)) 25%, transparent);
  color: rgb(var(--csb-f87171));
}

.status-rescope_required {
  background: color-mix(in srgb, rgb(var(--csb-3b82f6)) 25%, transparent);
  color: rgb(var(--csb-60a5fa));
}

.status-completed {
  background: color-mix(in srgb, rgb(var(--csb-8b5cf6)) 25%, transparent);
  color: rgb(var(--csb-a78bfa));
}
</style>

<style>
/* Colour literals of the scoped styles above, as theme tokens (RGB triplets, used as
   rgb(var(--x) / alpha)): the dark values are the original literals, the light theme
   re-points them. Global so teleported content (modals) resolves them too. */
:root {
    --csb-10b981: 16 185 129;
    --csb-34d399: 52 211 153;
    --csb-3b82f6: 59 130 246;
    --csb-60a5fa: 96 165 250;
    --csb-8b5cf6: 139 92 246;
    --csb-a78bfa: 167 139 250;
    --csb-ef4444: 239 68 68;
    --csb-f59e0b: 245 158 11;
    --csb-f87171: 248 113 113;
    --csb-fbbf24: 251 191 36;
}

:root[data-theme="parchment"] {
    /* washes and labels deepened; labels reach >= 5.3:1 on their wash */
    --csb-10b981: 0 111 76;
    --csb-34d399: 0 85 58;
    --csb-3b82f6: 17 91 203;
    --csb-60a5fa: 0 73 143;
    --csb-8b5cf6: 114 62 215;
    --csb-a78bfa: 85 51 155;
    --csb-ef4444: 195 5 30;
    --csb-f59e0b: 137 85 0;
    --csb-f87171: 141 0 27;
    --csb-fbbf24: 97 70 0;
}
</style>

