<template>
  <div v-if="authStore.isAuthenticated" ref="rootRef" class="notif-wrapper">
    <button
        ref="triggerRef"
        :aria-controls="menuId"
        :aria-expanded="isOpen"
        :class="{ active: isOpen }"
        :title="t('notifications.title')"
        aria-haspopup="dialog"
        class="notif-trigger"
        type="button"
        @click.stop="toggle"
    >
      <i aria-hidden="true" class="fa-solid fa-bell"></i>
      <span class="arc-sr">{{ t('notifications.title') }}</span>
      <span v-if="unreadCount > 0" class="notif-badge">{{ badgeLabel }}</span>
    </button>

    <!-- kept in the page while shut (hidden from all), so it eases out as it eased in -->
    <div
        :id="menuId"
        ref="menuRef"
        :aria-labelledby="titleId"
        :class="{ 'is-open': isOpen, 'arc-popover--up': opensUp }"
        :style="fit"
        class="notif-menu arc-popover"
        role="dialog"
    >
      <div class="notif-menu-header">
        <span :id="titleId" class="notif-menu-title">{{ t('notifications.title') }}</span>
        <button v-if="unreadCount > 0" class="notif-mark-all" type="button" @click="handleMarkAllRead">
          {{ t('notifications.markAllRead') }}
        </button>
      </div>

      <ArcSwap class="notif-body">
        <div v-if="(store.isLoading || !fetched) && items.length === 0" key="loading" class="notif-state" role="status">
          <span aria-hidden="true" class="notif-spinner"></span>
          <span class="arc-sr">{{ t('loading') }}</span>
        </div>

        <div v-else-if="items.length === 0" key="empty" class="notif-state">
          {{ t('notifications.empty') }}
        </div>

        <ul v-else key="list" class="notif-list arc-rows">
          <li
              v-for="item in items"
              :key="item.id"
              :class="{ unread: !item.read }"
              class="arc-row notif-item"
              @click="handleItemClick(item)"
          >
            <i :class="notificationIcon(item.type)" aria-hidden="true" class="notif-item-icon"></i>
            <div class="notif-item-body">
              <p class="notif-item-text">
                <span v-if="!item.read" class="arc-sr">{{ t('notifications.unread') }}: </span>{{ buildNotificationText(item, t) }}
              </p>
              <span class="notif-item-date">{{ formatDate(item.createdAt) }}</span>
              <button v-if="item.actionable" class="arc-btn arc-btn--ghost arc-btn--sm notif-item-cta" type="button" @click.stop="handleAction(item)">
                {{ notificationCtaLabel(item, t) }}
              </button>
            </div>
          </li>
        </ul>
      </ArcSwap>

      <RouterLink :to="$lp('/notifications')" class="notif-view-all" @click="close">
        {{ t('notifications.viewAll') }}
      </RouterLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, onUnmounted, ref, useId} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth';
import {useAccountNotificationsStore} from '@/stores/notifications';
import {useI18n} from '@/composables/useI18n';
import ArcSwap from '@/components/arcana/ArcSwap.vue';
import {
  buildNotificationText,
  notificationCtaLabel,
  notificationIcon,
  notificationTargetRoute,
} from '@/utils/notifications';
import type {NotificationDto} from '@/types/notifications';

const router = useRouter();
const authStore = useAuthStore();
const store = useAccountNotificationsStore();
const {t, intlLocale} = useI18n();

const uid = useId();
const menuId = `notif-menu-${uid}`;
const titleId = `notif-title-${uid}`;

const isOpen = ref(false);
// until the first fetch has come back, an empty list means "not here yet", not "nothing"
const fetched = ref(false);
// in the drawer the bell sits at the bottom of the screen: its list opens upwards, and
// stays inside the drawer (which clips what runs past its edge)
const opensUp = ref(false);
const fit = ref<Record<string, string> | undefined>();
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

const items = computed(() => store.items);
const unreadCount = computed(() => store.unreadCount);
const badgeLabel = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)));
// date and minutes: the full stamp (with seconds) is too long for a row
const formatDate = (iso: string) => new Date(iso).toLocaleString(intlLocale.value, {dateStyle: 'medium', timeStyle: 'short'});

// the list takes the drawer footer's full width (as wide as the address chip above the bell)
const fitToDrawer = () => {
  const row = rootRef.value?.parentElement;
  if (!row || !rootRef.value) return;
  const edge = row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight);
  fit.value = {maxWidth: `${Math.ceil(edge - rootRef.value.getBoundingClientRect().left) + 1}px`};
};

const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    if (opensUp.value) fitToDrawer();
    void store.fetchPage(0, 8).finally(() => (fetched.value = true));
  }
};

// Shutting from inside the list (Escape, a link, a button) hands focus back to the bell,
// as the list is hidden from the tab order the moment it is shut.
const close = () => {
  if (!isOpen.value) return;
  const focusInside = menuRef.value?.contains(document.activeElement);
  isOpen.value = false;
  if (focusInside) triggerRef.value?.focus();
};

const handleMarkAllRead = async () => {
  await store.markAllRead();
  // the button is gone once nothing is unread: focus goes to the bell, not to the page
  await nextTick();
  if (document.activeElement === document.body) triggerRef.value?.focus();
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
  close();
};

const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

onMounted(() => {
  opensUp.value = !!rootRef.value?.closest('.mobile-nav');
  window.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.notif-wrapper {
  position: relative;
}

/* a header control: the bar's 36px square at the 10px radius, one hover with the others */
.notif-trigger {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: var(--arc-bw) solid var(--arc-line);
  border-radius: 10px;
  background: var(--arc-glass);
  color: var(--arc-ink);
  font-size: 15px;
  cursor: pointer;
  transition:
    color var(--arc-dur-2) var(--arc-ease),
    background-color var(--arc-dur-2) var(--arc-ease),
    border-color var(--arc-dur-2) var(--arc-ease),
    transform var(--arc-dur-2) var(--arc-ease);
}

.notif-trigger:hover,
.notif-trigger.active {
  border-color: var(--arc-line-hot);
  background: color-mix(in oklab, var(--acc) 10%, transparent);
}

.notif-trigger:hover {
  transform: translateY(-2px);
}

.notif-trigger:active {
  transform: scale(.98);
}

.notif-trigger:focus-visible {
  border-radius: 10px;
}

/* the count: a small square-cornered mark in the accent, never a pill */
.notif-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--arc-r-sm);
  background: var(--acc-solid);
  box-shadow: 0 0 0 2px var(--arc-bg);
  color: var(--arc-on-acc);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* ---- the list ---- */
.notif-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1200;
  width: 360px;
  max-width: calc(100vw - 32px);
  --arc-popover-origin: top right;
  border-radius: var(--arc-r-md);
  /* opaque: the page behind must not show through the list */
  background: var(--arc-surface);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 18px 48px var(--arc-shadow);
  color: var(--arc-ink);
  text-align: left;
}

.notif-menu.arc-popover--up {
  --arc-popover-origin: bottom left;
  top: auto;
  right: auto;
  bottom: calc(100% + 8px);
  left: 0;
}

.notif-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 8px 8px 18px;
  border-bottom: var(--arc-bw) solid var(--arc-line);
}

.notif-menu-title {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 16px;
  font-weight: 600;
}

.notif-mark-all {
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: none;
  color: var(--acc-ink);
  font: inherit;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--arc-dur-2) var(--arc-ease);
}

.notif-mark-all:hover {
  background: var(--arc-glass);
}

.notif-state {
  display: grid;
  place-items: center;
  min-height: 96px;
  padding: 28px 18px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  text-align: center;
}

.notif-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--arc-line);
  border-top-color: var(--acc-ink);
  border-radius: 50%;
  animation: notif-spin 1s linear infinite;
}

.notif-list {
  max-height: min(380px, 60vh);
  padding: 0 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.notif-item {
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  cursor: pointer;
}

.notif-item-icon {
  flex: none;
  width: 16px;
  padding-top: 3px;
  color: var(--arc-muted);
  font-size: 13px;
  text-align: center;
}

.notif-item.unread .notif-item-icon {
  color: var(--acc-ink);
}

.notif-item-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.notif-item-text {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.notif-item.unread .notif-item-text {
  color: var(--arc-ink);
  font-weight: 600;
}

.notif-item-date {
  color: var(--arc-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.notif-item-cta {
  min-height: 34px;
  margin-top: 6px;
  padding: 0 14px;
  font-size: var(--arc-fs-small);
}

.notif-view-all {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-top: var(--arc-bw) solid var(--arc-line);
  border-radius: 0 0 var(--arc-r-md) var(--arc-r-md);
  color: var(--arc-ink);
  font-size: var(--arc-fs-small);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--arc-dur-2) var(--arc-ease), background-color var(--arc-dur-2) var(--arc-ease);
}

.notif-view-all:hover {
  background: var(--arc-glass);
  color: var(--acc-ink);
}

/* against the list's edge and the rounded foot a ring drawn outside would be cut off */
.notif-menu :is(.notif-view-all, .notif-mark-all):focus-visible {
  outline-offset: -2px;
}

@keyframes notif-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .notif-trigger:hover,
  .notif-trigger:active {
    transform: none;
  }

  /* a static ring: still reads as "loading", nothing turns */
  .notif-spinner {
    animation: none;
  }
}
</style>
