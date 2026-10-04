<template>
  <div class="admin-commissions-list">
    <!-- Header -->
    <div class="page-header">
      <button class="back-button" @click="router.push('/profile')">
        <svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>
      <div class="header-identity">
        <div class="header-badge">
          <i class="fa-solid fa-scroll"></i>
        </div>
        <h1 class="page-title">Commission Requests</h1>
      </div>
    </div>

    <div class="section">
      <div class="controls">
        <div class="status-tabs">
          <button
              v-for="opt in statusTabs"
              :key="opt.value"
              :class="{ active: statusFilter === opt.value }"
              class="status-tab"
              @click="selectStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button :disabled="loading" class="refresh-btn" @click="loadCommissions">
          <svg fill="none" height="15" stroke="currentColor" viewBox="0 0 24 24" width="15">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      <div class="table-wrap">
        <table v-if="commissions.length > 0" class="commission-table">
          <thead>
          <tr>
            <th>Player</th>
            <th>Type</th>
            <th>Target / Summary</th>
            <th>Status</th>
            <th>Submitted</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="c in commissions" :key="c.id" class="commission-row" @click="openDetail(c.id)">
            <td>{{ c.playerIgn }}</td>
            <td>
              <span class="type-badge">{{ formatTypeSummary(c) }}</span>
            </td>
            <td class="summary-cell">
              <span>{{ formatTargetSummary(c) }}</span>
              <span v-if="c.touchesExistingCommission" class="warning-badge"
                    title="This target has been commissioned before">
                <i class="fa-solid fa-triangle-exclamation"></i>
              </span>
            </td>
            <td>
              <span :class="`status-${c.status.toLowerCase()}`" class="status-badge">{{ formatStatus(c.status) }}</span>
            </td>
            <td class="date-cell">{{ formatDate(c.createdAt) }}</td>
            <td class="chevron-cell">
              <i class="fa-solid fa-chevron-right"></i>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-else-if="!loading" class="no-items">
          No commission requests found{{ statusFilter ? ` for status "${formatStatus(statusFilter)}"` : '' }}.
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        Loading commissions...
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {commissionsAPI} from '@/utils/api/commissions';
import {COMMISSION_STATUSES} from '@/types/commissions';
import type {AdminCommissionResponseDto, CommissionStatus} from '@/types/commissions';

const router = useRouter();

const commissions = ref<AdminCommissionResponseDto[]>([]);
const statusFilter = ref<CommissionStatus | ''>('PENDING_REVIEW');
const loading = ref(false);

const statusTabs: { value: CommissionStatus | ''; label: string }[] = [
  {value: 'PENDING_REVIEW', label: 'Pending Review'},
  {value: 'APPROVED', label: 'Approved'},
  {value: 'RESCOPE_REQUIRED', label: 'Rescope Required'},
  {value: 'REJECTED', label: 'Rejected'},
  {value: 'COMPLETED', label: 'Completed'},
  {value: '', label: 'All'},
];

const formatStatus = (status: string): string =>
    COMMISSION_STATUSES.find((s) => s.value === status)?.label || status;

const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString();

const formatTypeSummary = (c: AdminCommissionResponseDto): string => {
  const parts: string[] = [];
  if (c.majorChanges.length > 0) parts.push(`${c.majorChanges.length} major`);
  if (c.minorChanges.length > 0) parts.push(`${c.minorChanges.length} minor`);
  return parts.join(', ') || '–';
};

const formatTargetSummary = (c: AdminCommissionResponseDto): string => {
  const parts: string[] = [];
  if (c.majorChanges.length > 0) {
    parts.push(c.majorChanges.map((m) => `${m.targetName} (${m.majorType})`).join('; '));
  }
  if (c.minorChanges.length > 0) {
    parts.push(`${c.minorChanges.length} minor change(s)`);
  }
  return parts.join(' + ');
};

const loadCommissions = async () => {
  loading.value = true;
  try {
    const response = await commissionsAPI.adminList(statusFilter.value || undefined);
    commissions.value = response.data;
  } finally {
    loading.value = false;
  }
};

const selectStatus = (status: CommissionStatus | '') => {
  statusFilter.value = status;
  loadCommissions();
};

const openDetail = (id: string) => {
  router.push(`/admin/commissions/${id}`);
};

loadCommissions();
</script>

<style scoped>
.admin-commissions-list {
  padding: 24px;
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--myst-bg-2);
  border: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--myst-ink-muted);
  transition: all 0.2s ease;
}

.back-button:hover {
  background: color-mix(in srgb, var(--myst-bg-2) 70%, var(--myst-gold));
  color: var(--myst-ink);
}

.header-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: color-mix(in srgb, var(--myst-gold) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--myst-gold) 40%, transparent);
  border-radius: 8px;
  color: var(--myst-gold);
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--myst-ink);
}

.section {
  margin-bottom: 28px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.status-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.status-tab {
  padding: 8px 14px;
  background: var(--myst-bg-2);
  border: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  border-radius: 7px;
  color: var(--myst-ink-muted);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab:hover {
  color: var(--myst-ink);
  border-color: color-mix(in srgb, var(--myst-ink-muted) 45%, transparent);
}

.status-tab.active {
  background: color-mix(in srgb, var(--myst-gold) 15%, transparent);
  border-color: var(--myst-gold);
  color: var(--myst-gold);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: var(--myst-gold);
  color: var(--myst-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--myst-gold-soft);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-wrap {
  background: var(--myst-bg-2);
  border: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

.commission-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.commission-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--myst-ink-muted);
  border-bottom: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
}

.commission-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.commission-row:hover {
  background: color-mix(in srgb, var(--myst-bg-2) 60%, var(--myst-gold));
}

.commission-row td {
  padding: 14px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--myst-ink-muted) 12%, transparent);
  color: var(--myst-ink);
  vertical-align: middle;
}

.commission-row:last-child td {
  border-bottom: none;
}

.summary-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--myst-ink-muted);
}

.type-badge,
.status-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.type-badge {
  background: color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  color: var(--myst-ink-muted);
}

.status-pending_review {
  background: color-mix(in srgb, rgb(var(--acl-f59e0b)) 25%, transparent);
  color: rgb(var(--acl-fbbf24));
}

.status-approved {
  background: color-mix(in srgb, rgb(var(--acl-10b981)) 25%, transparent);
  color: rgb(var(--acl-34d399));
}

.status-rejected {
  background: color-mix(in srgb, rgb(var(--acl-ef4444)) 25%, transparent);
  color: rgb(var(--acl-f87171));
}

.status-rescope_required {
  background: color-mix(in srgb, rgb(var(--acl-3b82f6)) 25%, transparent);
  color: rgb(var(--acl-60a5fa));
}

.status-completed {
  background: color-mix(in srgb, rgb(var(--acl-8b5cf6)) 25%, transparent);
  color: rgb(var(--acl-a78bfa));
}

.warning-badge {
  color: rgb(var(--acl-f59e0b));
  font-size: 12px;
  flex-shrink: 0;
}

.date-cell {
  color: var(--myst-ink-muted);
  white-space: nowrap;
}

.chevron-cell {
  color: var(--myst-ink-muted);
  text-align: right;
  width: 20px;
}

.no-items {
  padding: 48px 20px;
  text-align: center;
  color: var(--myst-ink-muted);
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 32px;
  color: var(--myst-ink-muted);
  font-size: 14px;
  background: var(--myst-bg-2);
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid color-mix(in srgb, var(--myst-ink-muted) 25%, transparent);
  border-top: 2px solid var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .table-wrap {
    overflow-x: auto;
  }

  .commission-table {
    min-width: 640px;
  }
}

/* Light theme: hover states as accent washes (mixing the accent into the paper at
   30-40% reads as a solid pink bar). */
:root[data-theme="parchment"] .back-button:hover,
:root[data-theme="parchment"] .commission-row:hover {
  background: var(--myst-wash);
}

:root[data-theme="parchment"] .status-tab.active {
  background: var(--myst-wash);
}

:root[data-theme="parchment"] .refresh-btn:disabled {
  opacity: 1;
  background: rgba(28, 24, 36, 0.1);
  color: var(--myst-ink-muted);
}
</style>

<style>
/* Colour literals of the scoped styles above, as theme tokens (RGB triplets, used as
   rgb(var(--x) / alpha)): the dark values are the original literals, the light theme
   re-points them. Global so teleported content (modals) resolves them too. */
:root {
    --acl-10b981: 16 185 129;
    --acl-34d399: 52 211 153;
    --acl-3b82f6: 59 130 246;
    --acl-60a5fa: 96 165 250;
    --acl-8b5cf6: 139 92 246;
    --acl-a78bfa: 167 139 250;
    --acl-ef4444: 239 68 68;
    --acl-f59e0b: 245 158 11;
    --acl-f87171: 248 113 113;
    --acl-fbbf24: 251 191 36;
}

:root[data-theme="parchment"] {
    --acl-10b981: 0 111 76;
    --acl-34d399: 0 85 58;
    --acl-3b82f6: 17 91 203;
    --acl-60a5fa: 0 73 143;
    --acl-8b5cf6: 114 62 215;
    --acl-a78bfa: 85 51 155;
    --acl-ef4444: 195 5 30;
    --acl-f59e0b: 137 85 0;
    --acl-f87171: 141 0 27;
    --acl-fbbf24: 97 70 0;
}
</style>

