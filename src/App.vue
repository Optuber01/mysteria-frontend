<template>
  <Analytics/>
  <div class="app">
    <MysticBackground/>
    <NotificationContainer/>

    <!-- Main Content -->
    <RouterView/>
  </div>
</template>

<script lang="ts" setup>
import NotificationContainer from "@/components/ui/NotificationContainer.vue";
import MysticBackground from "@/components/ui/MysticBackground.vue";
import {nextTick, onMounted, watch} from "vue";
import {RouterView, useRoute} from "vue-router";
import {useBalanceWatcher} from "@/stores/balance";
import {useUserWatcher} from "./stores/user";
import {useServicesWatcher} from "./stores/services";
import {useDailyBonusWatcher} from "./stores/dailyBonus";
import {useAccountNotificationsWatcher} from "./stores/notifications";
import {Analytics} from '@vercel/analytics/vue';

useUserWatcher();
useBalanceWatcher();
useServicesWatcher();
useDailyBonusWatcher();
useAccountNotificationsWatcher();

const route = useRoute();

const routeTitles: Record<string, string> = {
  home: 'Mysterria | Lord of the Mysteries Minecraft Server',
  shop: 'Store | Mysterria',
  rules: 'Rules | Mysterria',
  staff: 'Staff | Mysterria',
  terms: 'Terms of Service | Mysterria',
  privacy: 'Privacy Policy | Mysterria',
  sla: 'Service Level Agreement | Mysterria',
  guide: 'Player Guide | Mysterria',
  pathways: 'Pathways | Mysterria',
  login: 'Sign In | Mysterria',
  profile: 'Profile | Mysterria',
  notifications: 'Notifications | Mysterria',
  commissions: 'Commissions | Mysterria',
  'commission-detail': 'Commission Details | Mysterria',
  admin: 'Admin | Mysterria',
  'balance-tool': 'Balance Tool | Mysterria',
  'auth-callback': 'Signing In | Mysterria',
  'news-article': 'News | Mysterria',
  'news-article-localized': 'News | Mysterria',
  'service-detail': 'Service | Mysterria',
  edit: 'Editor | Mysterria',
  'edit-news': 'News Editor | Mysterria',
  'edit-services': 'Service Editor | Mysterria',
  'admin-commissions-list': 'Commission Requests | Mysterria',
  'admin-commissions-detail': 'Commission Request | Mysterria',
  logout: 'Sign Out | Mysterria',
  '404': 'Page Not Found | Mysterria',
};

watch(() => route.fullPath, async (fullPath, previousFullPath) => {
  await nextTick();
  document.title = routeTitles[String(route.name)] ?? 'Mysterria';

  const pathChanged = !previousFullPath
      || fullPath.split(/[?#]/, 1)[0] !== previousFullPath.split(/[?#]/, 1)[0];
  if (!pathChanged) return;

  requestAnimationFrame(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    if (!route.hash) document.querySelector<HTMLElement>('#main-content')?.focus({preventScroll: true});
  });
}, {immediate: true});

onMounted(() => {
  // Always force dark theme for the mystical aesthetic
  document.documentElement.dataset.theme = "dark";
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
}

</style>
