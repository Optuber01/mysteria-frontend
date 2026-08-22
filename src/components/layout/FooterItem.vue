<template>
  <footer class="site-footer">
    <div class="footer-rail">
      <RouterLink class="footer-brand" to="/" aria-label="Mysterria home">
        <IconLogo aria-hidden="true" />
        <span>Mysterria</span>
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
  color: #fcf9f2;
  background: #08151a;
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
  border-top: 1px solid rgba(252, 249, 242, .1);
  border-bottom: 1px solid rgba(252, 249, 242, .1);
}

.footer-brand {
  flex: 0 0 auto;
  min-width: 44px;
  padding-inline: 2px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #fcf9f2;
}
.footer-brand:hover { color: #fcf9f2; }
.footer-brand :deep(img) { width: 40px; height: 40px; }
.footer-brand span { font: 700 1.32rem/1 "IBM Plex Sans Condensed", sans-serif; }

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
  border: 1px solid rgba(252, 249, 242, .1);
  border-radius: 4px;
  color: rgba(252, 249, 242, .58);
  font: 500 .56rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.footer-status__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #52525b;
}

.footer-status.is-online .footer-status__dot {
  background: #4ade80;
  box-shadow: 0 0 5px rgba(74, 222, 128, .45);
}

.footer-status.is-online { color: rgba(252, 249, 242, .72); }

.footer-meta__icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(252, 249, 242, .12);
  border-radius: 8px;
  color: rgba(252, 249, 242, .66);
  transition: color .25s, border-color .25s, background-color .25s;
}

.footer-meta__icon:hover,
.footer-meta__icon:focus-visible {
  color: var(--myst-gold-soft);
  border-color: rgba(198, 155, 82, .45);
  background: rgba(198, 155, 82, .08);
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
  color: rgba(252, 249, 242, .72);
  font: 600 .65rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .07em;
  text-transform: uppercase;
  transition: color .25s;
}

.footer-nav a::after,
.footer-legal a::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 13px;
  height: 1px;
  background: var(--myst-gold-soft);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1);
}

.footer-nav a:hover,
.footer-nav a:focus-visible,
.footer-legal a:hover,
.footer-legal a:focus-visible { color: var(--myst-gold-soft); }

.footer-nav a:hover::after,
.footer-nav a:focus-visible::after,
.footer-legal a:hover::after,
.footer-legal a:focus-visible::after { transform: scaleX(1); }

.footer-legal {
  max-width: 1440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding-top: 18px;
  border-top: 1px solid rgba(198, 155, 82, .18);
}
.footer-legal p {
  margin: 0;
  color: rgba(252, 249, 242, .66);
  font: 500 .59rem/1.5 "IBM Plex Mono", monospace;
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
