<template>
  <footer :class="['site-footer', variant]">
    <div class="footer-shell">
      <div v-if="variant === 'full'" class="footer-columns">
        <div class="footer-identity">
          <RouterLink :to="$lp('/')" class="footer-brand">
            <img :src="logo" alt="" width="34" height="34">
            <span>Mysterria</span>
          </RouterLink>
          <p class="footer-disclaimer">{{ t('footer.disclaimer') }}</p>
        </div>

        <div class="footer-column footer-column--play">
          <p class="footer-heading">{{ t('footer.playHeading') }}</p>
          <RouterLink :to="$lp('/guide')">{{ t('footer.linkGuide') }}</RouterLink>
          <RouterLink :to="$lp('/pathways')">{{ t('footer.linkArchive') }}</RouterLink>
          <RouterLink :to="$lp('/rules')">{{ t('footer.linkRules') }}</RouterLink>
          <RouterLink :to="$lp('/staff')">{{ t('footer.linkStaff') }}</RouterLink>
          <RouterLink :to="$lp('/#companion')">{{ t('footer.linkCompanion') }}</RouterLink>
        </div>

        <div class="footer-column footer-column--account">
          <p class="footer-heading">{{ t('footer.accountHeading') }}</p>
          <RouterLink :to="$lp('/profile')">{{ t('footer.linkDossier') }}</RouterLink>
          <RouterLink :to="$lp('/store')">{{ t('footer.linkShop') }}</RouterLink>
          <RouterLink :to="$lp('/news')">{{ t('footer.linkNews') }}</RouterLink>
        </div>

        <div class="footer-column footer-column--community">
          <p class="footer-heading">{{ t('footer.communityHeading') }}</p>
          <a href="https://discord.com/invite/jc7GSxBWgb" rel="noopener noreferrer" target="_blank">
            {{ t('servicesDiscord') }}
          </a>
          <a href="https://wiki.mysterria.net/" rel="noopener noreferrer" target="_blank">
            {{ t('navWiki') }}
          </a>
          <a href="https://map.mysterria.net/" rel="noopener noreferrer" target="_blank">
            {{ t('servicesMap') }}
          </a>
        </div>
      </div>

      <div class="footer-baseline">
        <span class="footer-copy">© {{ year }} Mysterria † {{ SERVER_IP }}</span>
        <nav class="footer-legal" :aria-label="t('footer.legalLabel')">
          <template v-if="variant === 'slim'">
            <RouterLink :to="$lp('/')">{{ t('navHome') }}</RouterLink>
            <RouterLink :to="$lp('/guide')">{{ t('navGame') }}</RouterLink>
            <RouterLink :to="$lp('/store')">{{ t('navShop') }}</RouterLink>
            <RouterLink :to="$lp('/rules')">{{ t('navRules') }}</RouterLink>
          </template>
          <template v-else>
            <RouterLink :to="$lp('/terms')">{{ t('termsViewTitle') }}</RouterLink>
            <RouterLink :to="$lp('/privacy')">{{ t('privacyViewTitle') }}</RouterLink>
            <RouterLink :to="$lp('/sla')">{{ t('slaViewTitle') }}</RouterLink>
          </template>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import {useI18n} from "@/composables/useI18n";
import {SERVER_IP} from "@/composables/useServer";
import logo from "@/assets/icons/sources/IconLogo-128.webp";

withDefaults(defineProps<{ variant?: "full" | "slim" }>(), {variant: "slim"});

const {t} = useI18n();
const year = new Date().getFullYear();
</script>

<style scoped>
.site-footer {
  background: var(--myst-bg);
  border-top: 1px solid var(--myst-line-16);
}

.site-footer.full {
  padding: 64px 24px 36px;
}

.site-footer.slim {
  padding: 36px 24px;
}

.footer-shell {
  max-width: var(--myst-shell);
  margin: 0 auto;
}

.footer-columns {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid var(--myst-line-10);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  color: inherit;
}

.footer-brand:hover {
  color: inherit;
}

.footer-brand span {
  font-family: var(--myst-font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--myst-offwhite);
}

.footer-disclaimer {
  margin: 0;
  max-width: 34ch;
  color: var(--myst-ink-muted);
  font-size: 13px;
  line-height: 1.7;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.footer-heading {
  margin: 0 0 5px;
  font-family: var(--myst-font-mono);
  /* the page's label: 11px caps at .14em (as the header's) */
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--myst-gold);
}

.footer-column a {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--myst-ink-muted);
  transition: color 0.25s ease;
}

.footer-column a:hover {
  color: var(--myst-gold);
}

.footer-baseline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.site-footer.full .footer-baseline {
  padding-top: 28px;
}

.footer-copy,
.footer-legal a {
  font-family: var(--myst-font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  /* was a fixed grey at 55% (about 2.8:1 on the dark page, less on the light one) */
  color: color-mix(in srgb, var(--myst-ink-muted) 88%, transparent);
}

.footer-legal {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
}

.footer-legal a:hover {
  color: var(--myst-gold);
}

/* Light theme: the gold mark inked, as on the homepage (whose own rule outranks this) */
:where(:root[data-theme="parchment"]) .footer-brand img {
  filter: grayscale(1) brightness(.4) contrast(1.3);
}

/*
 * Phones and tablets: compact. The brand and its line on top, then two columns: Play down
 * the left, Account and Community stacked on the right (about half the old height).
 */
@media (max-width: 900px) {
  .site-footer.full {
    padding: 40px 20px 28px;
  }

  .footer-columns {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'identity identity'
      'play account'
      'play community';
    gap: 22px 24px;
    padding-bottom: 28px;
  }

  .footer-identity {
    grid-area: identity;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
  }

  .footer-brand {
    margin-bottom: 0;
  }

  .footer-disclaimer {
    flex: 1 1 260px;
    max-width: none;
    font-size: 12px;
    line-height: 1.55;
  }

  .footer-column--play { grid-area: play; }
  .footer-column--account { grid-area: account; }
  .footer-column--community { grid-area: community; }

  .footer-column {
    gap: 9px;
  }

  .footer-column a {
    font-size: 13.5px;
  }

  .site-footer.full .footer-baseline {
    padding-top: 18px;
  }
}

/* a tablet has room for the three groups side by side */
@media (min-width: 601px) and (max-width: 900px) {
  .footer-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'identity identity identity'
      'play account community';
  }
}

@media (max-width: 560px) {
  .footer-baseline {
    justify-content: center;
    gap: 10px 20px;
    text-align: center;
  }
}
</style>
