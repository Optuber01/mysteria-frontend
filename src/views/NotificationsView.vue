<template>
  <div class="page-container">
    <HeaderItem/>

    <main id="main-content" class="notifications-main" tabindex="-1">
    <div class="notifications-view">
    <div class="page-header">
      <button class="back-button" @click="router.push('/profile')">
        <svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {{ t('back') || 'Back' }}
      </button>
      <div class="title-block">
        <span class="eyebrow">{{ t('notifications.title') }}</span>
        <h1 class="page-title">{{ t('notifications.title') }}</h1>
      </div>
      <button v-if="store.unreadCount > 0" class="mark-all-btn" @click="store.markAllRead()">
        {{ t('notifications.markAllRead') }}
      </button>
    </div>

    <div v-if="store.isLoading && items.length === 0" aria-live="polite" class="state-block" role="status">
      <div aria-hidden="true" class="loading-sigil"></div>
      <p>{{ t('loading') || 'Loading notifications...' }}</p>
    </div>

    <div v-else-if="store.error" class="state-block empty" role="alert">
      <i aria-hidden="true" class="fa-solid fa-triangle-exclamation empty-icon"></i>
      <p>{{ store.error }}</p>
      <button ref="retryButton" class="mark-all-btn" type="button" @click="retryPage">{{ t('tryAgain') || 'Try again' }}</button>
    </div>

    <div v-else-if="items.length === 0" class="state-block empty">
      <i aria-hidden="true" class="fa-solid fa-bell-slash empty-icon"></i>
      <p>{{ t('notifications.empty') }}</p>
    </div>

    <div v-else class="notif-entries">
      <article
          v-for="item in items"
          :key="item.id"
          :class="{ unread: !item.read }"
          class="notif-entry"
      >
        <button :aria-label="buildNotificationText(item, t)" class="entry-main" type="button" @click="handleItemClick(item)">
          <div class="entry-indicator"></div>
          <i :class="notificationIcon(item.type)" aria-hidden="true" class="entry-icon"></i>
          <span class="entry-body">
            <span class="entry-text">{{ buildNotificationText(item, t) }}</span>
            <span class="entry-date">{{ formatNotificationDate(item.createdAt, locale) }}</span>
          </span>
        </button>
        <button v-if="item.actionable" class="entry-cta" @click.stop="handleAction(item)">
          {{ notificationCtaLabel(item, t) }}
        </button>
      </article>
    </div>

    <div v-if="store.totalPages > 1" class="pagination">
      <button
          :disabled="store.page === 0 || store.isLoading"
          class="pagination-btn"
          @click="goToPage(store.page - 1)"
      >
        <svg fill="none" height="14" stroke="currentColor" viewBox="0 0 24 24" width="14">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {{ t('previous') || 'Previous' }}
      </button>

      <div class="pagination-info">
        {{ t('page') || 'Page' }} {{ store.page + 1 }} / {{ store.totalPages }}
        <span class="total-count">({{ store.totalElements }} {{ t('total') || 'total' }})</span>
      </div>

      <button
          :disabled="store.page >= store.totalPages - 1 || store.isLoading"
          class="pagination-btn"
          @click="goToPage(store.page + 1)"
      >
        {{ t('next') || 'Next' }}
        <svg fill="none" height="14" stroke="currentColor" viewBox="0 0 24 24" width="14">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>
    </div>
    </main>

    <FooterItem/>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import {useAccountNotificationsStore} from '@/stores/notifications';
import {useI18n} from '@/composables/useI18n';
import {
  buildNotificationText,
  formatNotificationDate,
  notificationCtaLabel,
  notificationIcon,
  notificationTargetRoute,
} from '@/utils/notifications';
import type {NotificationDto} from '@/types/notifications';

const router = useRouter();
const store = useAccountNotificationsStore();
const {t, currentLanguage} = useI18n();

const items = computed(() => store.items);
const locale = computed(() => (currentLanguage.value === 'uk' ? 'uk-UA' : 'en-US'));
const retryButton = ref<HTMLButtonElement | null>(null);

const retryPage = async () => {
  await store.fetchPage(store.page, 20);
  if (store.error) {
    await nextTick();
    retryButton.value?.focus();
  }
};

const goToPage = (page: number) => {
  if (page >= 0 && page < store.totalPages) {
    store.fetchPage(page, 20);
  }
};

const handleItemClick = (item: NotificationDto) => {
  if (!item.read) store.markRead(item.id);
};

const handleAction = async (item: NotificationDto) => {
  await store.markRead(item.id);
  const target = notificationTargetRoute(item);
  if (target) {
    router.push(target);
  }
};

onMounted(() => {
  store.fetchPage(0, 20);
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.notifications-main {
  flex: 1 0 auto;
  background: var(--myst-bg);
  padding: 100px 0 60px;
  font-family: var(--font-body);
}

.notifications-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  transition: border-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
  font-family: var(--font-ui);
}

.back-button:hover {
  color: var(--myst-gold);
  border-color: rgba(200, 178, 115, 0.3);
}

.title-block {
  flex: 1;
}

.eyebrow {
  display: none;
}

.page-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--myst-offwhite);
}

.mark-all-btn {
  padding: 8px 16px;
  background: rgba(200, 178, 115, 0.1);
  border: 1px solid rgba(200, 178, 115, 0.3);
  color: var(--myst-gold);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
}

.mark-all-btn:hover {
  background: var(--myst-gold);
  color: #05070a;
}

.state-block {
  padding: 80px 0;
  text-align: center;
  color: var(--myst-ink-muted);
}

.state-block.empty .empty-icon {
  font-size: 32px;
  color: #444;
  margin-bottom: 16px;
  display: block;
}

.loading-sigil {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border: 2px solid rgba(200, 178, 115, 0.2);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.notif-entries {
  display: grid;
  gap: 12px;
}

.notif-entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px 18px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.entry-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.notif-entry:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(200, 178, 115, 0.2);
}

.notif-entry.unread {
  background: rgba(200, 178, 115, 0.04);
}

.entry-indicator {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: #333;
}

.notif-entry.unread .entry-indicator {
  background: var(--myst-gold);
}

.entry-icon {
  padding-top: 3px;
  font-size: 15px;
  color: var(--myst-gold);
  opacity: 0.8;
}

.entry-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.entry-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #ddd;
}

.entry-date {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.entry-cta {
  flex-shrink: 0;
  padding: 8px 16px;
  background: rgba(200, 178, 115, 0.1);
  border: 1px solid rgba(200, 178, 115, 0.3);
  color: var(--myst-gold);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
  white-space: nowrap;
}

.entry-cta:hover {
  background: var(--myst-gold);
  color: #05070a;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: var(--myst-gold);
  color: #05070a;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: background-color var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--myst-gold-soft);
}

.pagination-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #666;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  font-weight: 600;
  color: #ccc;
  text-align: center;
}

.total-count {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: #666;
}

@media (max-width: 600px) {
  .notifications-main {
    padding: 90px 0 40px;
  }

  .notifications-view {
    padding: 0 16px;
  }

  .notif-entry {
    flex-direction: column;
  }

  .entry-cta {
    align-self: flex-start;
  }
}
</style>
