<template>
  <ArcPage :title="pageTitle" :back="{to: $lp('/store'), label: t('servicePage.back')}">
    <template v-if="summary" #lede>{{ summary }}</template>

    <ContentLanguageNotice/>

    <ArcState v-if="loading && !service" kind="loading" :text="t('servicePage.loading')"/>

    <ArcState v-else-if="!service" kind="error">
      {{ t('servicePage.notFound') }}
      <RouterLink :to="$lp('/store')" class="arc-link">{{ t('servicePage.toStore') }}</RouterLink>
    </ArcState>

    <div v-else class="svc">
      <div class="svc__main">
        <figure v-if="service.imageUrl && !imageFailed" class="svc__figure">
          <img
              :src="service.imageUrl"
              alt=""
              class="svc__image"
              decoding="async"
              fetchpriority="high"
              width="1280"
              height="720"
              @error="imageFailed = true"
          >
        </figure>

        <div v-if="renderedContent" v-dompurify-html="renderedContent" class="arc-prose svc__prose"></div>
        <template v-else>
          <ul v-if="listed?.points?.length" class="arc-prose svc__points">
            <li v-for="(point, index) in listed.points" :key="index">{{ point.text }}</li>
          </ul>
          <p class="arc-muted">{{ t('servicePage.noDescription') }}</p>
        </template>
      </div>

      <!-- the order: always in reach (beside the text on wide screens, a bar at the bottom on phones) -->
      <aside class="svc__aside" :aria-label="t('servicePage.buyLabel')">
        <div class="arc-panel svc-buy">
          <p class="svc-buy__price">
            <span class="svc-buy__now">{{ price.main(unitPrice) }}</span>
            <span v-if="price.inMarks(unitPrice)" class="svc-buy__marks">{{ price.inMarks(unitPrice) }}</span>
          </p>

          <div class="svc-buy__tags">
            <span class="arc-tag">{{ termLabel }}</span>
            <span v-if="giftable" class="arc-tag">
              <i class="fa-solid fa-gift" aria-hidden="true"></i>{{ t('shopPage.giftable') }}
            </span>
            <span v-if="bulkable" class="arc-tag">
              <i class="fa-solid fa-layer-group" aria-hidden="true"></i>{{ t('servicePage.bulk') }}
            </span>
          </div>

          <button type="button" class="arc-btn arc-btn--solid svc-buy__action" @click="buy">
            {{ signedIn ? t('shopPage.buy') : t('shopPage.signInToBuy') }}
          </button>

          <p class="svc-buy__balance">
            <template v-if="signedIn">
              {{ t('servicePage.yourBalance') }}: <strong>{{ balanceLabel }}</strong>
              <br>
              <a :href="price.topUpUrl.value" class="arc-link" target="_blank" rel="noopener noreferrer">
                {{ t('shopPage.balance.topUp') }}<span class="arc-sr"> ({{ t('shopPage.newTab') }})</span>
              </a>
              ·
            </template>
            <RouterLink :to="$lp('/help') + '#top-ups'" class="arc-link">{{ t('shopPage.balance.howTitle') }}</RouterLink>
          </p>
        </div>
      </aside>

      <div class="svc-bar">
        <p class="svc-bar__price">
          <strong>{{ price.main(unitPrice) }}</strong>
          <span v-if="price.inMarks(unitPrice)">{{ price.inMarks(unitPrice) }}</span>
        </p>
        <button type="button" class="arc-btn arc-btn--solid arc-btn--sm" @click="buy">
          {{ signedIn ? t('shopPage.buy') : t('shopPage.signInToBuy') }}
        </button>
      </div>
    </div>

    <StorePurchaseDialog ref="purchase"/>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import MarkdownIt from 'markdown-it';
import Decimal from 'decimal.js';
import ArcPage from '@/components/arcana/ArcPage.vue';
import ArcState from '@/components/arcana/ArcState.vue';
import ContentLanguageNotice from '@/components/ui/ContentLanguageNotice.vue';
import StorePurchaseDialog from '@/components/shop/StorePurchaseDialog.vue';
import {useStorePrice} from '@/components/shop/useStorePrice';
import {useTermLabel} from '@/components/shop/useTermLabel';
import {shopAPI} from '@/utils/api/shop';
import type {ServiceMarkdownDto} from '@/types/services';
import {useI18n} from '@/composables/useI18n';
import {contentLocale} from '@/locales';
import {useAuthStore} from '@/stores/auth';
import {useBalanceStore} from '@/stores/balance';
import {breadcrumbLd, useSeo} from '@/composables/useSeo';
import {vDompurifyHtml} from '@/directives/dompurifyHtml';

const route = useRoute();
const {t, currentLanguage} = useI18n();
const authStore = useAuthStore();
const balanceStore = useBalanceStore();
const price = useStorePrice();

const service = ref<ServiceMarkdownDto | null>(null);
const loading = ref(true);
const imageFailed = ref(false);
const purchase = ref<InstanceType<typeof StorePurchaseDialog> | null>(null);

const signedIn = computed(() => authStore.isAuthenticated);

/* The item's page carries its long text; the store's list carries the rest (summary,
   term, gifting, bulk). Buying needs the list too, so it is loaded here when missing. */
const listed = computed(() => service.value
    ? balanceStore.items.find(item => item.id === String(service.value?.id)) ?? null
    : null);

const pageTitle = computed(() => {
  if (service.value) return service.value.name;
  return loading.value ? t('servicePage.loading') : t('servicePage.notFoundTitle');
});
const summary = computed(() => listed.value?.description ?? '');
const unitPrice = computed(() => new Decimal((listed.value?.price ?? service.value?.price ?? 0).toString()));
const termLabel = useTermLabel(() => listed.value?.duration_months);
const giftable = computed(() => listed.value?.is_giftable ?? service.value?.isGiftable ?? false);
const bulkable = computed(() => listed.value?.is_bulkable ?? service.value?.isBulkable ?? false);
const balanceLabel = computed(() => {
  const amount = balanceStore.currentBalance?.amount;
  return amount === undefined ? '…' : price.marks(amount);
});

const md = new MarkdownIt({html: true, linkify: true, typographer: true});

/* The text opens with its own "# Name": the page head already says it, and the page
   keeps one h1, so that line goes and any other top-level heading steps down. */
const renderedContent = computed(() => {
  const source = service.value?.markdownContent;
  if (!source) return '';
  return md.render(source.replace(/^\s*#\s[^\n]*\n+/, '').replace(/^#\s/gm, '## '));
});

const buy = () => {
  const item = listed.value ?? service.value;
  if (item) purchase.value?.open(item);
};

useSeo(() => {
  const item = service.value;
  if (!item) {
    return {
      title: t('servicePage.loading'),
      description: t('shopPage.lede'),
      noindex: true,
    };
  }

  const slug = route.params.slug as string;
  // Services carry markdown, not a summary field - flatten the opening prose.
  const flat = (item.markdownContent || '')
      .replace(/!\[[^\]]*]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~`>#-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const description = summary.value || flat || `${item.name} - ${t('shopPage.lede')}`;

  return {
    title: item.name,
    description,
    path: `/services/${slug}`,
    image: item.imageUrl || undefined,
    imageAlt: item.name,
    jsonLd: [
      breadcrumbLd([
        {name: 'Home', path: '/'},
        {name: 'Store', path: '/store'},
        {name: item.name, path: `/services/${slug}`},
      ]),
    ],
  };
});

async function loadService() {
  const slug = route.params.slug as string;
  if (!slug) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const response = await shopAPI.getServiceContent(slug, contentLocale(currentLanguage.value));
    service.value = response.data;
    imageFailed.value = false;
  } catch (error) {
    console.error('Failed to load service:', error);
    service.value = null;
  } finally {
    loading.value = false;
  }
}

const loadList = () => balanceStore.fetchServices(false);

watch(() => route.params.slug, (next, previous) => {
  if (next && next !== previous) loadService();
});

watch(currentLanguage, (next, previous) => {
  if (!previous || next === previous) return;
  loadService();
  loadList();
});

onMounted(() => {
  loadService();
  if (!balanceStore.services.length) loadList();
  if (authStore.isAuthenticated && !balanceStore.balance) balanceStore.fetchBalance();
});
</script>

<script lang="ts">
export default {
  name: "ServiceView",
};
</script>

<style scoped>
.svc {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: clamp(28px, 4vw, 64px);
  align-items: start;
}

.svc__main {
  display: grid;
  gap: var(--arc-group-gap);
  min-width: 0;
}

.svc__figure {
  margin: 0;
  overflow: hidden;
  border-radius: var(--arc-r-lg);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  background: var(--arc-card-2);
}

.svc__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

/* the text's first heading follows the picture, not a paragraph */
.svc__prose > :first-child {
  margin-top: 0;
}

.svc__points {
  margin: 0;
}

.svc__aside {
  position: sticky;
  top: calc(var(--site-header-stack, 106px) + 16px);
}

.svc-buy {
  display: grid;
  gap: 16px;
}

.svc-buy__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.svc-buy__now {
  font-size: clamp(28px, 2.4vw, 34px);
  font-weight: 650;
  line-height: 1.1;
}

.svc-buy__marks {
  color: var(--arc-muted);
}

.svc-buy__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.svc-buy__action {
  width: 100%;
}

.svc-buy__balance {
  margin: 0;
  padding-top: 14px;
  border-top: var(--arc-bw) solid var(--arc-line);
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.8;
}

.svc-buy__balance strong {
  color: var(--arc-ink);
  font-weight: 600;
}

.svc-bar {
  display: none;
}

/* phones: the panel follows the text in flow and a bar keeps the price and the buy
   button at the bottom of the screen while the page is read */
@media (max-width: 900px) {
  .svc {
    grid-template-columns: minmax(0, 1fr);
  }

  .svc__aside {
    position: static;
  }

  .svc-buy__action {
    display: none;
  }

  .svc-bar {
    position: sticky;
    bottom: 12px;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 10px 10px 18px;
    border-radius: var(--arc-r-lg);
    background: var(--arc-pop);
    box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 12px 36px var(--arc-shadow);
  }

  .svc-bar__price {
    display: grid;
    margin: 0;
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
  }

  .svc-bar__price strong {
    font-size: 19px;
    font-weight: 650;
  }

  .svc-bar__price span {
    color: var(--arc-muted);
    font-size: var(--arc-fs-caption);
  }
}
</style>
