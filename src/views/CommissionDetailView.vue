<template>
  <div class="page-container">
    <HeaderItem/>

    <main class="commission-detail-main">
      <div class="commission-detail-view">
        <div class="page-header">
          <button class="back-button" @click="router.push('/commissions')">
            <svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {{ t('back') || 'Back' }}
          </button>
          <div class="title-block">
            <h1 class="page-title">{{ t('commissions.detail.title') }}</h1>
          </div>
        </div>

        <div v-if="loading" class="state-block">
          <div class="loading-sigil"></div>
        </div>

        <div v-else-if="error" class="state-block empty">
          <i class="fa-solid fa-circle-exclamation empty-icon"></i>
          <p>{{ error }}</p>
        </div>

        <div v-else-if="commission" class="detail-card">
          <div class="detail-top-row">
            <span class="type-tag">{{
                formatChangeSummary(commission.majorChanges.length, commission.minorChanges.length, t)
              }}</span>
            <CommissionStatusBadge :status="commission.status"/>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>{{ t('commissions.mine.slotsUsed') }}</label>
              <span>{{ commission.linkedSlotCount }}</span>
            </div>
            <div v-if="commission.commissionsRequired" class="detail-item">
              <label>{{ t('commissions.mine.slotsRequired') }}</label>
              <span>{{ commission.commissionsRequired }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t('commissions.detail.submitted') }}</label>
              <span>{{ formatDate(commission.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t('commissions.detail.updated') }}</label>
              <span>{{ formatDate(commission.updatedAt) }}</span>
            </div>
          </div>

          <template v-if="commission.majorChanges.length > 0">
            <div v-for="(change, index) in commission.majorChanges" :key="`major-${index}`" class="detail-section">
              <label>{{ t('commissions.form.majorChangeLabel') }} #{{ index + 1 }} – {{ change.targetName }} –
                {{ t(`commissions.majorType.${change.majorType}`) }}</label>
              <p>{{ change.requestedChange }}</p>
              <p class="motivation-text">{{ t('commissions.form.motivationLabel') }}: {{ change.motivation }}</p>
              <p v-if="change.loreReference" class="motivation-text">{{ t('commissions.form.loreReferenceLabel') }}:
                {{ change.loreReference }}</p>
            </div>
          </template>

          <template v-if="commission.minorChanges.length > 0">
            <div v-for="(change, index) in commission.minorChanges" :key="`minor-${index}`" class="detail-section">
              <label>{{ t('commissions.form.minorChangeLabel') }} #{{ index + 1 }} – {{ change.targetName }}</label>
              <p>{{ change.changeDescription }}</p>
              <p class="motivation-text">{{ t('commissions.form.motivationLabel') }}: {{ change.motivation }}</p>
            </div>
          </template>

          <div v-if="!hasContentDetails" class="content-unavailable">
            {{ t('commissions.detail.contentUnavailable') }}
          </div>

          <div v-if="commission.staffNotes" class="staff-notice">
            <i class="fa-solid fa-circle-info"></i>
            <div>
              <strong>{{ t('commissions.mine.staffNotes') }}</strong>
              <p>{{ commission.staffNotes }}</p>
            </div>
          </div>

          <button v-if="commission.status === 'RESCOPE_REQUIRED'" class="resubmit-btn" @click="resubmit">
            {{ t('commissions.mine.resubmit') }}
          </button>
        </div>
      </div>
    </main>

    <FooterItem/>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from '@/composables/useI18n';
import {commissionsAPI} from '@/utils/api/commissions';
import {formatChangeSummary} from '@/utils/commissionSummary';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import CommissionStatusBadge from '@/components/commissions/CommissionStatusBadge.vue';
import type {CommissionResponseDto} from '@/types/commissions';

const route = useRoute();
const router = useRouter();
const {t} = useI18n();

const loading = ref(true);
const error = ref('');
const commission = ref<CommissionResponseDto | null>(null);

const hasContentDetails = computed(() => {
  if (!commission.value) return false;
  return commission.value.majorChanges.length > 0 || commission.value.minorChanges.length > 0;
});

const formatDate = (dateString: string): string => new Date(dateString).toLocaleString();

const resubmit = () => {
  if (commission.value) {
    router.push({path: '/commissions', query: {resubmit: commission.value.id}});
  }
};

onMounted(async () => {
  const id = route.params.id as string;
  loading.value = true;
  try {
    const response = await commissionsAPI.getById(id);
    if (!response.data) {
      error.value = t('commissions.detail.notFound');
    } else {
      commission.value = response.data;
    }
  } catch {
    error.value = t('commissions.detail.notFound');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.commission-detail-main {
  flex: 1 0 auto;
  background: var(--myst-bg);
  padding: 40px 0 60px;
}

.commission-detail-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgb(var(--cdv-ffffff) / 0.03);
  border: 1px solid rgb(var(--cdv-ffffff) / 0.08);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--cdv-888888));
  transition: all 0.2s ease;
}

.back-button:hover {
  color: var(--myst-gold);
  border-color: rgb(var(--cdv-c8b273) / 0.3);
}

.page-title {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: var(--myst-offwhite);
}

.state-block {
  padding: 80px 0;
  text-align: center;
  color: rgb(var(--cdv-666666));
}

.state-block.empty .empty-icon {
  font-size: 28px;
  color: rgb(var(--cdv-f87171));
  margin-bottom: 16px;
  display: block;
}

.loading-sigil {
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border: 2px solid rgb(var(--cdv-c8b273) / 0.2);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.detail-card {
  background: rgb(var(--cdv-0d101e) / 0.4);
  border: 1px solid rgb(var(--cdv-ffffff) / 0.05);
  padding: 32px;
  border-radius: 4px;
}

.detail-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgb(var(--cdv-ffffff) / 0.05);
}

.type-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 10px;
  background: rgb(var(--cdv-ffffff) / 0.05);
  color: rgb(var(--cdv-888888));
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(var(--cdv-666666));
  margin-bottom: 4px;
}

.detail-item span {
  font-size: 13px;
  color: rgb(var(--cdv-dddddd));
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--myst-gold);
  margin-bottom: 8px;
}

.detail-section p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgb(var(--cdv-dddddd));
  white-space: pre-wrap;
}

.motivation-text {
  margin-top: 6px !important;
  color: rgb(var(--cdv-999999)) !important;
  font-size: 12px !important;
}

.content-unavailable {
  padding: 16px;
  margin-bottom: 20px;
  background: rgb(var(--cdv-ffffff) / 0.02);
  border: 1px dashed rgb(var(--cdv-ffffff) / 0.1);
  color: rgb(var(--cdv-777777));
  font-size: 12.5px;
  text-align: center;
}

.staff-notice {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  background: rgb(var(--cdv-60a5fa) / 0.08);
  border-left: 3px solid rgb(var(--cdv-60a5fa));
  color: rgb(var(--cdv-cdd8ea));
  font-size: 13px;
}

.staff-notice i {
  color: rgb(var(--cdv-60a5fa));
  padding-top: 2px;
}

.staff-notice strong {
  display: block;
  margin-bottom: 4px;
  color: rgb(var(--cdv-93c5fd));
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.staff-notice p {
  margin: 0;
}

.resubmit-btn {
  padding: 10px 24px;
  background: rgb(var(--cdv-60a5fa) / 0.1);
  border: 1px solid rgb(var(--cdv-60a5fa) / 0.3);
  color: rgb(var(--cdv-60a5fa));
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.resubmit-btn:hover {
  background: rgb(var(--cdv-60a5fa));
  color: rgb(var(--cdv-05070a));
}

@media (max-width: 600px) {
  .commission-detail-main {
    padding: 90px 0 40px;
  }

  .commission-detail-view {
    padding: 0 16px;
  }

  .detail-card {
    padding: 20px;
  }
}
</style>

<style>
/* Colour literals of the scoped styles above, as theme tokens (RGB triplets, used as
   rgb(var(--x) / alpha)): the dark values are the original literals, the light theme
   re-points them. Global so teleported content (modals) resolves them too. */
:root {
    --cdv-05070a: 5 7 10;
    --cdv-0d101e: 13 16 30;
    --cdv-60a5fa: 96 165 250;
    --cdv-666666: 102 102 102;
    --cdv-777777: 119 119 119;
    --cdv-888888: 136 136 136;
    --cdv-93c5fd: 147 197 253;
    --cdv-999999: 153 153 153;
    --cdv-c8b273: 200 178 115;
    --cdv-cdd8ea: 205 216 234;
    --cdv-dddddd: 221 221 221;
    --cdv-f87171: 248 113 113;
    --cdv-ffffff: 255 255 255;
}

:root[data-theme="parchment"] {
    --cdv-05070a: 255 255 255;
    --cdv-0d101e: 255 255 255;
    --cdv-60a5fa: 0 73 177;
    --cdv-666666: 85 83 94;
    --cdv-777777: 85 83 94;
    --cdv-888888: 85 83 94;
    --cdv-93c5fd: 53 99 150;
    --cdv-999999: 85 83 94;
    --cdv-c8b273: 180 44 62;
    --cdv-cdd8ea: 23 22 28;
    --cdv-dddddd: 23 22 28;
    --cdv-f87171: 178 48 56;
    --cdv-ffffff: 23 22 28;
}
</style>

