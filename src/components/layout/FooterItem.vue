<template>
  <footer class="site-footer">
    <div class="footer-fog" aria-hidden="true"></div>
    <div class="footer-orbit" aria-hidden="true"></div>

    <div class="footer-frame">
      <div class="footer-main">
        <section class="footer-brand">
          <RouterLink class="brand-lockup" to="/" aria-label="Mysterria home">
            <IconLogo/>
            <span><strong>Mysterria</strong><small>{{ labels.brandLine }}</small></span>
          </RouterLink>
          <h2>{{ labels.statement }}</h2>
          <ServerStatusChip/>
        </section>

        <nav class="footer-column" aria-label="Explore Mysterria">
          <p>{{ labels.explore }}</p>
          <RouterLink to="/guide">{{ labels.start }}</RouterLink>
          <RouterLink to="/pathways">{{ labels.pathways }}</RouterLink>
          <RouterLink to="/rules">{{ t("navRules") }}</RouterLink>
          <RouterLink to="/store">{{ t("navShop") }}</RouterLink>
        </nav>

        <nav class="footer-column" aria-label="Mysterria community">
          <p>{{ labels.community }}</p>
          <a href="https://wiki.mysterria.net/" rel="noopener noreferrer" target="_blank">{{ t("navWiki") }} <i>↗</i></a>
          <a href="https://discord.com/invite/jc7GSxBWgb" rel="noopener noreferrer" target="_blank">Discord <i>↗</i></a>
          <a href="https://map.mysterria.net/" rel="noopener noreferrer" target="_blank">{{ t("servicesMap") }} <i>↗</i></a>
          <RouterLink to="/staff">{{ t("navStaff") }}</RouterLink>
        </nav>

        <nav class="footer-column" aria-label="Legal information">
          <p>{{ labels.legal }}</p>
          <RouterLink to="/terms">{{ labels.terms }}</RouterLink>
          <RouterLink to="/privacy">{{ labels.privacy }}</RouterLink>
          <RouterLink to="/sla">{{ labels.sla }}</RouterLink>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} Mysterria</span>
        <span>{{ labels.disclaimer }}</span>
        <span class="footer-mark">M</span>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import IconLogo from "@/assets/icons/IconLogo.vue";
import ServerStatusChip from "@/components/ui/ServerStatusChip.vue";
import {useI18n} from "@/composables/useI18n";

const {currentLanguage, t} = useI18n();

const labels = computed(() => currentLanguage.value === "uk" ? {
  brandLine: "За сірим туманом",
  statement: "Система сил LOTM, відтворена у Minecraft.",
  explore: "Дослідити",
  start: "Почати",
  pathways: "Шляхи",
  community: "Спільнота",
  legal: "Правове",
  terms: "Умови користування",
  privacy: "Політика конфіденційності",
  sla: "Рівень обслуговування",
  disclaimer: "Неофіційний фанатський проєкт",
} : {
  brandLine: "Beyond the gray fog",
  statement: "The LOTM power system, rebuilt for Minecraft.",
  explore: "Explore",
  start: "Start here",
  pathways: "Pathways",
  community: "Community",
  legal: "Legal",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  sla: "Service Level Agreement",
  disclaimer: "Unofficial fan project",
});
</script>

<style scoped>
.site-footer {
  position: relative;
  overflow: hidden;
  padding: 64px 22px 22px;
  border-top: 1px solid rgba(238, 228, 208, .09);
  color: #eee4d1;
  font-family: var(--font-body);
  background:
      radial-gradient(circle at 12% 18%, rgba(157, 27, 48, .14), transparent 24rem),
      #07080b;
}

.footer-frame {
  position: relative;
  z-index: 2;
  width: min(1340px, 100%);
  margin: 0 auto;
}

.footer-main {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) repeat(3, minmax(130px, .62fr));
  gap: clamp(36px, 6vw, 90px);
  padding-bottom: 48px;
}

.footer-brand { max-width: 470px; }

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #eee4d1;
  text-decoration: none;
}

.brand-lockup :deep(.icon-logo) { width: 54px; height: 54px; }
.brand-lockup > span { display: flex; flex-direction: column; gap: 2px; }
.brand-lockup strong { font: 700 25px/1 var(--font-display); letter-spacing: -.03em; }
.brand-lockup small { color: #a49c91; font: 500 11px var(--font-ui); letter-spacing: .025em; }

.footer-brand h2 {
  max-width: 450px;
  margin: 26px 0 24px;
  font-family: var(--font-display);
  font-size: clamp(30px, 3vw, 42px);
  font-weight: 700;
  letter-spacing: -.03em;
  line-height: .98;
}

.footer-brand :deep(.server-chip) {
  min-height: 44px;
  padding-inline: 15px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, .025);
  font-family: var(--font-ui);
}

.footer-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-top: 10px;
}

.footer-column p {
  margin: 0 0 12px;
  color: #d8b65f;
  font: 600 12px var(--font-ui);
  letter-spacing: .025em;
}

.footer-column a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: #aaa297;
  font-family: var(--font-ui);
  font-size: 14px;
  text-decoration: none;
  transition: color var(--motion-fast) var(--ease-standard);
}

.footer-column a:hover { color: #eee4d1; }
.brand-lockup:focus-visible,
.footer-column a:focus-visible { outline: 2px solid #e5c46e; outline-offset: 4px; }
.footer-column i { margin-left: 4px; color: #d8b65f; font-style: normal; font-size: 11px; }

.footer-bottom {
  min-height: 64px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  border-top: 1px solid rgba(238, 228, 208, .08);
  color: #918a80;
  font: 500 11px var(--font-ui);
  letter-spacing: .025em;
}

.footer-bottom > span:nth-child(2) { text-align: center; }
.footer-mark { justify-self: end; color: #d8b65f; font: 700 24px var(--font-display); }

.footer-fog {
  position: absolute;
  inset: auto -10% -100px;
  height: 270px;
  opacity: .42;
  filter: blur(36px);
  background:
      radial-gradient(ellipse at 20% 50%, rgba(171, 181, 190, .22), transparent 42%),
      radial-gradient(ellipse at 56% 55%, rgba(171, 181, 190, .16), transparent 42%),
      radial-gradient(ellipse at 86% 45%, rgba(171, 181, 190, .18), transparent 42%);
}

.footer-orbit {
  position: absolute;
  top: -230px;
  right: -180px;
  width: 520px;
  aspect-ratio: 1;
  border: 1px solid rgba(216, 182, 95, .08);
  border-radius: 50%;
  box-shadow: inset 0 0 0 80px rgba(216, 182, 95, .01);
}

@media (max-width: 900px) {
  .footer-main { grid-template-columns: 1.4fr repeat(3, 1fr); gap: 38px; }
  .footer-brand { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .site-footer { padding: 54px 18px 20px; }
  .footer-main { grid-template-columns: repeat(2, 1fr); gap: 42px 28px; padding-bottom: 52px; }
  .footer-brand { grid-column: 1 / -1; }
  .footer-main .footer-column:last-child { grid-column: 1 / -1; }
  .footer-bottom { grid-template-columns: 1fr auto; padding-top: 20px; }
  .footer-bottom > span:nth-child(2) { display: none; }
}
</style>
