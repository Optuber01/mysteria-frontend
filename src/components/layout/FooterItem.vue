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
  .footer-rail,
  .footer-legal { align-items: flex-start; flex-direction: column; }
  .footer-nav { gap-inline: 15px; }
  .footer-legal { gap: 4px; }
}

@media (max-width: 280px) {
  .site-footer { padding-inline: 10px; }
  .footer-nav { display: grid; grid-template-columns: 1fr; }
}
</style>
