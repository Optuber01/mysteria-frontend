<template>
  <footer class="site-footer">
    <div class="footer-rail">
      <RouterLink class="footer-brand" to="/" aria-label="Mysterria home">
        <IconLogo aria-hidden="true" />
        <span>Mysterria</span>
        <i class="footer-brand__dot" aria-hidden="true"></i>
      </RouterLink>

      <div class="footer-links-stack">
        <div class="footer-meta">
          <span class="footer-status" :class="`is-${status.state}`" role="status">
            <span class="footer-status__dot" aria-hidden="true"></span>
            {{ statusLabel }}
          </span>
          <a
            class="footer-meta__icon"
            href="https://discord.com/invite/jc7GSxBWgb"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mysterria Discord"
          >
            <IconDiscord aria-hidden="true" />
          </a>
          <a
            class="footer-meta__icon"
            href="https://wiki.mysterria.net/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mysterria Wiki"
          >
            <IconWiki aria-hidden="true" />
          </a>
        </div>

        <nav class="footer-nav" aria-label="Footer navigation">
          <RouterLink to="/pathways">Pathways</RouterLink>
          <RouterLink to="/guide">Guide</RouterLink>
          <RouterLink to="/rules">Rules</RouterLink>
          <RouterLink to="/store">Store</RouterLink>
          <RouterLink to="/staff">Staff</RouterLink>
          <a href="https://wiki.mysterria.net/" target="_blank" rel="noopener noreferrer">Wiki</a>
          <a href="https://map.mysterria.net/" target="_blank" rel="noopener noreferrer">Map</a>
          <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noopener noreferrer">Community</a>
        </nav>
      </div>
    </div>

    <div class="footer-legal">
      <p>© {{ currentYear }} Mysterria · Unofficial fan project · All rights reserved</p>
      <nav aria-label="Legal">
        <RouterLink to="/terms">Terms</RouterLink>
        <RouterLink to="/privacy">Privacy</RouterLink>
        <RouterLink to="/sla">SLA</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconLogo from '@/assets/icons/IconLogo.vue';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import IconWiki from '@/assets/icons/IconWiki.vue';
import { useSharedServerStatus } from '@/composables/useSharedServerStatus';

const currentYear = new Date().getFullYear();

const { status } = useSharedServerStatus();
const statusLabel = computed(() => {
  if (status.value.state === 'online') {
    return status.value.playersOnline !== null ? `Online · ${status.value.playersOnline} players` : 'Online';
  }
  if (status.value.state === 'loading') return 'Checking status';
  return 'Offline';
});
</script>

<style scoped>
.site-footer {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: 54px clamp(20px, 5vw, 76px) 22px;
  color: var(--ink, #221c14);
  background: linear-gradient(180deg, color-mix(in srgb, var(--journey-mid) 0%, transparent) 0%, var(--journey-mid) 160px);
  isolation: isolate;
}

.footer-rail {
  max-width: 1440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  margin: 0 auto;
  padding: 22px 0;
  border-top: 1px solid var(--hairline, #eae1d0);
  border-bottom: 1px solid var(--hairline, #eae1d0);
}

.footer-brand {
  flex: 0 0 auto;
  min-width: 44px;
  padding-inline: 2px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink, #221c14);
}
.footer-brand:hover,
.footer-brand:focus-visible { color: var(--ink, #221c14); }
.footer-brand :deep(img) { width: 40px; height: 40px; filter: none; }
.footer-brand__dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--primary, #7458e8);
}
.footer-brand span { font: 700 1.32rem/1 var(--font-display, "IBM Plex Sans Condensed", sans-serif); }

.footer-links-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 0;
}

.footer-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.footer-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 999px;
  color: var(--ink-muted, #756b5c);
  background: var(--surface-glass, rgba(255, 255, 255, .86));
  backdrop-filter: blur(14px);
  font: 700 .56rem/1 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.footer-status__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ink-muted, #756b5c);
}

.footer-status.is-online .footer-status__dot {
  background: var(--live, #34c77b);
  box-shadow: 0 0 5px rgba(52, 199, 123, .45);
}

.footer-status.is-online { color: var(--ink, #221c14); }

.footer-meta__icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 999px;
  color: var(--ink-muted, #756b5c);
  background: var(--surface-glass, rgba(255, 255, 255, .86));
  backdrop-filter: blur(14px);
  transition: color .25s, border-color .25s, background-color .25s;
}

.footer-meta__icon:hover,
.footer-meta__icon:focus-visible {
  color: var(--primary, #7458e8);
  border-color: color-mix(in srgb, var(--primary, #7458e8) 40%, transparent);
  background: var(--primary-tint, rgba(116, 88, 232, .12));
}

.footer-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 2px 19px;
}
.footer-nav a,
.footer-legal a {
  position: relative;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-muted, #756b5c);
  font: 700 .65rem/1 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .07em;
  text-transform: uppercase;
  transition: color .25s;
}

.footer-nav a { color: var(--ink, #221c14); }

.footer-nav a::after,
.footer-legal a::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 13px;
  height: 1px;
  background: var(--primary, #7458e8);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1);
}

.footer-nav a:hover,
.footer-nav a:focus-visible,
.footer-legal a:hover,
.footer-legal a:focus-visible { color: var(--ink, #221c14); }

.footer-nav a:hover::after,
.footer-nav a:focus-visible::after,
.footer-legal a:hover::after,
.footer-legal a:focus-visible::after { transform: scaleX(1); }

.footer-legal {
  position: relative;
  max-width: 1440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding-top: 18px;
}
.footer-legal::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--sunset, linear-gradient(90deg, #ff7a59, #ffc15e));
}
.footer-legal p {
  margin: 0;
  color: var(--ink-muted, #756b5c);
  font: 500 .59rem/1.5 var(--font-mono, "IBM Plex Mono", monospace);
  letter-spacing: .04em;
  text-transform: uppercase;
}
.footer-legal nav { display: flex; gap: 18px; }
.footer-legal a { min-height: 44px; font-size: .57rem; }

@media (max-width: 900px) {
  .footer-rail { align-items: flex-start; }
  .footer-links-stack { align-items: flex-start; }
  .footer-nav { justify-content: flex-start; }
}

@media (max-width: 680px) {
  .site-footer { padding-inline: 20px; }
  .footer-rail,
  .footer-links-stack,
  .footer-legal { align-items: flex-start; flex-direction: column; }
  .footer-meta { flex-wrap: wrap; }
  .footer-nav { gap-inline: 15px; }
  .footer-legal { gap: 4px; }
}

@media (max-width: 280px) {
  .site-footer { padding-inline: 10px; }
  .footer-nav { display: grid; grid-template-columns: 1fr; }
}
</style>
