<template>
  <div ref="stackRef" :class="['header-stack', {'is-overlay': overlay, 'is-at-top': overlay && isAtTop}]">
  <!-- Season announcement, shown above the header on the pages that ask for it -->
  <div v-if="showAnnouncement && announcement && !announcementDismissed" class="season-bar">
    <span class="season-headline">{{ announcement.headline }}</span>
    <span class="season-divider" aria-hidden="true">†</span>
    <RouterLink v-if="announcement.to" :to="$lp(announcement.to)" class="season-link">
      {{ announcement.linkLabel }} →
    </RouterLink>
    <button :aria-label="t('contentLanguageNotice.dismiss')" class="season-dismiss" type="button" @click="dismissAnnouncement">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>

  <header :class="['site-header', {'is-authed': isAuthenticated}]">
    <div class="header-grid">
      <RouterLink :to="$lp('/')" class="brand" @click="closeMobileNav">
        <img :src="logo" alt="Mysterria" class="brand-mark" width="38" height="38">
        <span class="brand-words">
          <span class="brand-name">Mysterria</span>
          <span class="brand-tagline">{{ t('header.tagline') }}</span>
        </span>
      </RouterLink>

      <nav ref="navigationRef" class="primary-nav" :aria-label="t('header.navLabel')">
        <RouterLink
            v-for="link in navigationLinks"
            :key="link.path"
            :class="['nav-link', { active: isActive(link) }]"
            :to="$lp(link.path)"
        >
          {{ link.title }}
          <span v-if="isActive(link)" class="nav-underline" aria-hidden="true"></span>
        </RouterLink>
      </nav>

      <div class="header-actions">
        <BalanceButton v-if="isAuthenticated" class="header-chip"/>
        <ServerStatusChip v-else class="header-chip"/>

        <!-- Always in the bar: compact (language code only) and the one way to switch at every width. -->
        <LanguageSelector class="header-lang"/>
        <span class="theme-toggle-wrap">
        <button
            :aria-label="isLight ? t('header.themeDark') : t('header.themeLight')"
            :title="nightLock && !isLight ? nightLock : isLight ? t('header.themeDark') : t('header.themeLight')"
            :aria-describedby="refusalShown ? 'theme-refusal' : undefined"
            class="theme-toggle"
            :class="{'is-refused': refusalShown}"
            type="button"
            @click="toggleTheme"
        >
          <!-- The icon names the mode a click switches to, like the label. -->
          <svg v-if="isLight" aria-hidden="true" class="theme-toggle__icon" viewBox="0 0 24 24">
            <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z"/>
          </svg>
          <svg v-else aria-hidden="true" class="theme-toggle__icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4.2"/>
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.55 1.55M17.15 17.15l1.55 1.55M5.3 18.7l1.55-1.55M17.15 6.85l1.55-1.55"/>
          </svg>
        </button>
          <!-- the page is keeping the night (the Darkness drawn): why the light will not come -->
          <span v-if="refusalShown" id="theme-refusal" class="theme-refusal" role="status">{{ nightLock }}</span>
        </span>
        <NotificationBell v-if="isAuthenticated" class="desktop-only"/>
        <AuthButton class="desktop-only"/>

        <button
            :aria-expanded="isMobileNavOpen"
            :aria-label="t('header.toggleNav')"
            class="mobile-nav-toggle"
            @click="toggleMobileNav"
        >
          <IconNavbar/>
        </button>
      </div>
    </div>
  </header>
  </div>

  <Teleport to="body">
    <Transition name="mobile-nav">
      <div v-if="isMobileNavOpen" class="mobile-nav-overlay">
        <div class="mobile-nav-backdrop" @click="closeMobileNav"></div>
        <nav class="mobile-nav">
          <div class="mobile-nav-header">
            <RouterLink :to="$lp('/')" class="brand compact" @click="closeMobileNav">
              <img :src="logo" alt="" class="brand-mark" width="30" height="30">
              <span class="brand-name">Mysterria</span>
            </RouterLink>
            <button :aria-label="t('header.closeNav')" class="mobile-nav-close" @click="closeMobileNav">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="mobile-nav-content">
            <RouterLink
                v-for="link in navigationLinks"
                :key="link.path"
                :class="['mobile-nav-link', { active: isActive(link) }]"
                :to="$lp(link.path)"
                @click="closeMobileNav"
            >
              {{ link.title }}
            </RouterLink>

            <div class="mobile-services" :aria-label="t('navServices')" role="group">
              <a
                  v-for="service in servicesLinks"
                  :key="service.url"
                  :href="service.url"
                  class="mobile-service-link"
                  rel="noopener noreferrer"
                  target="_blank"
                  @click="closeMobileNav"
              >
                <component :is="service.icon" class="mobile-service-icon"/>
                <span>
                  <strong>{{ service.name }}</strong>
                  <small>{{ service.description }}</small>
                </span>
              </a>
            </div>

            <div class="mobile-nav-footer">
              <ServerStatusChip class="mobile-ip"/>
              <NotificationBell v-if="isAuthenticated"/>
              <AuthButton mobile-mode @mobile-action="closeMobileNav"/>
            </div>
          </div>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import AuthButton from "@/components/ui/AuthButton.vue";
import BalanceButton from "@/components/ui/BalanceButton.vue";
import NotificationBell from "@/components/notifications/NotificationBell.vue";
import LanguageSelector from "@/components/ui/LanguageSelector.vue";
import ServerStatusChip from "@/components/ui/ServerStatusChip.vue";
import IconNavbar from "@/assets/icons/IconNavbar.vue";
import IconMap from "@/assets/icons/IconMap.vue";
import IconWiki from "@/assets/icons/IconWiki.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";
import {useI18n} from "@/composables/useI18n";
import {useLocalePath} from "@/composables/useLocalePath";
import {SEASON_ANNOUNCEMENT_SLUG} from "@/constants/season";
import {useAuthStore} from "@/stores/auth";
import {useTheme} from "@/composables/useTheme";
import logo from "@/assets/icons/sources/IconLogo-128.webp";

interface NavLink {
  path: string;
  title: string;
  /** Extra path prefixes that should light this link up. */
  matches?: string[];
}

const props = withDefaults(defineProps<{
  showAnnouncement?: boolean;
  /** Fixed over the page and transparent until scrolled; used by the homepage hero. */
  overlay?: boolean;
}>(), {showAnnouncement: false, overlay: false});

const route = useRoute();
const {t} = useI18n();
const {unprefixedPath} = useLocalePath();
const authStore = useAuthStore();
const {isLight, toggleTheme, nightLock, refused} = useTheme();
/* A refused switch shows its reason under the button for a moment. */
const refusalShown = ref(false);
let refusalTimer = 0;
watch(refused, () => {
  refusalShown.value = true;
  clearTimeout(refusalTimer);
  refusalTimer = window.setTimeout(() => (refusalShown.value = false), 3200);
});
watch(nightLock, lock => {
  if (!lock) refusalShown.value = false;
});
const isMobileNavOpen = ref(false);
const navigationRef = ref<HTMLElement | null>(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const navigationLinks = computed<NavLink[]>(() => [
  {path: "/", title: t("navHome")},
  {path: "/guide", title: t("navGame")},
  {path: "/pathways", title: t("navPathways")},
  {path: "/store", title: t("navShop"), matches: ["/services"]},
  {path: "/rules", title: t("navRules")},
  {path: "/news", title: t("navNews")},
]);

const announcement = computed(() => {
  const headline = t("header.seasonHeadline");
  if (!headline || headline === "header.seasonHeadline") return null;
  return {
    headline,
    linkLabel: t("header.seasonLink"),
    to: SEASON_ANNOUNCEMENT_SLUG ? `/news/${SEASON_ANNOUNCEMENT_SLUG}` : "/news",
  };
});

/* The bar is copy-driven; dismissal is keyed to the copy so a new announcement
   shows again for people who dismissed the previous one. */
const ANNOUNCEMENT_KEY = "myst-season-bar-dismissed";
const announcementDismissed = ref(false);

const announcementId = computed(() => announcement.value?.headline ?? "");

try {
  announcementDismissed.value = localStorage.getItem(ANNOUNCEMENT_KEY) === announcementId.value;
} catch {
  announcementDismissed.value = false;
}

const dismissAnnouncement = () => {
  announcementDismissed.value = true;
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, announcementId.value);
  } catch {
    // Storage unavailable - the bar simply returns on the next visit.
  }
};

const servicesLinks = computed(() => [
  {
    name: t("navWiki"),
    description: t("servicesWikiDesc"),
    url: "https://wiki.mysterria.net/",
    icon: IconWiki,
  },
  {
    name: t("servicesDiscord"),
    description: t("servicesDiscordDesc"),
    url: "https://discord.com/invite/jc7GSxBWgb",
    icon: IconDiscord,
  },
  {
    name: t("servicesMap"),
    description: t("servicesMapDesc"),
    url: "https://map.mysterria.net/",
    icon: IconMap,
  },
]);

/* Nav targets are written without a locale segment, so they are compared
   against the route with its segment stripped - otherwise /zh-TW/guide would
   never match /guide and nothing would ever light up. */
const isActive = (link: NavLink) => {
  const path = unprefixedPath.value;
  if (link.path === "/") return path === "/";
  if (path.startsWith(link.path)) return true;
  return (link.matches ?? []).some(prefix => path.startsWith(prefix));
};

const toggleMobileNav = () => (isMobileNavOpen.value = !isMobileNavOpen.value);
const closeMobileNav = () => (isMobileNavOpen.value = false);

/* Escape closes the drawer, like any other dialog */
const onDrawerKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeMobileNav();
};

watch(isMobileNavOpen, isOpen => {
  document.body.style.overflow = isOpen ? "hidden" : "";
  if (isOpen) window.addEventListener("keydown", onDrawerKey);
  else window.removeEventListener("keydown", onDrawerKey);
});

watch(() => route.path, closeMobileNav);

/*
 * Overlay mode: the header sits transparent on top of the hero and turns solid
 * once the reader scrolls. Two thresholds instead of one keep it from flickering
 * when scroll position jitters around the edge (overscroll, trackpad momentum).
 */
const stackRef = ref<HTMLElement | null>(null);
const isAtTop = ref(true);
const SOLID_AFTER = 48;
const CLEAR_BEFORE = 8;
let scrollFrame: number | null = null;
let stackObserver: ResizeObserver | null = null;

const readScroll = () => {
  scrollFrame = null;
  const y = window.scrollY;
  if (isAtTop.value && y > SOLID_AFTER) isAtTop.value = false;
  else if (!isAtTop.value && y < CLEAR_BEFORE) isAtTop.value = true;
};

const onScroll = () => {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(readScroll);
};

onMounted(() => {
  if (!props.overlay) return;
  readScroll();
  window.addEventListener("scroll", onScroll, {passive: true});
  // Pages under an overlay header offset their content by its live height,
  // which changes when the announcement bar is shown or dismissed.
  const setStack = (height: number) => document.documentElement.style.setProperty("--site-header-stack", `${Math.round(height)}px`);
  // Measured once now, before the first paint, so the page never lays out under a guessed height.
  if (stackRef.value) setStack(stackRef.value.getBoundingClientRect().height);
  stackObserver = new ResizeObserver(([entry]) => setStack(entry.borderBoxSize[0].blockSize));
  if (stackRef.value) stackObserver.observe(stackRef.value);
});

onUnmounted(() => {
  document.body.style.overflow = "";
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onDrawerKey);
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  stackObserver?.disconnect();
  document.documentElement.style.removeProperty("--site-header-stack");
});
</script>

<style scoped>
.header-stack {
  display: contents;
}

.header-stack.is-overlay {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  right: 0;
  display: block;
}

/*
 * Overlay mode turns solid once the page scrolls. Transitioning the header's own
 * background and backdrop blur re-rastered the bar every frame of the change (on the
 * first scroll, when the page is busiest), so the solid look lives on pre-rendered
 * ::before backings instead and only their opacity crossfades (composited).
 */
.header-stack.is-overlay .site-header {
  position: relative;
  background: transparent;
  border-bottom-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.header-stack.is-overlay .site-header::before,
.header-stack.is-overlay .season-bar::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  content: '';
  transition: opacity .35s ease;
}

.header-stack.is-overlay .site-header::before {
  /* covers the header's (transparent) bottom border too */
  bottom: -1px;
  /* near solid: at 78% the headings scrolling under it stayed readable through it */
  background: color-mix(in srgb, var(--myst-bg) 93%, transparent);
  border-bottom: 1px solid var(--myst-line-14);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* Upstream's bar scrolls away with the page; fixed here, it needs a backing so content
   doesn't show through it. The backing repeats the bar's own tint on top of the fill. */
.header-stack.is-overlay .season-bar::before {
  background-image: inherit;
  background-color: color-mix(in srgb, var(--myst-bg) 94%, transparent);
}

.header-stack.is-overlay.is-at-top .site-header::before,
.header-stack.is-overlay.is-at-top .season-bar::before {
  opacity: 0;
}

/* ---- Season announcement ---- */
.season-bar {
  position: relative;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
  flex-wrap: wrap;
  padding: 9px 16px;
  background: linear-gradient(90deg, rgba(200, 178, 115, 0), rgba(200, 178, 115, 0.12), rgba(200, 178, 115, 0));
  border-bottom: 1px solid var(--myst-line-18);
}

.season-headline,
.season-link {
  font-family: var(--myst-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  white-space: nowrap;
}

.season-headline {
  letter-spacing: 0.28em;
  color: var(--myst-gold);
}

.season-divider {
  color: var(--myst-line-40);
  font-size: 10px;
}

.season-link {
  letter-spacing: 0.2em;
  color: var(--myst-ink-muted);
}

.season-link:hover {
  color: var(--myst-gold);
}

.season-dismiss {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--myst-line-40);
  font-size: 12px;
  transition: color 0.25s ease;
}

.season-dismiss:hover {
  color: var(--myst-gold);
}

/* On narrow screens the headline and the link always take a line each, so the bar's
   height never depends on whether its font has arrived (the hero is laid out under it). */
@media (max-width: 640px) {
  .season-bar {
    flex-direction: column;
    gap: 4px;
    padding-right: 40px;
    padding-left: 40px;
  }

  .season-divider {
    display: none;
  }
}

/* ---- Header shell ---- */
.site-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: color-mix(in srgb, var(--myst-bg) 78%, transparent);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--myst-line-14);
}

.header-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: var(--myst-header-height);
  gap: 18px;
}

/* ---- Brand ---- */
.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  justify-self: start;
  color: inherit;
}

.brand:hover {
  color: inherit;
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: block;
  filter: drop-shadow(0 0 8px rgba(200, 178, 115, 0.35));
}

.brand-words {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-name {
  font-family: var(--myst-font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--myst-offwhite);
}

.brand-tagline {
  margin-top: 4px;
  font-family: var(--myst-font-mono);
  font-size: 8.5px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--myst-gold);
}

.brand.compact .brand-mark {
  width: 30px;
  height: 30px;
}

/* ---- Nav ---- */
.primary-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-self: center;
  min-width: 0;
}

.nav-link {
  position: relative;
  padding: 10px 12px;
  font-family: var(--myst-font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--myst-ink-muted);
  white-space: nowrap;
  transition: color 0.25s ease;
}

/* one language with the page's tabs: hover inks the label, the current page adds the accent underline */
.nav-link:hover,
.nav-link.active {
  color: var(--myst-ink);
}

.nav-underline {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 2px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--myst-gold), transparent);
}

/* ---- Actions ---- */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
}

.mobile-nav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 36px;
  background: var(--myst-wash);
  border: 1px solid var(--myst-line-28);
  border-radius: 2px;
  color: var(--myst-gold);
  cursor: pointer;
  transition: all 0.25s ease;
}

.mobile-nav-toggle:hover {
  border-color: var(--myst-gold);
  background: var(--myst-wash-strong);
}

/* the icon's own stroke is a fixed near-white; follow the theme's ink instead */
.mobile-nav-toggle :deep(path) {
  stroke: var(--myst-ink);
}

/* The language code sits at the same height as the chip and the sign-in button beside it. */
.header-lang :deep(.lang-ritual-trigger) {
  min-height: 34px;
  padding: 0 10px;
}

/* ---- Light/dark switch: a square the height of the language control beside it ---- */
.theme-toggle-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

/* the reason the light is refused: a small dark slip under the button */
.theme-refusal {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 5;
  width: max-content;
  max-width: min(260px, 70vw);
  padding: 8px 11px;
  border-radius: 6px;
  background: #121116;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35), inset 0 0 0 1px rgba(255, 255, 255, .08);
  color: #e9e8ee;
  font-size: 12.5px;
  line-height: 1.4;
  letter-spacing: normal;
  text-transform: none;
  animation: theme-refusal-in .22s ease both;
  pointer-events: none;
}

@keyframes theme-refusal-in {
  from { opacity: 0; transform: translateY(-4px); }
}

/* the button gives a small shake as the light is turned away */
.theme-toggle.is-refused .theme-toggle__icon {
  animation: theme-refused .42s ease;
}

@keyframes theme-refused {
  20% { transform: rotate(-14deg); }
  45% { transform: rotate(10deg); }
  70% { transform: rotate(-5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .theme-refusal,
  .theme-toggle.is-refused .theme-toggle__icon {
    animation: none;
  }
}

.theme-toggle {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  background: color-mix(in srgb, var(--myst-ink) 3%, transparent);
  border: 1px solid var(--myst-line-14);
  border-radius: 4px;
  color: var(--myst-ink-muted);
  cursor: pointer;
  transition: color .25s ease, border-color .25s ease;
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--myst-ink);
  outline-offset: 2px;
}

.theme-toggle__icon {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/*
 * One hover for every control in the bar (server chip, language, theme, profile, menu):
 * the hairline turns accent, a faint accent wash, the label inks, and the control lifts
 * 2px. The solid sign-in button keeps its fill and brightens instead. A press sets it down.
 */
.header-actions :deep(:is(.ip-chip, .lang-ritual-trigger, .profile-chip)),
.header-actions .theme-toggle,
.header-actions .mobile-nav-toggle {
  background: color-mix(in srgb, var(--myst-ink) 3%, transparent);
  border: 1px solid var(--myst-line-14);
  color: var(--myst-ink);
  transition: color .25s ease, background-color .25s ease, border-color .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

/*
 * One label for every control in the bar: the 11px label size, in ink (the language code
 * was accent, the theme icon muted, the address 11.5px and the player count 10px). The
 * player count keeps its status green. :root and the grid raise this over the homepage's
 * light-theme tint of the language code.
 */
:root .header-stack .header-grid .header-actions :deep(:is(.ip-chip, .lang-label)) {
  font-size: 11px;
  color: var(--myst-ink);
}

.header-actions :deep(:is(.chip-players, .chip-copied)) {
  font-size: inherit;
}

.header-actions :deep(:is(.ip-chip, .lang-ritual-trigger, .profile-chip)):hover,
.header-actions .theme-toggle:hover,
.header-actions .mobile-nav-toggle:hover {
  background: var(--myst-wash);
  border-color: var(--myst-line-55);
  color: var(--myst-ink);
  transform: translateY(-2px);
}

/* The homepage's solid fill where it has one (near-black on paper for the olive accents). */
.header-actions :deep(.login-button) {
  background: var(--acc-solid, var(--myst-gold));
  color: var(--arc-on-acc, var(--myst-on-gold));
  transition: filter .2s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.header-actions :deep(.login-button):hover {
  background: var(--acc-solid, var(--myst-gold));
  color: var(--arc-on-acc, var(--myst-on-gold));
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.header-actions :deep(:is(.ip-chip, .lang-ritual-trigger, .profile-chip, .login-button)):active,
.header-actions .theme-toggle:active,
.header-actions .mobile-nav-toggle:active {
  transform: scale(.98);
  transition-duration: .08s;
}

/* ---- Responsive ladder: the server chip goes first (the page repeats the address),
   then the tagline; the language control never leaves the bar. ---- */
@media (max-width: 1220px) {
  .header-chip {
    display: none;
  }
}

@media (max-width: 960px) {
  .brand-tagline {
    display: none;
  }

  .nav-link {
    padding: 8px 8px;
    letter-spacing: 0.06em;
    font-size: 10.5px;
  }
}

@media (max-width: 800px) {
  .primary-nav {
    display: none;
  }

  .desktop-only {
    display: none;
  }

  .mobile-nav-toggle {
    display: flex;
  }

  .header-grid {
    padding: 0 16px;
  }

  .header-actions {
    gap: 10px;
  }
}

/* Signed in, the bar also carries the bell, the profile chip and the staff/logout
   buttons: below 1025px the full nav no longer fits beside them (it ran into the
   brand and the actions), so the bar switches to the drawer earlier. The drawer
   already holds the bell and the account controls. */
/* the narrowest phones (320-359px): the mark alone, so the wordmark never runs into the controls */
@media (max-width: 359px) {
  .header-grid .brand:not(.compact) .brand-words {
    display: none;
  }
}

@media (max-width: 1024px) {
  .site-header.is-authed .primary-nav,
  .site-header.is-authed .desktop-only {
    display: none;
  }

  .site-header.is-authed .mobile-nav-toggle {
    display: flex;
  }

  .site-header.is-authed .header-grid {
    padding: 0 16px;
  }

  .site-header.is-authed .header-actions {
    gap: 10px;
  }
}

/* ---- Mobile drawer: a panel from the right, in the page's font and accent ---- */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  justify-content: flex-end;
  /* the homepage hands its one font to <body> (the drawer is teleported there) */
  font-family: var(--drawer-font, var(--myst-font-body));
}

.mobile-nav-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.mobile-nav {
  --drawer-acc: var(--acc, var(--myst-gold));
  position: relative;
  width: min(86vw, 340px);
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-left: 1px solid var(--myst-line-16);
  border-radius: 20px 0 0 20px;
  background:
    radial-gradient(120% 50% at 100% 0%, color-mix(in oklab, var(--drawer-acc) 12%, transparent), transparent 70%),
    var(--myst-bg-deep);
  box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
}

.mobile-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 16px 20px;
}

.mobile-nav-close {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: color-mix(in oklab, var(--myst-offwhite) 6%, transparent);
  border: 1px solid var(--myst-line-16);
  border-radius: 12px;
  color: var(--myst-offwhite);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mobile-nav-close:hover {
  background: color-mix(in oklab, var(--myst-offwhite) 12%, transparent);
}

.mobile-nav-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 12px 24px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  color: var(--myst-ink-muted);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.mobile-nav-link:hover {
  color: var(--myst-offwhite);
  background: color-mix(in oklab, var(--myst-offwhite) 6%, transparent);
}

.mobile-nav-link.active {
  color: var(--myst-offwhite);
  background: color-mix(in oklab, var(--drawer-acc) 16%, transparent);
  box-shadow: inset 3px 0 0 var(--drawer-acc);
}

.mobile-services {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--myst-line-12);
}

.mobile-service-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 14px;
  border-radius: 12px;
  color: inherit;
  transition: background-color 0.2s ease;
}

.mobile-service-link:hover {
  background: color-mix(in oklab, var(--myst-offwhite) 6%, transparent);
  color: inherit;
}

.mobile-service-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--drawer-acc);
}

.mobile-service-link span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-service-link strong {
  color: var(--myst-offwhite);
  font-size: 15px;
  font-weight: 600;
}

.mobile-service-link small {
  color: var(--myst-ink-muted);
  font-size: 12.5px;
}

.mobile-nav-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 18px 2px 0;
}

.mobile-ip {
  width: 100%;
  min-height: 42px;
  justify-content: center;
  border-radius: 12px;
}

/* the login button and the profile chip: rounded like the rest of the drawer */
.mobile-nav-footer :deep(.auth-cluster.mobile) {
  width: 100%;
}

.mobile-nav-footer :deep(.auth-cluster.mobile a),
.mobile-nav-footer :deep(.auth-cluster.mobile button) {
  border-radius: 12px;
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-nav-enter-active .mobile-nav,
.mobile-nav-leave-active .mobile-nav {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
}

.mobile-nav-enter-from .mobile-nav,
.mobile-nav-leave-to .mobile-nav {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-enter-active .mobile-nav,
  .mobile-nav-leave-active .mobile-nav {
    transition: none;
  }
}

/* ---- Light theme (pages other than the homepage, which re-points these itself) ---- */
/* on paper the gold mark is inked, as on the homepage */
:where(:root[data-theme="parchment"]) .brand-mark {
  filter: grayscale(1) brightness(.4) contrast(1.3) drop-shadow(0 0 6px rgba(180, 44, 62, .3));
}

/* :where() keeps this below the homepage's own season-bar tint */
:where(:root[data-theme="parchment"]) .season-bar {
  background: linear-gradient(90deg, transparent, rgba(180, 44, 62, .1), transparent);
}

:root[data-theme="parchment"] .mobile-nav-backdrop {
  background: var(--myst-overlay);
}

:root[data-theme="parchment"] .mobile-nav-link:hover,
:root[data-theme="parchment"] .mobile-nav-link.active,
:root[data-theme="parchment"] .mobile-service-link:hover {
  background: var(--myst-wash);
}
</style>
