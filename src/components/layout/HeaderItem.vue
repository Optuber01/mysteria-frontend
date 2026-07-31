<template>
  <a class="skip-link" href="#main-content">{{ labels.skipToContent }}</a>
  <header :class="{ scrolled: isScrolled, 'on-home': route.path === '/' }" class="site-header">
    <div class="header-frame">
      <RouterLink class="brand" to="/" aria-label="Mysterria home" @click="closeMobileNav">
        <IconLogo/>
        <span class="brand-copy">
          <strong>Mysterria</strong>
          <small>{{ labels.brandLine }}</small>
        </span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <RouterLink
            v-for="link in navigationLinks"
            :key="link.path"
            :aria-current="isActive(link.path) ? 'page' : undefined"
            :class="{ active: isActive(link.path) }"
            :to="link.path"
            class="nav-item"
        >
          {{ link.title }}
        </RouterLink>

        <div
            ref="exploreMenuRef"
            class="explore-menu"
            @focusin="clearCloseTimeout"
            @focusout="scheduleCloseExploreMenu"
            @keydown.esc="handleExploreEscape"
            @mouseenter="openExploreMenu"
            @mouseleave="scheduleCloseExploreMenu"
        >
          <button
              ref="exploreTriggerRef"
              :aria-expanded="isExploreOpen"
              class="nav-item explore-trigger"
              type="button"
              @click="toggleExploreMenu"
          >
            {{ labels.explore }}
            <span aria-hidden="true" class="chevron"></span>
          </button>

          <Transition name="menu-reveal">
            <div
                v-if="isExploreOpen"
                class="explore-dropdown"
                @mouseenter="clearCloseTimeout"
                @mouseleave="scheduleCloseExploreMenu"
            >
              <div class="dropdown-heading">
                <span>{{ labels.beyondWebsite }}</span>
                <strong>{{ labels.keepExploring }}</strong>
              </div>
              <a
                  v-for="service in serviceLinks"
                  :key="service.url"
                  :href="service.url"
                  class="service-link"
                  rel="noopener noreferrer"
                  target="_blank"
                  @click="closeExploreMenu"
              >
                <span class="service-index">{{ service.index }}</span>
                <span class="service-copy">
                  <strong>{{ service.name }}</strong>
                  <small>{{ service.description }}</small>
                </span>
                <span aria-hidden="true" class="service-arrow">↗</span>
              </a>
            </div>
          </Transition>
        </div>
      </nav>

      <div class="header-tools">
        <ServerStatusChip class="desktop-server-status"/>
        <LanguageSelector class="desktop-language"/>
        <BalanceButton class="desktop-account-tool"/>
        <NotificationBell class="desktop-account-tool"/>
        <AuthButton class="desktop-auth"/>

        <button
            ref="mobileMenuButtonRef"
            :aria-expanded="isMobileNavOpen"
            :aria-label="labels.openMenu"
            class="mobile-menu-button"
            type="button"
            @click="toggleMobileNav"
        >
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="mobile-menu">
      <div v-if="isMobileNavOpen" class="mobile-menu-layer">
        <button class="mobile-backdrop" :aria-label="labels.closeMenu" tabindex="-1" type="button" @click="closeMobileNav"></button>
        <aside
            ref="mobilePanelRef"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            class="mobile-panel"
            role="dialog"
            @keydown="handleMobileMenuKeydown"
        >
          <div class="mobile-panel-head">
            <RouterLink class="mobile-brand" to="/" @click="closeMobileNav">
              <IconLogo/>
              <span><strong id="mobile-navigation-title">Mysterria</strong><small>{{ labels.brandLine }}</small></span>
            </RouterLink>
            <button :aria-label="labels.closeMenu" class="mobile-close" type="button" @click="closeMobileNav">
              <span></span><span></span>
            </button>
          </div>

          <div class="mobile-status">
            <ServerStatusChip/>
          </div>

          <nav class="mobile-links" aria-label="Mobile navigation">
            <RouterLink
                v-for="(link, index) in navigationLinks"
                :key="link.path"
                :aria-current="isActive(link.path) ? 'page' : undefined"
                :class="{ active: isActive(link.path) }"
                :to="link.path"
                class="mobile-link"
                @click="closeMobileNav"
            >
              <span>0{{ index + 1 }}</span>
              <strong>{{ link.title }}</strong>
            </RouterLink>
          </nav>

          <div class="mobile-services">
            <p>{{ labels.explore }}</p>
            <a
                v-for="service in serviceLinks"
                :key="service.url"
                :href="service.url"
                rel="noopener noreferrer"
                target="_blank"
                @click="closeMobileNav"
            >
              <span>{{ service.name }}</span><i>↗</i>
            </a>
          </div>

          <div class="mobile-account">
            <LanguageSelector/>
            <BalanceButton/>
            <NotificationBell/>
            <AuthButton mobile-mode @mobile-action="closeMobileNav"/>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import IconLogo from "@/assets/icons/IconLogo.vue";
import AuthButton from "@/components/ui/AuthButton.vue";
import BalanceButton from "@/components/ui/BalanceButton.vue";
import LanguageSelector from "@/components/ui/LanguageSelector.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
import ServerStatusChip from "@/components/ui/ServerStatusChip.vue";
import {useI18n} from "@/composables/useI18n";

const route = useRoute();
const {currentLanguage, t} = useI18n();

const isScrolled = ref(false);
const isMobileNavOpen = ref(false);
const isExploreOpen = ref(false);
const mobileMenuButtonRef = ref<HTMLButtonElement | null>(null);
const mobilePanelRef = ref<HTMLElement | null>(null);
const exploreMenuRef = ref<HTMLElement | null>(null);
const exploreTriggerRef = ref<HTMLButtonElement | null>(null);
let closeTimeout: ReturnType<typeof setTimeout> | null = null;
let previousBodyOverflow = '';
let previousRootOverflow = '';
let mobileNavOpenedAt = '';

const labels = computed(() => currentLanguage.value === "uk" ? {
  brandLine: "За сірим туманом",
  start: "Почати",
  pathways: "Шляхи",
  explore: "Дослідити",
  beyondWebsite: "За межами сайту",
  keepExploring: "Продовжити подорож",
  openMenu: "Відкрити навігацію",
  closeMenu: "Закрити навігацію",
  skipToContent: "Перейти до вмісту",
} : {
  brandLine: "Beyond the gray fog",
  start: "Start here",
  pathways: "Pathways",
  explore: "Explore",
  beyondWebsite: "Beyond the website",
  keepExploring: "Continue the journey",
  openMenu: "Open navigation",
  closeMenu: "Close navigation",
  skipToContent: "Skip to content",
});

const navigationLinks = computed(() => [
  {path: "/", title: t("navHome") || "Home"},
  {path: "/guide", title: labels.value.start},
  {path: "/pathways", title: labels.value.pathways},
  {path: "/rules", title: t("navRules") || "Rules"},
  {path: "/store", title: t("navShop") || "Shop"},
]);

const serviceLinks = computed(() => [
  {
    index: "01",
    name: t("navWiki") || "Wiki",
    description: t("servicesWikiDesc") || "Knowledge base and guides",
    url: "https://wiki.mysterria.net/",
  },
  {
    index: "02",
    name: t("servicesDiscord") || "Discord",
    description: t("servicesDiscordDesc") || "Join the community",
    url: "https://discord.com/invite/jc7GSxBWgb",
  },
  {
    index: "03",
    name: t("servicesMap") || "Live Map",
    description: t("servicesMapDesc") || "Explore the world",
    url: "https://map.mysterria.net/",
  },
]);

const isActive = (path: string) => {
  return path === "/" ? route.path === "/" : route.path === path || route.path.startsWith(`${path}/`);
};

const updateScrollState = () => {
  isScrolled.value = window.scrollY > 18;
};

const clearCloseTimeout = () => {
  if (!closeTimeout) return;
  clearTimeout(closeTimeout);
  closeTimeout = null;
};

const openExploreMenu = () => {
  clearCloseTimeout();
  isExploreOpen.value = true;
};

const closeExploreMenu = () => {
  clearCloseTimeout();
  isExploreOpen.value = false;
};

const scheduleCloseExploreMenu = () => {
  clearCloseTimeout();
  closeTimeout = setTimeout(() => isExploreOpen.value = false, 180);
};

const toggleExploreMenu = () => {
  isExploreOpen.value = !isExploreOpen.value;
};

const handleExploreEscape = () => {
  exploreTriggerRef.value?.focus();
  closeExploreMenu();
};

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (isExploreOpen.value && !exploreMenuRef.value?.contains(event.target as Node)) {
    closeExploreMenu();
  }
};

const toggleMobileNav = () => {
  isMobileNavOpen.value = !isMobileNavOpen.value;
};

const closeMobileNav = () => {
  isMobileNavOpen.value = false;
};

const handleMobileMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeMobileNav();
    return;
  }

  if (event.key !== "Tab" || !mobilePanelRef.value) return;
  const focusable = Array.from(mobilePanelRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(isMobileNavOpen, async isOpen => {
  const app = document.getElementById("app");
  if (isOpen) {
    mobileNavOpenedAt = route.fullPath;
    previousBodyOverflow = document.body.style.overflow;
    previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    app?.setAttribute("inert", "");
    await nextTick();
    mobilePanelRef.value?.querySelector<HTMLElement>(".mobile-close")?.focus();
  } else {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousRootOverflow;
    app?.removeAttribute("inert");
    if (route.fullPath === mobileNavOpenedAt) {
      await nextTick();
      mobileMenuButtonRef.value?.focus({preventScroll: true});
    }
  }
});

watch(() => route.fullPath, () => {
  closeMobileNav();
  closeExploreMenu();
});

onMounted(() => {
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, {passive: true});
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollState);
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
  document.getElementById("app")?.removeAttribute("inert");
  clearCloseTimeout();
});
</script>

<style scoped>
.skip-link {
  position: fixed;
  z-index: 5000;
  top: 10px;
  left: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: #171108;
  background: var(--myst-gold);
  font: 700 13px var(--font-ui);
  transform: translateY(-150%);
  transition: transform var(--motion-fast) var(--ease-standard);
}
.skip-link:focus { transform: translateY(0); }

.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  height: 82px;
  padding: 12px 18px;
  font-family: var(--font-ui);
  transition: height var(--motion-slow) var(--ease-standard), padding var(--motion-slow) var(--ease-standard);
}

.site-header::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(5, 6, 9, .86), rgba(5, 6, 9, .2));
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(4px);
  transition: background var(--motion-slow) var(--ease-standard), border-color var(--motion-slow) var(--ease-standard), backdrop-filter var(--motion-slow) var(--ease-standard);
}

.site-header.scrolled {
  height: 70px;
  padding-block: 7px;
}

.site-header.scrolled::before,
.site-header:not(.on-home)::before {
  background: rgba(7, 8, 12, .88);
  border-bottom-color: rgba(237, 226, 204, .1);
  backdrop-filter: blur(20px) saturate(1.2);
}

.header-frame {
  width: min(1400px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(22px, 3vw, 52px);
}

.brand,
.mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: #f1e8d6;
  text-decoration: none;
}

.brand :deep(.icon-logo) { width: 43px; height: 43px; }

.brand-copy,
.mobile-brand > span {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-copy strong,
.mobile-brand strong {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.03em;
}

.brand-copy small,
.mobile-brand small {
  color: #a39b90;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .025em;
}

.desktop-nav {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.nav-item {
  position: relative;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  border: 0;
  border-radius: var(--radius-md);
  color: #aaa398;
  background: transparent;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .015em;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-standard), background-color var(--motion-fast) var(--ease-standard);
}

.nav-item::after {
  content: "";
  position: absolute;
  left: 50%;
  right: 50%;
  bottom: 3px;
  height: 1px;
  background: #d8b65f;
  transition: left var(--motion-base) var(--ease-standard), right var(--motion-base) var(--ease-standard);
}

.nav-item:hover,
.nav-item.active {
  color: #f1e8d6;
  background: rgba(255, 255, 255, .035);
}

.nav-item.active::after { left: 15px; right: 15px; }

.explore-menu { position: relative; }

.chevron {
  width: 6px;
  height: 6px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
}

.explore-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 350px;
  overflow: hidden;
  padding: 9px;
  border: 1px solid rgba(237, 226, 204, .13);
  border-radius: var(--radius-xl);
  background: rgba(11, 12, 17, .96);
  box-shadow: var(--shadow-panel-raised);
  backdrop-filter: blur(24px);
}

.dropdown-heading { padding: 17px 17px 14px; border-bottom: 1px solid rgba(237, 226, 204, .08); }
.dropdown-heading span { display: block; color: #d8b65f; font: 600 12px var(--font-ui); letter-spacing: .025em; }
.dropdown-heading strong { display: block; margin-top: 5px; color: #f1e8d6; font: 700 21px var(--font-display); letter-spacing: -.03em; }

.service-link {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 11px;
  padding: 14px 15px;
  border-radius: var(--radius-md);
  color: #f1e8d6;
  text-decoration: none;
}

.service-link:hover { color: #f1e8d6; background: rgba(216, 182, 95, .07); }
.service-index { color: #928b80; font: 600 11px var(--font-ui); font-variant-numeric: tabular-nums; }
.service-copy { display: flex; flex-direction: column; gap: 2px; }
.service-copy strong { font-size: 13px; }
.service-copy small { color: #a19a90; font-size: 12px; }
.service-arrow { color: #d8b65f; }

.header-tools { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.header-tools :deep(.server-chip),
.header-tools :deep(.lang-ritual-selector),
.header-tools :deep(.btn-ritual-auth) { height: 44px; border-radius: var(--radius-md); }
.header-tools :deep(button),
.mobile-account :deep(button) { font-family: var(--font-ui); }

.mobile-menu-button {
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(237, 226, 204, .14);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, .03);
  cursor: pointer;
}

.mobile-menu-button span { position: absolute; width: 20px; height: 2px; background: #f1e8d6; }
.mobile-menu-button span:first-child { transform: translateY(-5px); }
.mobile-menu-button span:last-child { transform: translateY(5px); }

.mobile-menu-layer { position: fixed; inset: 0; z-index: 2000; display: flex; justify-content: flex-end; overscroll-behavior: contain; }
.mobile-backdrop { position: absolute; inset: 0; padding: 0; border: 0; background: rgba(3, 4, 7, .72); backdrop-filter: blur(10px); }
.mobile-panel { position: relative; width: min(420px, 92vw); height: 100%; overflow-y: auto; overscroll-behavior: contain; padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) 20px; color: #f1e8d6; background: radial-gradient(circle at 100% 0%, rgba(157, 27, 48, .16), transparent 20rem), #0a0b0f; border-left: 1px solid rgba(237, 226, 204, .1); box-shadow: var(--shadow-panel-raised); }
.mobile-panel-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid rgba(237, 226, 204, .1); }
.mobile-brand :deep(.icon-logo) { width: 46px; height: 46px; }
.mobile-close { position: relative; width: 44px; height: 44px; border: 1px solid rgba(237, 226, 204, .13); border-radius: var(--radius-sm); background: transparent; cursor: pointer; }
.mobile-close span { position: absolute; top: 50%; left: 50%; width: 17px; height: 1px; background: #f1e8d6; }
.mobile-close span:first-child { transform: translate(-50%, -50%) rotate(45deg); }
.mobile-close span:last-child { transform: translate(-50%, -50%) rotate(-45deg); }

.mobile-status { padding: 18px 0; border-bottom: 1px solid rgba(237, 226, 204, .08); }
.mobile-status :deep(.server-chip) { display: inline-flex; min-height: 44px; border-radius: var(--radius-sm); }

.mobile-links { padding: 18px 0; }
.mobile-link { display: grid; grid-template-columns: 34px 1fr; align-items: center; min-height: 58px; border-bottom: 1px solid rgba(237, 226, 204, .07); color: #b7afa3; text-decoration: none; }
.mobile-link > span { color: #918a80; font: 600 11px var(--font-ui); font-variant-numeric: tabular-nums; }
.mobile-link strong { font: 650 24px var(--font-display); letter-spacing: -.015em; }
.mobile-link:hover,
.mobile-link.active { color: #f1e8d6; }
.mobile-link.active > span { color: #d8b65f; }

.mobile-services { padding: 18px 0 24px; border-bottom: 1px solid rgba(237, 226, 204, .08); }
.mobile-services p { margin: 0 0 10px; color: #d8b65f; font: 600 12px var(--font-ui); letter-spacing: .025em; }
.mobile-services a { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 9px 0; color: #b7afa3; font-size: 14px; text-decoration: none; }
.mobile-services i { color: #d8b65f; font-style: normal; }

.mobile-account { display: grid; gap: 12px; padding-top: 22px; }
.mobile-account :deep(.lang-ritual-selector),
.mobile-account :deep(.dollar) { width: 100%; justify-content: center; }
.mobile-account :deep(.lang-ritual-btn) { flex: 1; }
.mobile-account :deep(.btn-ritual-auth) { width: 100%; min-height: 44px; justify-content: center; border-radius: var(--radius-md); }

.nav-item:focus-visible,
.service-link:focus-visible,
.mobile-menu-button:focus-visible,
.mobile-brand:focus-visible,
.mobile-close:focus-visible,
.mobile-link:focus-visible,
.mobile-services a:focus-visible {
  outline: 2px solid #e5c46e;
  outline-offset: 3px;
}

.menu-reveal-enter-active,
.menu-reveal-leave-active { transition: opacity var(--motion-base) var(--ease-enter), transform var(--motion-base) var(--ease-enter); }
.menu-reveal-enter-from,
.menu-reveal-leave-to { opacity: 0; transform: translateY(-8px); }

.mobile-menu-enter-active,
.mobile-menu-leave-active { transition: opacity var(--motion-slow) var(--ease-standard); }
.mobile-menu-enter-active .mobile-panel,
.mobile-menu-leave-active .mobile-panel { transition: transform var(--motion-slow) var(--ease-enter); }
.mobile-menu-enter-from,
.mobile-menu-leave-to { opacity: 0; }
.mobile-menu-enter-from .mobile-panel,
.mobile-menu-leave-to .mobile-panel { transform: translateX(100%); }

@media (max-width: 1220px) {
  .desktop-server-status { display: none; }
  .header-frame { gap: 18px; }
  .nav-item { padding-inline: 10px; }
}

@media (max-width: 1020px) {
  .brand-copy small { display: none; }
  .desktop-account-tool { display: none; }
}

@media (max-width: 820px) {
  .site-header { height: 70px; padding: 8px 12px; }
  .header-frame { display: flex; justify-content: space-between; }
  .desktop-nav,
  .desktop-language,
  .desktop-auth { display: none; }
  .mobile-menu-button { position: relative; display: grid; }
  .brand :deep(.icon-logo) { width: 40px; height: 40px; }
}

@media (max-width: 440px) {
  .brand-copy small { display: block; }
  .brand-copy strong { font-size: 18px; }
  .mobile-panel { width: 100%; }
}

</style>
