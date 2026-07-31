<template>
  <Analytics/>
  <div class="app">
    <MysticBackground v-if="!isHome"/>
    <NotificationContainer v-if="!isHome"/>

    <!-- Main Content -->
    <RouterView/>
  </div>
  <div v-if="!isHome" ref="cursor" class="cursor-background"></div>
</template>

<script lang="ts" setup>
import {computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch} from "vue";
import {RouterView, useRoute} from "vue-router";
import {Analytics} from '@vercel/analytics/vue';

const NotificationContainer = defineAsyncComponent(() => import('@/components/ui/NotificationContainer.vue'));
const MysticBackground = defineAsyncComponent(() => import('@/components/ui/MysticBackground.vue'));

const route = useRoute();
const isHome = computed(() => route.path === '/');
let routeWatchersStarted = false;

watch(() => route.path, (path) => {
  if (path === '/' || routeWatchersStarted) return;
  routeWatchersStarted = true;
  void Promise.all([
    import('@/stores/auth'),
    import('@/stores/user'),
    import('@/stores/balance'),
    import('@/stores/services'),
    import('@/stores/dailyBonus'),
    import('@/stores/notifications'),
  ]).then(([auth, user, balance, services, dailyBonus, notifications]) => {
    void auth.useAuthStore().init();
    user.useUserWatcher();
    balance.useBalanceWatcher();
    services.useServicesWatcher();
    dailyBonus.useDailyBonusWatcher();
    notifications.useAccountNotificationsWatcher();
  });
}, { immediate: true });

// Force scroll to top on every route change
watch(() => route.path, () => {
  // Use requestAnimationFrame to ensure it happens after DOM updates
  requestAnimationFrame(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}, {immediate: false});

const cursor = ref<HTMLDivElement | null>(null);
const cursorSize = 50;
let rafId: number | null = null;

const updateCursorPosition = (event: MouseEvent) => {
  if (cursor.value && !rafId) {
    rafId = requestAnimationFrame(() => {
      if (cursor.value) {
        const halfSize = cursorSize / 2;
        const x = Math.min(
            Math.max(event.pageX - halfSize, 0),
            window.innerWidth - cursorSize,
        );
        const y = Math.min(
            Math.max(event.pageY - halfSize, 0),
            document.documentElement.scrollHeight - cursorSize,
        );

        // Use transform instead of left/top for better performance
        cursor.value.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      rafId = null;
    });
  }
};

onMounted(() => {
  // Always force dark theme for the mystical aesthetic
  document.documentElement.dataset.theme = "dark";

  document.addEventListener("mousemove", updateCursorPosition);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", updateCursorPosition);
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
}

.cursor-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  background-color: var(--myst-gold);
  filter: blur(20px);
  border-radius: 50%;
  pointer-events: none;
  z-index: -2;
  opacity: 0.3;
  will-change: transform;
}

@media (max-width: 576px) {
  .cursor-background {
    display: none;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes progress {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}

@keyframes shimmer {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
