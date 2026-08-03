<template>
  <footer class="site-footer">
    <div class="footer-rail">
      <RouterLink class="footer-brand" to="/" aria-label="Mysterria home">
        <IconLogo aria-hidden="true" />
        <span>Mysterria</span>
      </RouterLink>

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
import IconLogo from '@/assets/icons/IconLogo.vue';

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.site-footer {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: 30px clamp(20px, 5vw, 76px) 22px;
  color: #fcf9f2;
  background:
    #08151a;
  border-top: 1px solid rgba(252, 249, 242, .08);
  isolation: isolate;
}


.footer-address,
.footer-guide {
  min-height: 57px;
  display: inline-flex;
  align-items: center;
  border-radius: 13px;
  cursor: pointer;
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), border-color .25s, background-color .25s;
}

.footer-address {
  min-width: min(310px, 100%);
  justify-content: space-between;
  gap: 24px;
  padding: 9px 17px;
  border: 1px solid rgba(252, 249, 242, .18);
  color: #fcf9f2;
  background: rgba(252, 249, 242, .06);
  text-align: left;
  backdrop-filter: blur(12px);
}

.footer-address small {
  display: block;
  margin-bottom: 4px;
  color: rgba(252, 249, 242, .72);
  font: 600 .56rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.footer-address strong { font: 650 .73rem/1 "IBM Plex Mono", monospace; }
.footer-address b { color: #d7b978; font-size: .7rem; white-space: nowrap; }
.footer-address:hover { border-color: rgba(252, 249, 242, .36); background: rgba(252, 249, 242, .1); transform: translateY(-2px); }

.footer-guide {
  gap: 18px;
  padding: 0 18px;
  border: 1px solid #f5f0e6;
  color: #102924;
  background: #f5f0e6;
  font-size: .78rem;
  font-weight: 760;
}
.footer-guide svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
.footer-guide:hover { color: #102924; background: #fcf9f2; transform: translateY(-2px); }

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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #fcf9f2;
}
.footer-brand:hover { color: #fcf9f2; }
.footer-brand { min-width: 44px; padding-inline: 2px; }
.footer-brand :deep(img) { width: 40px; height: 40px; }
.footer-brand span { font: 700 1.32rem/1 "IBM Plex Sans Condensed", sans-serif; }

.footer-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 2px 19px;
}
.footer-nav a,
.footer-legal a {
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
.footer-nav a:hover,
.footer-legal a:hover { color: #d7b978; }

.footer-legal {
  max-width: 1440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding-top: 16px;
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
  .footer-nav { justify-content: flex-start; }
}

@media (max-width: 680px) {
  .site-footer { padding-inline: 20px; }
  .footer-gate { height: 66vw; }
  .footer-closing { margin-bottom: 84px; }
  .footer-actions { display: grid; }
  .footer-address,
  .footer-guide { width: 100%; }
  .footer-guide { justify-content: space-between; }
  .footer-rail,
  .footer-legal { align-items: flex-start; flex-direction: column; }
  .footer-nav { gap-inline: 15px; }
  .footer-legal { gap: 4px; }
}

@media (max-width: 280px) {
  .site-footer { padding-inline: 10px; }
  .footer-closing h2 { font-size: 2.8rem; overflow-wrap: anywhere; }
  .footer-address { min-width: 0; align-items: flex-start; flex-direction: column; gap: 8px; }
  .footer-address strong { overflow-wrap: anywhere; }
  .footer-nav { display: grid; grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .footer-address,
  .footer-guide { transition: none; }
}
</style>
