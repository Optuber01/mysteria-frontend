<template>
  <header
    class="site-header"
    :class="{
      'is-home': isHome,
      'is-at-top': isAtTop,
      'has-panel': isServicesOpen || isMobileNavOpen,
    }"
  >
    <div class="site-header__inner">
      <RouterLink class="site-brand" to="/" aria-label="Mysterria home" @click="closePanels">
        <IconLogo class="site-brand__mark" aria-hidden="true" />
        <span class="site-brand__name">Mysterria</span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <RouterLink
          v-for="link in navigationLinks"
          :key="link.path"
          class="desktop-nav__link"
          :class="{ 'is-active': isLinkActive(link.path) }"
          :to="link.path"
        >
          {{ link.title }}
        </RouterLink>

        <div
          ref="servicesRef"
          class="services"
          @mouseenter="handleServicesEnter"
          @mouseleave="scheduleCloseServices"
        >
          <button
            ref="servicesTriggerRef"
            class="desktop-nav__link services__trigger"
            type="button"
            :aria-expanded="isServicesOpen"
            aria-controls="mysterria-services"
            @click="handleServicesClick"
            @focus="cancelCloseServices"
            @keydown.escape.stop="closeServices"
          >
            World
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="m4.5 6 3.5 3.5L11.5 6" />
            </svg>
          </button>

          <Transition name="services-panel">
            <div
              v-if="isServicesOpen"
              id="mysterria-services"
              class="services__panel"
              @mouseenter="cancelCloseServices"
              @mouseleave="scheduleCloseServices"
              @keydown.escape.stop="closeServices"
            >
              <p>Beyond the website</p>
              <a
                v-for="service in servicesLinks"
                :key="service.url"
                class="service-link"
                :href="service.url"
                target="_blank"
                rel="noopener noreferrer"
                @click="closeServices"
              >
                <component :is="service.icon" class="service-link__icon" aria-hidden="true" />
                <span>
                  <strong>{{ service.name }}</strong>
                  <small>{{ service.description }}</small>
                </span>
                <svg class="service-link__arrow" aria-hidden="true" viewBox="0 0 18 18">
                  <path d="M5 13 13 5m-6 0h6v6" />
                </svg>
              </a>
            </div>
          </Transition>
        </div>
      </nav>

      <div class="site-header__actions">
        <ServerStatusChip class="header-server-status" />
        <div class="header-utilities">
          <LanguageSelector />
          <template v-if="!isHome">
            <BalanceButton />
            <NotificationBell />
            <AuthButton />
          </template>
        </div>
        <RouterLink v-if="isHome" class="home-login-link" to="/login">Login</RouterLink>
        <RouterLink class="play-link" to="/guide">
          Play
          <svg aria-hidden="true" viewBox="0 0 18 18">
            <path d="M4 9h10m-4-4 4 4-4 4" />
          </svg>
        </RouterLink>
        <button
          ref="mobileNavToggleRef"
          class="mobile-nav-toggle"
          type="button"
          :aria-expanded="isMobileNavOpen"
          aria-controls="mobile-navigation-drawer"
          :aria-label="isMobileNavOpen ? 'Close navigation' : 'Open navigation'"
          @click="openMobileNav"
        >
          <span /><span />
        </button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="mobile-nav">
      <div v-if="isMobileNavOpen" class="mobile-nav-layer">
        <button
          class="mobile-nav-backdrop"
          type="button"
          tabindex="-1"
          aria-label="Close navigation"
          @click="closeMobileNav"
        />
        <nav
          id="mobile-navigation-drawer"
          ref="mobileNavRef"
          class="mobile-nav"
          aria-label="Mobile navigation"
          aria-modal="true"
          role="dialog"
          tabindex="-1"
          @keydown="handleMobileNavKeydown"
        >
          <div class="mobile-nav__header">
            <RouterLink class="mobile-nav__brand" to="/" @click="closeMobileNav">
              <IconLogo aria-hidden="true" />
              <span>Mysterria</span>
            </RouterLink>
            <button class="mobile-nav__close" type="button" aria-label="Close navigation" @click="closeMobileNav">
              <span /><span />
            </button>
          </div>

          <div class="mobile-nav__body">
            <p class="mobile-nav__eyebrow">Navigate</p>
            <RouterLink
              v-for="(link, index) in navigationLinks"
              :key="link.path"
              class="mobile-nav__link"
              :class="{ 'is-active': isLinkActive(link.path) }"
              :to="link.path"
              @click="closeMobileNav"
            >
              <small>0{{ index + 1 }}</small>
              <span>{{ link.title }}</span>
              <svg aria-hidden="true" viewBox="0 0 18 18"><path d="M4 9h10m-4-4 4 4-4 4" /></svg>
            </RouterLink>

            <div class="mobile-nav__world">
              <p class="mobile-nav__eyebrow">World links</p>
              <a
                v-for="service in servicesLinks"
                :key="service.url"
                :href="service.url"
                target="_blank"
                rel="noopener noreferrer"
                @click="closeMobileNav"
              >
                {{ service.name }}
                <svg aria-hidden="true" viewBox="0 0 18 18"><path d="M5 13 13 5m-6 0h6v6" /></svg>
              </a>
            </div>

            <ServerStatusChip class="mobile-server-status" />
          </div>

          <div class="mobile-nav__footer">
            <div class="mobile-nav__controls">
              <LanguageSelector />
              <template v-if="!isHome">
                <BalanceButton />
                <NotificationBell />
              </template>
            </div>
            <AuthButton v-if="!isHome" mobile-mode @mobile-action="closeMobileNav" />
            <RouterLink v-else class="mobile-login-link" to="/login" @click="closeMobileNav">Login</RouterLink>
          </div>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ServerStatusChip from '@/components/ui/ServerStatusChip.vue';
import IconLogo from '@/assets/icons/IconLogo.vue';
import IconMap from '@/assets/icons/IconMap.vue';
import IconWiki from '@/assets/icons/IconWiki.vue';
import IconDiscord from '@/assets/icons/IconDiscord.vue';

const AuthButton = defineAsyncComponent(() => import('@/components/ui/AuthButton.vue'));
const BalanceButton = defineAsyncComponent(() => import('@/components/ui/BalanceButton.vue'));
const NotificationBell = defineAsyncComponent(() => import('@/components/notifications/NotificationBell.vue'));
const LanguageSelector = defineAsyncComponent(() => import('@/components/ui/LanguageSelector.vue'));

const headerFallbacks: Record<string, string> = {
  navGame: 'Guide',
  navRules: 'Rules',
  navShop: 'Store',
  navWiki: 'Wiki',
  servicesWikiDesc: 'Guides and server knowledge',
  servicesMap: 'World map',
  servicesMapDesc: 'Explore the live world',
  servicesDiscord: 'Community',
  servicesDiscordDesc: 'Meet players and get help',
};

type NavigationLink = {
  path: string;
  title: string;
};

const route = useRoute();
const translate = ref<(key: string) => string>((key) => headerFallbacks[key] ?? key);
const t = (key: string) => translate.value(key);

const isAtTop = ref(true);
const isServicesOpen = ref(false);
const isMobileNavOpen = ref(false);
const mobileNavToggleRef = ref<HTMLButtonElement | null>(null);
const mobileNavRef = ref<HTMLElement | null>(null);
const servicesRef = ref<HTMLElement | null>(null);
const servicesTriggerRef = ref<HTMLButtonElement | null>(null);

let scrollFrame = 0;
let servicesTimer: ReturnType<typeof setTimeout> | null = null;
let servicesOpenedByHover = false;
let servicesPinnedByClick = false;
let servicesScrollLastY = 0;
let servicesScrollDistance = 0;

const isHome = computed(() => route.path === '/');
let i18nLoaded = false;

watch(isHome, async (home) => {
  if (home || i18nLoaded) return;
  const { useI18n } = await import('@/composables/useI18n');
  translate.value = useI18n().t;
  i18nLoaded = true;
}, { immediate: true });

const navigationLinks = computed<NavigationLink[]>(() => [
  { path: '/guide', title: t('navGame') || 'Guide' },
  { path: '/pathways', title: 'Pathways' },
  { path: '/rules', title: t('navRules') || 'Rules' },
  { path: '/store', title: t('navShop') || 'Store' },
]);

const servicesLinks = computed(() => [
  {
    name: t('navWiki') || 'Wiki',
    description: t('servicesWikiDesc') || 'Guides and server knowledge',
    url: 'https://wiki.mysterria.net/',
    icon: IconWiki,
  },
  {
    name: t('servicesMap') || 'World map',
    description: t('servicesMapDesc') || 'Explore the live world',
    url: 'https://map.mysterria.net/',
    icon: IconMap,
  },
  {
    name: t('servicesDiscord') || 'Community',
    description: t('servicesDiscordDesc') || 'Meet players and get help',
    url: 'https://discord.com/invite/jc7GSxBWgb',
    icon: IconDiscord,
  },
]);

function isLinkActive(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(`${path}/`));
}

function updateHeaderPosition() {
  scrollFrame = 0;
  isAtTop.value = window.scrollY < 24;
  if (isServicesOpen.value && !isMobileNavOpen.value) {
    servicesScrollDistance += Math.abs(window.scrollY - servicesScrollLastY);
    servicesScrollLastY = window.scrollY;
    if (servicesScrollDistance > 24) dismissServices();
  }
}

function queueHeaderPosition() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateHeaderPosition);
}

function cancelCloseServices() {
  if (!servicesTimer) return;
  clearTimeout(servicesTimer);
  servicesTimer = null;
}

function openServices() {
  cancelCloseServices();
  servicesScrollLastY = window.scrollY;
  servicesScrollDistance = 0;
  isServicesOpen.value = true;
}

function handleServicesEnter() {
  cancelCloseServices();
  if (!isServicesOpen.value) {
    servicesOpenedByHover = true;
    servicesScrollLastY = window.scrollY;
    servicesScrollDistance = 0;
  }
  isServicesOpen.value = true;
}

function closeServices() {
  cancelCloseServices();
  isServicesOpen.value = false;
  servicesOpenedByHover = false;
  servicesPinnedByClick = false;
  servicesScrollDistance = 0;
}

function blurServicesTrigger() {
  if (document.activeElement === servicesTriggerRef.value) servicesTriggerRef.value?.blur();
}

function dismissServices() {
  closeServices();
  blurServicesTrigger();
}

function scheduleCloseServices() {
  cancelCloseServices();
  servicesTimer = setTimeout(dismissServices, 180);
}

function handleServicesClick() {
  if (!isServicesOpen.value) {
    servicesOpenedByHover = false;
    openServices();
    return;
  }
  if (servicesOpenedByHover && !servicesPinnedByClick) {
    servicesPinnedByClick = true;
    return;
  }
  closeServices();
}

function openMobileNav() {
  closeServices();
  isMobileNavOpen.value = true;
}

function closeMobileNav() {
  isMobileNavOpen.value = false;
}

function closePanels() {
  dismissServices();
  closeMobileNav();
}

function getMobileFocusableElements() {
  if (!mobileNavRef.value) return [];
  return Array.from(
    mobileNavRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
}

function handleMobileNavKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeMobileNav();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = getMobileFocusableElements();
  if (!focusable.length) {
    event.preventDefault();
    mobileNavRef.value?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleOutsidePointer(event: PointerEvent) {
  if (!isServicesOpen.value) return;
  const target = event.target;
  if (target instanceof Node && !servicesRef.value?.contains(target)) dismissServices();
}

watch(isMobileNavOpen, async (isOpen) => {
  const appRoot = document.querySelector<HTMLElement>('#app');
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    await nextTick();
    getMobileFocusableElements()[0]?.focus();
  } else {
    document.body.style.overflow = '';
    appRoot?.removeAttribute('inert');
    await nextTick();
    mobileNavToggleRef.value?.focus();
  }
});

watch(() => route.fullPath, closePanels);

onMounted(() => {
  updateHeaderPosition();
  window.addEventListener('scroll', queueHeaderPosition, { passive: true });
  document.addEventListener('pointerdown', handleOutsidePointer);
});

onUnmounted(() => {
  window.removeEventListener('scroll', queueHeaderPosition);
  document.removeEventListener('pointerdown', handleOutsidePointer);
  document.body.style.overflow = '';
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  cancelCloseServices();
});
</script>

<style scoped>
.site-header {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 72px;
  color: var(--ink, #221c14);
  background: var(--surface-glass, rgba(255, 255, 255, .86));
  border-bottom: 1px solid var(--hairline, #eae1d0);
  backdrop-filter: blur(14px);
  transition: color .35s, background-color .4s, border-color .35s, box-shadow .4s;
}

.site-header.is-home.is-at-top:not(.has-panel) {
  background: rgba(252, 248, 240, .86);
  border-bottom-color: rgba(234, 225, 208, .72);
  box-shadow: 0 5px 18px rgba(34, 28, 20, .04);
  backdrop-filter: blur(14px);
}

.site-header.is-home.is-at-top .header-server-status {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-5px);
  pointer-events: none;
}

.site-header:not(.is-at-top),
.site-header.has-panel {
  box-shadow: 0 10px 30px rgba(34, 28, 20, .08);
}

.site-header__inner {
  width: min(100%, 1480px);
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(18px, 2.7vw, 44px);
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 56px);
}

.site-brand {
  justify-self: start;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  color: inherit;
}

.site-brand:hover { color: inherit; }
.site-brand__mark { width: 44px; height: 44px; }
.site-brand__name {
  font: 700 1.35rem/1 var(--font-display, "IBM Plex Sans Condensed", sans-serif);
  letter-spacing: -.025em;
}

.desktop-nav {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  justify-self: center;
}

.desktop-nav__link {
  position: relative;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 9px;
  color: var(--ink-muted, #756b5c);
  background: transparent;
  font: 700 .67rem/1 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color .25s;
}

.desktop-nav__link::after {
  content: "";
  position: absolute;
  left: 13px;
  right: 13px;
  bottom: 6px;
  height: 2px;
  background: var(--primary, #7458e8);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform .35s cubic-bezier(.22, 1, .36, 1);
}

.desktop-nav__link:hover {
  color: var(--ink, #221c14);
}

.desktop-nav__link.is-active {
  color: var(--ink, #221c14);
}

.desktop-nav__link:hover::after,
.desktop-nav__link.is-active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.services { position: relative; }
.services__trigger svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  transition: transform .35s cubic-bezier(.22, 1, .36, 1);
}
.services__trigger[aria-expanded="true"] svg { transform: rotate(180deg); }

.services__panel {
  position: absolute;
  top: calc(100% + 13px);
  right: -74px;
  width: 332px;
  padding: 10px;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 16px;
  color: var(--ink, #221c14);
  background: var(--surface, #fff);
  box-shadow: 0 24px 60px rgba(34, 28, 20, .14);
}

.services__panel > p {
  margin: 4px 8px 8px;
  color: var(--ink-muted, #756b5c);
  font: 800 .57rem/1 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.service-link {
  min-height: 62px;
  display: grid;
  grid-template-columns: 34px 1fr 20px;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 11px;
  color: var(--ink, #221c14);
  transition: color .14s, background-color .14s, transform .14s cubic-bezier(.22, 1, .36, 1);
}

.service-link:hover {
  color: var(--ink, #221c14);
  background: var(--primary-tint, rgba(116, 88, 232, .12));
  transform: translateY(-4px);
}

.service-link__icon { width: 26px; height: 26px; color: var(--primary, #7458e8); }
.service-link span { min-width: 0; }
.service-link strong { display: block; font-size: .78rem; font-weight: 700; }
.service-link small { display: block; margin-top: 2px; color: var(--ink-muted, #756b5c); font-size: .67rem; font-weight: 500; }
.service-link__arrow,
.play-link svg,
.mobile-nav__link svg,
.mobile-nav__world svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.site-header__actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 9px;
}

.header-server-status {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  will-change: opacity, transform;
  transition: opacity .35s cubic-bezier(.22, 1, .36, 1), transform .35s cubic-bezier(.22, 1, .36, 1), visibility 0s linear;
}

.header-utilities { display: flex; align-items: center; gap: 7px; }

.header-utilities :deep(button:not(.lang-ritual-btn)),
.header-utilities :deep(a) { min-width: 44px; min-height: 44px; }
.header-utilities :deep(.lang-ritual-selector) { align-self: center; height: 36px; min-height: 36px; }
.header-utilities :deep(.lang-ritual-btn) { min-width: 32px; min-height: 28px; height: 28px; }

.home-login-link,
.mobile-login-link {
  min-width: 72px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink, #221c14);
  font: 700 .66rem/1 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .08em;
  text-transform: uppercase;
  transition: color .2s;
}

.home-login-link:hover,
.mobile-login-link:hover { color: var(--primary, #7458e8); }

.mobile-login-link { width: 100%; min-height: 48px; }

.play-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: var(--primary, #7458e8);
  font-size: .77rem;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(34, 28, 20, .12);
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), box-shadow .32s, background-color .25s;
}

.play-link:hover { background: var(--primary-deep, #5f46d6); box-shadow: 0 12px 26px rgba(34, 28, 20, .16); transform: translateY(-1px); }
.play-link:hover svg { transform: translateX(2px); }

.mobile-nav-toggle {
  width: 44px;
  height: 44px;
  display: none;
  place-items: center;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 10px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.mobile-nav-toggle span {
  grid-area: 1 / 1;
  width: 19px;
  height: 1px;
  background: currentColor;
  transform: translateY(-4px);
}
.mobile-nav-toggle span + span { transform: translateY(4px); }

.services-panel-enter-active,
.services-panel-leave-active { transition: opacity .25s, transform .35s cubic-bezier(.22, 1, .36, 1); }
.services-panel-enter-from,
.services-panel-leave-to { opacity: 0; transform: translateY(-7px) scale(.98); }

.mobile-nav-layer {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
}

.mobile-nav-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: rgba(34, 28, 20, .38);
  backdrop-filter: blur(6px);
}

.mobile-nav {
  position: relative;
  width: min(430px, 92vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  color: var(--ink, #221c14);
  background:
    radial-gradient(circle at 100% 0%, rgba(116, 88, 232, .1), transparent 28%),
    var(--surface, #fff);
  box-shadow: -24px 0 70px rgba(34, 28, 20, .18);
}

.mobile-nav__header {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--hairline, #eae1d0);
}

.mobile-nav__brand { min-height: 44px; display: flex; align-items: center; gap: 10px; color: var(--ink, #221c14); }
.mobile-nav__brand :deep(img) { width: 39px; height: 39px; }
.mobile-nav__brand span { font: 700 1.3rem/1 var(--font-display, "IBM Plex Sans Condensed", sans-serif); }

.mobile-nav__close {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 10px;
  color: var(--ink, #221c14);
  background: transparent;
  cursor: pointer;
}
.mobile-nav__close span { grid-area: 1 / 1; width: 19px; height: 1px; background: currentColor; transform: rotate(45deg); }
.mobile-nav__close span + span { transform: rotate(-45deg); }

.mobile-nav__body { flex: 1; padding: 28px 20px; }
.mobile-nav__eyebrow {
  margin: 0 0 11px;
  color: var(--ink-muted, #756b5c);
  font: 800 .58rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.mobile-nav__link {
  min-height: 58px;
  display: grid;
  grid-template-columns: 28px 1fr 22px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--hairline, #eae1d0);
  color: var(--ink, #221c14);
}
.mobile-nav__link small { color: var(--champagne, #d9b45a); font: 600 .59rem/1 "IBM Plex Mono", monospace; }
.mobile-nav__link span { font: 700 1.36rem/1 "IBM Plex Sans Condensed", sans-serif; }
.mobile-nav__link svg { transition: transform .3s cubic-bezier(.22, 1, .36, 1); }
.mobile-nav__link:hover,
.mobile-nav__link.is-active { color: var(--primary, #7458e8); }
.mobile-nav__link:hover svg { transform: translateX(3px); }

.mobile-nav__world { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 30px; }
.mobile-nav__world .mobile-nav__eyebrow { grid-column: 1 / -1; }
.mobile-nav__world a {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 9px;
  color: var(--ink, #221c14);
  font-size: .72rem;
  font-weight: 720;
}
.mobile-nav__world a:hover {
  color: var(--primary, #7458e8);
  border-color: color-mix(in srgb, var(--primary, #7458e8) 40%, transparent);
}

.mobile-server-status {
  width: 100%;
  min-height: 48px;
  display: flex !important;
  justify-content: center;
  margin-top: 18px;
}

.mobile-nav__footer {
  padding: 18px 20px max(18px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--hairline, #eae1d0);
  background: rgba(251, 247, 239, .78);
}
.mobile-nav__controls { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.mobile-nav__controls :deep(button:not(.lang-ritual-btn)),
.mobile-nav__controls :deep(a) { min-width: 44px; min-height: 44px; }
.mobile-nav__controls :deep(.lang-ritual-selector) { align-self: center; height: 36px; min-height: 36px; }
.mobile-nav__controls :deep(.lang-ritual-btn) { min-width: 32px; min-height: 28px; height: 28px; }

.mobile-nav-enter-active,
.mobile-nav-leave-active { transition: opacity .35s; }
.mobile-nav-enter-active .mobile-nav,
.mobile-nav-leave-active .mobile-nav { transition: transform .48s cubic-bezier(.22, 1, .36, 1); }
.mobile-nav-enter-from,
.mobile-nav-leave-to { opacity: 0; }
.mobile-nav-enter-from .mobile-nav,
.mobile-nav-leave-to .mobile-nav { transform: translateX(100%); }

@media (max-width: 1320px) {
  .header-utilities :deep(.dollar) { display: none; }
}

@media (max-width: 1080px) {
  .site-header__inner { gap: 16px; }
  .site-brand__name { display: none; }
  .header-server-status { display: none; }
  .desktop-nav__link { padding-inline: 10px; }
}

@media (max-width: 820px) {
  .site-header { height: 68px; }
  .site-header__inner { grid-template-columns: minmax(0, 1fr) auto; }
  .desktop-nav,
  .header-utilities,
  .header-server-status { display: none; }
  .site-brand__name { display: inline; }
  .site-header__actions { justify-self: end; }
  .mobile-nav-toggle { display: grid; }
}

@media (max-width: 420px) {
  .site-header__inner { padding-inline: 12px; }
  .site-brand__name { display: none; }
  .play-link { padding-inline: 13px; }
  .mobile-nav__world { grid-template-columns: 1fr; }
  .mobile-nav__world .mobile-nav__eyebrow { grid-column: auto; }
}

@media (max-width: 260px) {
  .site-header__inner { padding-inline: 6px; gap: 5px; }
  .site-brand__mark { width: 36px; height: 36px; }
  .play-link { padding-inline: 9px; font-size: .67rem; }
  .mobile-nav { width: 100%; }
  .mobile-nav__header,
  .mobile-nav__body,
  .mobile-nav__footer { padding-inline: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .site-brand__mark,
  .services__trigger svg,
  .service-link,
  .services-panel-enter-active,
  .services-panel-leave-active,
  .mobile-nav-enter-active,
  .mobile-nav-leave-active,
  .mobile-nav-enter-active .mobile-nav,
  .mobile-nav-leave-active .mobile-nav { transition: none; }
}
</style>
