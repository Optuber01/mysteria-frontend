<template>
  <div v-if="authStore.isAuthenticated" ref="dropdownRef" class="notif-ritual-wrapper">
    <button
        ref="triggerRef"
        :aria-expanded="isOpen"
        :aria-label="t('notifications.title')"
        :class="{ active: isOpen }"
        aria-controls="notification-popover"
        aria-haspopup="dialog"
        :title="t('notifications.title')"
        class="notif-ritual-trigger"
        type="button"
        @click.stop="toggle"
    >
      <i class="fa-solid fa-bell"></i>
      <span v-if="unreadCount > 0" class="notif-badge">{{ badgeLabel }}</span>
    </button>

    <Transition name="ritual-dropdown">
      <div v-if="isOpen" id="notification-popover" ref="menuRef" :aria-label="t('notifications.title')" class="notif-ritual-menu" role="dialog" @keydown.esc.stop="close(true)">
        <div class="notif-menu-header">
          <span class="notif-menu-title">{{ t('notifications.title') }}</span>
          <button v-if="unreadCount > 0" class="notif-mark-all" type="button" @click="handleMarkAllRead">
            {{ t('notifications.markAllRead') }}
          </button>
        </div>

        <div v-if="store.isLoading && items.length === 0" class="notif-loading">
          <div class="notif-spinner"></div>
        </div>

        <div v-else-if="store.error" class="notif-empty" role="alert">
          {{ store.error }}
          <button class="notif-mark-all" type="button" @click="store.fetchPage(0, 8)">{{ t('tryAgain') || 'Try again' }}</button>
        </div>

        <div v-else-if="items.length === 0" class="notif-empty">
          {{ t('notifications.empty') }}
        </div>

        <div v-else class="notif-list">
          <article
              v-for="item in items"
              :key="item.id"
              :class="{ unread: !item.read }"
              class="notif-item"
          >
            <button :aria-label="buildNotificationText(item, t)" class="notif-item-main" type="button" @click="handleItemClick(item)">
              <i :class="notificationIcon(item.type)" aria-hidden="true" class="notif-item-icon"></i>
              <span class="notif-item-body">
                <span class="notif-item-text">{{ buildNotificationText(item, t) }}</span>
                <span class="notif-item-date">{{ formatNotificationDate(item.createdAt, locale) }}</span>
              </span>
            </button>
            <button v-if="item.actionable" class="notif-item-cta" type="button" @click="handleAction(item)">
              {{ notificationCtaLabel(item, t) }}
            </button>
          </article>
        </div>

        <RouterLink class="notif-view-all" to="/notifications" @click="isOpen = false">
          {{ t('notifications.viewAll') }}
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth';
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
const authStore = useAuthStore();
const store = useAccountNotificationsStore();
const {t, currentLanguage} = useI18n();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

const items = computed(() => store.items);
const unreadCount = computed(() => store.unreadCount);
const badgeLabel = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)));
const locale = computed(() => (currentLanguage.value === 'uk' ? 'uk-UA' : 'en-US'));

const close = (restoreFocus = false) => {
  isOpen.value = false;
  if (restoreFocus) void nextTick(() => triggerRef.value?.focus());
};

const toggle = async () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    void store.fetchPage(0, 8);
    await nextTick();
    menuRef.value?.querySelector<HTMLElement>('button, a')?.focus();
  }
};

const handleMarkAllRead = () => store.markAllRead();

const handleItemClick = (item: NotificationDto) => {
  if (!item.read) store.markRead(item.id);
};

const handleAction = async (item: NotificationDto) => {
  await store.markRead(item.id);
  const target = notificationTargetRoute(item);
  if (target) {
    router.push(target);
  }
  close();
};

const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close();
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.notif-ritual-wrapper {
  position: relative;
}

.notif-ritual-trigger {
  position: relative;
  color: var(--myst-gold);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(200, 178, 115, 0.1);
  border: 1px solid rgba(200, 178, 115, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
  font-size: 15px;
}

.notif-ritual-trigger:hover,
.notif-ritual-trigger.active {
  background: var(--myst-gold);
  color: #05070a;
}

.notif-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff5252;
  color: #fff;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  border: 1px solid #080a14;
}

.notif-ritual-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: -12px;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: #080a14;
  border: 1px solid rgba(200, 178, 115, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.notif-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.notif-menu-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.notif-mark-all {
  background: none;
  border: none;
  color: var(--myst-gold);
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity var(--motion-base) var(--ease-standard);
}

.notif-mark-all:hover {
  opacity: 1;
}

.notif-loading,
.notif-empty {
  padding: 32px 16px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.notif-spinner {
  width: 20px;
  height: 20px;
  margin: 0 auto;
  border: 2px solid rgba(200, 178, 115, 0.2);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.notif-list {
  max-height: 380px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background-color var(--motion-base) var(--ease-standard);
}

.notif-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notif-item.unread {
  background: rgba(200, 178, 115, 0.04);
}

.notif-item-icon {
  width: 16px;
  padding-top: 2px;
  font-size: 13px;
  color: var(--myst-gold);
  opacity: 0.8;
  text-align: center;
  flex-shrink: 0;
}

.notif-item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.notif-item-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: #ddd;
}

.notif-item-date {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #555;
}

.notif-item-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.notif-item-cta {
  align-self: flex-start;
  margin-top: 4px;
  padding: 5px 12px;
  background: rgba(200, 178, 115, 0.1);
  border: 1px solid rgba(200, 178, 115, 0.3);
  border-radius: var(--radius-md);
  color: var(--myst-gold);
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
}

.notif-item-cta:hover {
  background: var(--myst-gold);
  color: #05070a;
}

.notif-view-all {
  display: block;
  padding: 12px 16px;
  text-align: center;
  color: #888;
  text-decoration: none;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: color var(--motion-base) var(--ease-standard);
}

.notif-view-all:hover {
  color: var(--myst-gold);
}

.ritual-dropdown-enter-active,
.ritual-dropdown-leave-active {
  transition: opacity var(--motion-base) var(--ease-enter), transform var(--motion-base) var(--ease-enter);
}

.ritual-dropdown-enter-from,
.ritual-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
