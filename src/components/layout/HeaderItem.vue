<template>
  <div ref="stackRef" :class="['header-stack', {'is-overlay': overlay, 'is-at-top': overlay && isAtTop}]">
  <header :class="['site-header', {'is-authed': isAuthenticated, 'is-crowded': crowded}]">
    <div class="header-grid">
      <RouterLink :to="$lp('/')" class="brand" @click="closeMobileNav">
        <!-- the name beside it names the link: the mark itself is decoration -->
        <img :src="logo" alt="" class="brand-mark" width="38" height="38">
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
        <!-- the wiki is a site of its own: players asked where it was -->
        <a class="nav-link nav-link--out" href="https://wiki.mysterria.net/" target="_blank" rel="noopener noreferrer">
          {{ t('navWiki') }}
          <i class="fa-solid fa-arrow-up-right-from-square nav-link__out" aria-hidden="true"></i>
          <span class="arc-sr">{{ t('header.newTab') }}</span>
        </a>
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
            :class="{'is-refused': refusalShake}"
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
          <Transition :css="false" @enter="refusalIn" @leave="refusalOut">
            <span v-if="refusalShown" id="theme-refusal" class="theme-refusal" role="status">{{ nightLock }}</span>
          </Transition>
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
            <template v-for="link in navigationLinks" :key="link.path">
              <RouterLink
                  :class="['mobile-nav-link', { active: isActive(link) }]"
                  :to="$lp(link.path)"
                  @click="closeMobileNav"
              >
                {{ link.title }}
              </RouterLink>
              <!-- the changelog archive is what many players come for: one tap from the menu, under News -->
              <RouterLink
                  v-if="link.path === '/news'"
                  class="mobile-nav-link mobile-nav-link--sub"
                  :to="$lp('/news?type=changelog')"
                  @click="closeMobileNav"
              >
                {{ t('newsPage.changelog') }}
              </RouterLink>
            </template>

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
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
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
  /** Fixed over the page and transparent until scrolled; used by the homepage hero. */
  overlay?: boolean;
}>(), {overlay: false});

const route = useRoute();
const {t, currentLanguage} = useI18n();
const {unprefixedPath} = useLocalePath();
const authStore = useAuthStore();
const {isLight, toggleTheme, nightLock, refused, nightFalls} = useTheme();
/*
 * The reason the light is refused, under the button: each press of the button while the
 * night is kept shows it or puts it away again (the icon gives a small shake), and it
 * also comes up when the page brings the night itself. Either way it fades out on its own.
 */
const refusalShown = ref(false);
const refusalShake = ref(false);
let refusalTimer = 0;
let shakeTimer = 0;
onUnmounted(() => {
  clearTimeout(refusalTimer);
  clearTimeout(shakeTimer);
});
function showRefusal(shown: boolean) {
  refusalShown.value = shown;
  clearTimeout(refusalTimer);
}
watch(refused, () => {
  showRefusal(!refusalShown.value);
  refusalShake.value = false;
  clearTimeout(shakeTimer);
  requestAnimationFrame(() => {
    refusalShake.value = true;
    shakeTimer = window.setTimeout(() => (refusalShake.value = false), 450);
  });
});
watch(nightFalls, () => showRefusal(true));
/*
 * Its fade runs on the Web Animations API, not a CSS transition: a theme switch suspends
 * every transition on the page for a frame (useTheme), which left it stuck unseen.
 */
const quiet = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function refusalIn(el: Element, done: () => void) {
  const frames = quiet() ? [{opacity: 0}, {opacity: 1}] : [{opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)'}, {opacity: 1, transform: 'none', filter: 'blur(0)'}];
  el.animate(frames, {duration: quiet() ? 200 : 600, easing: 'cubic-bezier(.2, .8, .2, 1)'}).finished.then(() => {
    done();
    // it stays a while once fully in, then sinks away on its own
    clearTimeout(refusalTimer);
    refusalTimer = window.setTimeout(() => (refusalShown.value = false), 5000);
  }, done);
}
function refusalOut(el: Element, done: () => void) {
  const frames = quiet() ? [{opacity: 0}] : [{opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)'}];
  el.animate(frames, {duration: quiet() ? 200 : 450, easing: 'ease', fill: 'forwards'}).finished.then(done, done);
}
watch(nightLock, lock => {
  if (!lock) showRefusal(false);
});
const isMobileNavOpen = ref(false);
const navigationRef = ref<HTMLElement | null>(null);

/*
 * Nav labels run longer in some languages (uk, de, fr...): where the nav doesn't fit beside
 * the brand and the controls, the bar switches to the drawer, as on phones, instead of
 * letting them overlap. What the bar holds changes at its breakpoints (the server chip, the
 * tagline), so every check starts from the full bar; both steps land before the next paint.
 */
const crowded = ref(false);
let fitObserver: ResizeObserver | null = null;
function measureNav() {
  const nav = navigationRef.value;
  const grid = nav?.parentElement;
  // hidden by the phone layout: nothing to fit
  if (!nav || !grid || !nav.offsetWidth) return;
  // the nav takes its full width and spills over its neighbours rather than shrinking,
  // so add up what the bar holds: brand, nav and controls, the padding, and at least 10px
  // either side of the nav (the grid gap gives way before anything touches)
  const style = getComputedStyle(grid);
  const brand = grid.firstElementChild as HTMLElement | null;
  const actions = grid.lastElementChild as HTMLElement | null;
  const needs = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + 2 * 10
      + (brand?.offsetWidth ?? 0) + nav.scrollWidth + (actions?.offsetWidth ?? 0);
  crowded.value = grid.clientWidth < needs;
}
function fitNav() {
  if (!crowded.value) return measureNav();
  crowded.value = false;
  void nextTick(measureNav);
}
const refit = fitNav;

const isAuthenticated = computed(() => authStore.isAuthenticated);
// a language or sign-in change changes what the bar holds: fit the nav again (fitNav above)
watch([currentLanguage, isAuthenticated], refit);

/* (the brand mark is the way home, as on every page) */
const navigationLinks = computed<NavLink[]>(() => [
  {path: "/guide", title: t("navGame"), matches: ["/help"]},
  {path: "/pathways", title: t("navPathways")},
  {path: "/store", title: t("navShop"), matches: ["/services"]},
  {path: "/rules", title: t("navRules")},
  {path: "/news", title: t("navNews")},
]);

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
  // Every page reads the header's live height (it changes with the viewport): pages under
  // the overlay header pad their content by it, and on the others sticky columns and
  // anchor targets stop below the sticky bar.
  const setStack = (height: number) => document.documentElement.style.setProperty("--site-header-stack", `${Math.round(height)}px`);
  // The overlay stack is a box of its own; elsewhere it is display: contents and the bar is the box.
  const box = props.overlay ? stackRef.value : stackRef.value?.querySelector<HTMLElement>('.site-header');
  // Measured once now, before the first paint, so the page never lays out under a guessed height.
  if (box) setStack(box.getBoundingClientRect().height);
  stackObserver = new ResizeObserver(([entry]) => setStack(entry.borderBoxSize[0].blockSize));
  if (box) stackObserver.observe(box);
  fitObserver = new ResizeObserver(() => fitNav());
  if (navigationRef.value?.parentElement) fitObserver.observe(navigationRef.value.parentElement);
  void document.fonts?.ready.then(refit);
  if (!props.overlay) return;
  readScroll();
  window.addEventListener("scroll", onScroll, {passive: true});
});

onUnmounted(() => {
  document.body.style.overflow = "";
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onDrawerKey);
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  fitObserver?.disconnect();
  // the variable stays: the next page's header sets its own, and clearing it here could undo that
  stackObserver?.disconnect();
});
</script>

<style scoped>
.nav-link--out {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-link__out {
  font-size: .7em;
  opacity: .7;
}

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

.header-stack.is-overlay .site-header::before {
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

.header-stack.is-overlay.is-at-top .site-header::before {
  opacity: 0;
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

/*
 * The reason the light is refused, in the world's own voice: no box, a line of pale
 * night-light on a soft pool of shadow under the button, coming up out of the dark.
 */
.theme-refusal {
  position: absolute;
  top: calc(100% + 8px);
  right: -18px;
  z-index: 5;
  width: max-content;
  max-width: min(300px, 74vw);
  padding: 14px 24px 16px;
  background: radial-gradient(closest-side, rgba(6, 6, 12, .92), rgba(6, 6, 12, .7) 55%, transparent);
  color: color-mix(in oklab, var(--acc, #98a2ff) 45%, #eceaf4);
  font-size: 13px;
  font-style: italic;
  line-height: 1.45;
  letter-spacing: .02em;
  text-align: center;
  text-shadow: 0 0 14px color-mix(in oklab, var(--acc, #98a2ff) 50%, transparent);
  text-transform: none;
  pointer-events: none;
}

/* it comes up out of the dark and sinks back into it (refusalIn / refusalOut) */

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
/* the nav didn't fit in this language (fitNav): the drawer, as on phones */
.site-header.is-crowded .primary-nav,
.site-header.is-crowded .desktop-only {
  display: none;
}

.site-header.is-crowded .mobile-nav-toggle {
  display: flex;
}

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

/* a page inside the one above it (News > Changelog): indented, a step smaller */
.mobile-nav-link--sub {
  min-height: 44px;
  padding-left: 30px;
  font-size: 15px;
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

:root[data-theme="parchment"] .mobile-nav-backdrop {
  background: var(--myst-overlay);
}

:root[data-theme="parchment"] .mobile-nav-link:hover,
:root[data-theme="parchment"] .mobile-nav-link.active,
:root[data-theme="parchment"] .mobile-service-link:hover {
  background: var(--myst-wash);
}
</style>
