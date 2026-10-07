<template>
  <Analytics/>
  <!-- first stop for the keyboard: past the header to the page itself (WCAG 2.4.1) -->
  <a class="skip-link" href="#main-content" @click.prevent="skipToMain">{{ t('header.skip') }}</a>
  <div class="app">
    <NotificationContainer/>

    <!-- Main Content -->
    <RouterView/>
  </div>
</template>

<script lang="ts" setup>
import NotificationContainer from "@/components/ui/NotificationContainer.vue";
import {onMounted, watch} from "vue";
import {RouterView, useRoute} from "vue-router";
import {useBalanceWatcher} from "@/stores/balance";
import {useUserWatcher} from "./stores/user";
import {useServicesWatcher} from "./stores/services";
import {useDailyBonusWatcher} from "./stores/dailyBonus";
import {useAccountNotificationsWatcher} from "./stores/notifications";
import {Analytics} from '@vercel/analytics/vue';
import {applyTheme, readSavedTheme} from "@/composables/useTheme";
import {useI18n} from "@/composables/useI18n";
import {useArcana} from "@/components/home-arcana/useArcana";
import {fillAccent, inkAccent} from "@/components/home-arcana/accentInk";

useUserWatcher();
useBalanceWatcher();
useServicesWatcher();
useDailyBonusWatcher();
useAccountNotificationsWatcher();

const {t} = useI18n();
/* Every page has one <main>: focus it (it takes focus only from here) and bring it into view. */
function skipToMain() {
  const main = document.querySelector<HTMLElement>('main');
  if (!main) return;
  if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  main.focus({preventScroll: true});
  main.scrollIntoView({block: 'start', behavior: 'instant'});
}
const route = useRoute();
/*
 * The drawn card's accent colours every page (assets/arcana.css: --acc), the neutral
 * crimson before a draw. On paper text and solid controls use it deepened for contrast.
 */
const {card} = useArcana();
watch(() => card.value.accent, accent => {
  const style = document.body.style;
  style.setProperty('--acc', accent);
  style.setProperty('--acc-deep', inkAccent(accent));
  style.setProperty('--acc-fill', fillAccent(accent));
}, {immediate: true});

// Force scroll to top on every route change.
// `behavior: "instant"` overrides the global `scroll-behavior: smooth`, which
// would otherwise animate the whole page back to the top on every navigation -
// on a long page that reads as the site lagging behind the click.
watch(() => route.path, () => {
  // Use requestAnimationFrame to ensure it happens after DOM updates
  requestAnimationFrame(() => {
    window.scrollTo({top: 0, left: 0, behavior: "instant"});
  });
}, {immediate: false});

onMounted(() => {
  // The saved light/dark choice (index.html already applied it before first paint).
  applyTheme(readSavedTheme());
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
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
