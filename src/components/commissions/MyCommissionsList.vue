<template>
  <div class="my-commissions">
    <div class="list-header">
      <span class="list-eyebrow">{{ t('commissions.mine.eyebrow') }}</span>
      <h3 class="list-title">{{ t('commissions.mine.title') }}</h3>
    </div>

    <div v-if="loading" class="state-block">
      <div class="loading-sigil"></div>
    </div>

    <div v-else-if="commissions.length === 0" class="state-block empty">
      <i class="fa-solid fa-scroll empty-icon"></i>
      <p>{{ t('commissions.mine.empty') }}</p>
    </div>

    <div v-else class="commission-entries">
      <div v-for="c in commissions" :key="c.id" class="commission-entry">
        <div class="entry-indicator" :class="`indicator-${c.status.toLowerCase()}`"></div>
        <div class="entry-main">
          <div class="entry-top-row">
            <span class="type-tag">{{ formatChangeSummary(c.majorChanges.length, c.minorChanges.length, t) }}</span>
            <CommissionStatusBadge :status="c.status"/>
          </div>

          <div class="entry-meta">
            <span>{{ t('commissions.mine.slotsUsed') }}: {{ c.linkedSlotCount }}</span>
            <span v-if="c.commissionsRequired">
              {{ t('commissions.mine.slotsRequired') }}: {{ c.commissionsRequired }}
            </span>
            <span class="entry-date">{{ formatNotificationDate(c.createdAt, locale) }}</span>
          </div>

          <div v-if="c.staffNotes" class="entry-details">
            <button class="details-trigger" :class="{ 'is-active': expanded.has(c.id) }" @click="toggle(c.id)">
              <span>{{ t('commissions.mine.staffNotes') }}</span>
              <i class="fa-solid fa-caret-down"></i>
            </button>
            <Transition name="expand">
              <p v-if="expanded.has(c.id)" class="staff-notes-text">{{ c.staffNotes }}</p>
            </Transition>
          </div>

          <div class="entry-actions">
            <RouterLink :to="$lp(`/commissions/${c.id}`)" class="view-details-btn">
              {{ t('commissions.mine.viewDetails') }}
            </RouterLink>
            <button v-if="c.status === 'RESCOPE_REQUIRED'" class="resubmit-btn" @click="resubmit(c.id)">
              {{ t('commissions.mine.resubmit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from '@/composables/useI18n';
import {commissionsAPI} from '@/utils/api/commissions';
import {formatNotificationDate} from '@/utils/notifications';
import {formatChangeSummary} from '@/utils/commissionSummary';
import CommissionStatusBadge from '@/components/commissions/CommissionStatusBadge.vue';
import type {CommissionResponseDto} from '@/types/commissions';

const router = useRouter();
const {t, intlLocale} = useI18n();

const loading = ref(false);
const commissions = ref<CommissionResponseDto[]>([]);
const expanded = ref<Set<string>>(new Set());
const locale = intlLocale;

const load = async () => {
  loading.value = true;
  try {
    const response = await commissionsAPI.getMine();
    commissions.value = response.data;
  } finally {
    loading.value = false;
  }
};

const toggle = (id: string) => {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
};

const resubmit = (id: string) => {
  router.push({path: '/commissions', query: {resubmit: id}});
};

defineExpose({reload: load});

onMounted(load);
</script>

<style scoped>
.my-commissions {
  margin-top: 40px;
}

.list-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgb(var(--mcl-ffffff) / 0.05);
}

.list-eyebrow {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.list-title {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: var(--myst-offwhite);
}

.state-block {
  padding: 40px 0;
  text-align: center;
  color: rgb(var(--mcl-666666));
}

.state-block.empty .empty-icon {
  font-size: 26px;
  color: rgb(var(--mcl-444444));
  margin-bottom: 12px;
  display: block;
}

.loading-sigil {
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border: 2px solid rgb(var(--mcl-c8b273) / 0.2);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.commission-entries {
  display: grid;
  gap: 16px;
}

.commission-entry {
  position: relative;
  background: rgb(var(--mcl-ffffff) / 0.02);
  border: 1px solid rgb(var(--mcl-ffffff) / 0.05);
}

.entry-indicator {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: rgb(var(--mcl-555555));
}

.indicator-pending_review {
  background: rgb(var(--mcl-fbbf24));
}

.indicator-approved {
  background: rgb(var(--mcl-34d399));
}

.indicator-rejected {
  background: rgb(var(--mcl-f87171));
}

.indicator-rescope_required {
  background: rgb(var(--mcl-60a5fa));
}

.indicator-completed {
  background: rgb(var(--mcl-a78bfa));
}

.entry-main {
  padding: 18px 20px 18px 24px;
}

.entry-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.type-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 10px;
  background: rgb(var(--mcl-ffffff) / 0.05);
  color: rgb(var(--mcl-888888));
}

.entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: rgb(var(--mcl-666666));
  margin-bottom: 4px;
}

.entry-date {
  font-family: 'JetBrains Mono', monospace;
}

.entry-details {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgb(var(--mcl-ffffff) / 0.05);
}

.details-trigger {
  background: none;
  border: none;
  color: rgb(var(--mcl-666666));
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s ease;
}

.details-trigger:hover,
.details-trigger.is-active {
  color: var(--myst-gold);
}

.staff-notes-text {
  margin: 12px 0 0;
  padding: 12px;
  background: rgb(var(--mcl-000000) / 0.3);
  font-size: 12px;
  color: rgb(var(--mcl-cccccc));
  line-height: 1.6;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.entry-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.view-details-btn,
.resubmit-btn {
  padding: 8px 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.view-details-btn {
  background: rgb(var(--mcl-ffffff) / 0.03);
  border: 1px solid rgb(var(--mcl-ffffff) / 0.1);
  color: rgb(var(--mcl-aaaaaa));
}

.view-details-btn:hover {
  border-color: var(--myst-gold);
  color: var(--myst-gold);
}

.resubmit-btn {
  background: rgb(var(--mcl-60a5fa) / 0.1);
  border: 1px solid rgb(var(--mcl-60a5fa) / 0.3);
  color: rgb(var(--mcl-60a5fa));
}

.resubmit-btn:hover {
  background: rgb(var(--mcl-60a5fa));
  color: rgb(var(--mcl-05070a));
}

/* Light theme: the faded eyebrow would drop under 4.5:1 on the paper. */
:root[data-theme="parchment"] .list-eyebrow {
  opacity: 1;
}
</style>

<style>
/* Colour literals of the scoped styles above, as theme tokens (RGB triplets, used as
   rgb(var(--x) / alpha)): the dark values are the original literals, the light theme
   re-points them. Global so teleported content (modals) resolves them too. */
:root {
    --mcl-000000: 0 0 0;
    --mcl-05070a: 5 7 10;
    --mcl-34d399: 52 211 153;
    --mcl-444444: 68 68 68;
    --mcl-555555: 85 85 85;
    --mcl-60a5fa: 96 165 250;
    --mcl-666666: 102 102 102;
    --mcl-888888: 136 136 136;
    --mcl-a78bfa: 167 139 250;
    --mcl-aaaaaa: 170 170 170;
    --mcl-c8b273: 200 178 115;
    --mcl-cccccc: 204 204 204;
    --mcl-f87171: 248 113 113;
    --mcl-fbbf24: 251 191 36;
    --mcl-ffffff: 255 255 255;
}

:root[data-theme="parchment"] {
    --mcl-000000: 255 255 255;
    --mcl-05070a: 255 255 255;
    --mcl-34d399: 0 111 77;
    --mcl-444444: 120 118 128;
    --mcl-555555: 85 83 94;
    --mcl-60a5fa: 0 73 177;
    --mcl-666666: 85 83 94;
    --mcl-888888: 85 83 94;
    --mcl-a78bfa: 108 77 182;
    --mcl-aaaaaa: 85 83 94;
    --mcl-c8b273: 180 44 62;
    --mcl-cccccc: 23 22 28;
    --mcl-f87171: 178 48 56;
    --mcl-fbbf24: 124 91 0;
    --mcl-ffffff: 23 22 28;
}
</style>

