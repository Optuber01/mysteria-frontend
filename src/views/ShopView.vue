<template>
  <ArcPage :title="t('shopPage.title')" :lede="t('shopPage.lede')">
    <ContentLanguageNotice/>

    <ShopBalance/>

    <section class="store-catalogue" aria-labelledby="store-catalogue-title">
      <h2 id="store-catalogue-title" class="arc-sr">{{ currentTabLabel }}</h2>

      <ArcState v-if="isShopLoading" kind="loading" :text="t('shopPage.loading')"/>
      <ArcState
          v-else-if="shopError"
          kind="error"
          :text="t('shopPage.loadFailed')"
          :retry-label="t('shopPage.retry')"
          @retry="retryLoading"
      />

      <template v-else>
        <ArcTabs v-model="activeTab" :tabs="tabs" :label="t('shopPage.tabsLabel')" controls="store-items"/>

        <div id="store-items" class="store-catalogue__panel" role="tabpanel" :aria-label="currentTabLabel">
          <ul v-if="visibleItems.length" class="arc-grid store-catalogue__grid">
            <li v-for="(item, index) in visibleItems" :key="item.id">
              <ShopItemCard
                  :image-priority="index < 3 ? 'high' : 'auto'"
                  :item="item"
                  @purchase="handlePurchase"
              />
            </li>
          </ul>
          <ArcState v-else :text="t('shopPage.empty')"/>
        </div>
      </template>
    </section>

    <StorePurchaseDialog ref="purchase"/>
    <DailyBonusCat page="shop"/>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcState from "@/components/arcana/ArcState.vue";
import ArcTabs from "@/components/arcana/ArcTabs.vue";
import ContentLanguageNotice from "@/components/ui/ContentLanguageNotice.vue";
import DailyBonusCat from "@/components/ui/DailyBonusCat.vue";
import ShopBalance from "@/components/shop/ShopBalance.vue";
import ShopItemCard from "@/components/shop/ShopItemCard.vue";
import StorePurchaseDialog from "@/components/shop/StorePurchaseDialog.vue";
import {useBalanceStore} from "@/stores/balance";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {breadcrumbLd, useSeo} from "@/composables/useSeo";
import {createSlug} from "@/utils/slug";

const authStore = useAuthStore();
const shopStore = useBalanceStore();
const {t, currentLanguage} = useI18n();

const purchase = ref<InstanceType<typeof StorePurchaseDialog> | null>(null);
const isShopLoading = ref(true);
const shopError = ref(false);
const activeTab = ref<string>("all");

useSeo(() => ({
  title: t("shopPage.title"),
  description: t("shopPage.lede"),
  path: "/store",
  jsonLd: [breadcrumbLd([{name: "Home", path: "/"}, {name: "Store", path: "/store"}])],
}));

const activeItems = computed(() => shopStore.items.filter(item => item.is_active));

/* The categories come from the store's backend in English; known ones are translated. */
const categoryLabel = (category: string) => {
  const key = `shopPage.categories.${createSlug(category)}`;
  const translated = t(key);
  return translated === key ? category : translated;
};

const categories = computed(() => {
  const counts = new Map<string, number>();
  activeItems.value.forEach(item => {
    if (!item.category) return;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  });
  return [...counts.entries()]
      .map(([id, count]) => ({id, label: categoryLabel(id), count}))
      .sort((a, b) => a.label.localeCompare(b.label));
});

const tabs = computed(() => [
  {id: "all", label: t("shopPage.tabAll"), count: activeItems.value.length},
  ...categories.value,
]);
const currentTabLabel = computed(() => tabs.value.find(tab => tab.id === activeTab.value)?.label ?? t("shopPage.tabAll"));

/* cheapest first, the way a reader scans a price list */
const visibleItems = computed(() => {
  const items = activeTab.value === "all"
      ? activeItems.value
      : activeItems.value.filter(item => item.category === activeTab.value);
  return [...items].sort((a, b) => a.price.comparedTo(b.price) || a.name.localeCompare(b.name));
});

/* Fall back to "all" when the active category disappears (e.g. language reload). */
watch(categories, list => {
  if (activeTab.value !== "all" && !list.some(category => category.id === activeTab.value)) {
    activeTab.value = "all";
  }
});

const handlePurchase = (itemId: string) => {
  const item = shopStore.items.find(candidate => candidate.id === itemId);
  if (item) purchase.value?.open(item);
};

/* ---------------- Data loading ---------------- */

/* the store fills its list in an idle callback, so wait for it before leaving "loading" */
const whenListed = () => new Promise<void>(resolve => {
  if (shopStore.items.length || !shopStore.services.length) return resolve();
  const stop = watch(() => shopStore.items.length, n => {
    if (n) {
      stop();
      resolve();
    }
  });
});

async function load(requireAuth: boolean) {
  isShopLoading.value = true;
  shopError.value = false;
  try {
    await shopStore.fetchServices(requireAuth);
    await whenListed();
    if (!shopStore.services.length) shopError.value = true;
  } finally {
    isShopLoading.value = false;
  }
}

onMounted(async () => {
  if (shopStore.items.length === 0) await load(false);
  else isShopLoading.value = false;
  if (authStore.isAuthenticated && !shopStore.balance) await shopStore.fetchBalance();
});

watch(currentLanguage, async (newLanguage, oldLanguage) => {
  if (!oldLanguage || newLanguage === oldLanguage) return;
  await load(false);
});

const retryLoading = () => load(false);
</script>

<script lang="ts">
export default {name: "ShopView"};
</script>

<style scoped>
.store-catalogue__panel {
  margin-top: var(--arc-group-gap);
}

.store-catalogue__grid {
  --arc-grid-min: 300px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 420px) {
  .store-catalogue__grid {
    --arc-grid-min: 260px;
  }
}
</style>
