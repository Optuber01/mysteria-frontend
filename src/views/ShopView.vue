<template>
  <div class="shop-view-wrapper">
    <HeaderItem/>

    <main id="main-content" :aria-busy="isShopLoading" class="shop-main" tabindex="-1">
      <div class="shop-container">
        <header class="market-header">
          <div>
            <span>{{ shopCopy.eyebrow }}</span>
            <h1>{{ shopCopy.title }}</h1>
            <p>{{ shopCopy.subtitle }}</p>
          </div>
          <div class="market-status"><i aria-hidden="true"></i>{{ shopCopy.status }}</div>
        </header>

        <!-- Loading state -->
        <div v-if="isShopLoading" aria-live="polite" class="shop-loading" role="status">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
          </div>
          <p class="loading-text">{{ t('shopLoading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="shopError" class="shop-error" role="alert">
          <div class="error-content">
            <span class="error-index">MARKET / OFFLINE</span>
            <h2>{{ shopCopy.errorTitle }}</h2>
            <p>{{ shopCopy.errorBody }}</p>
            <div class="error-actions">
              <button ref="retryButton" class="retry-btn" type="button" @click="retryLoading">
                <i aria-hidden="true" class="fa-solid fa-rotate-right"></i>{{ t('tryAgain') }}
              </button>
              <a href="https://discord.com/invite/jc7GSxBWgb" rel="noopener noreferrer" target="_blank">{{ shopCopy.discord }} ↗</a>
            </div>
          </div>
          <figure class="market-visual"><img alt="Mysterria town marketplace at night" height="800" src="@/assets/images/home/towns.jpg" width="1200"><figcaption>{{ shopCopy.caption }}</figcaption></figure>
        </div>

        <!-- Shop content -->
        <div v-else class="shop-content">
           <CategorySelector
               v-if="!selectedCategory"
               @select-category="handleCategorySelect"
               @retry="retryLoading"
          />
          <ShopItems
              v-else
              :selected-category="selectedCategory"
              @back-to-categories="handleBackToCategories"
          />
        </div>

        <!-- Purchase Confirmation Modal -->
        <ModalItem ref="confirmModal" :title="t('confirmPurchase') || 'Confirm Purchase'" size="md">
          <PurchaseModalContent
              v-if="selectedItem"
              v-model:amount="purchaseAmount"
               v-model:isGift="isGift"
               v-model:recipientId="recipientId"
               v-model:selectedServer="selectedServer"
               :item="selectedItem"
               @retry-balance="shopStore.fetchBalance"
          />

          <template #footer>
            <button class="btn-ritual-secondary" type="button" @click="cancelPurchase">
              {{ t('cancel') }}
            </button>
            <button
                :disabled="isProcessing || !shopStore.balance || insufficientFunds || (isGift && !recipientId) || (requiresServerSelection && !selectedServer)"
                :aria-busy="isProcessing"
                class="btn-ritual-primary"
                type="button"
                @click="confirmPurchase"
            >
              <i v-if="isProcessing" aria-hidden="true" class="fa-solid fa-spinner fa-spin"></i>
              {{ isProcessing ? t('processing') : (t('confirmPurchase') || 'Confirm Purchase') }}
            </button>
          </template>
        </ModalItem>
      </div>
    </main>

    <FooterItem/>
    <DailyBonusCat page="shop"/>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import HeaderItem from "@/components/layout/HeaderItem.vue";
import {useBalanceStore} from "@/stores/balance";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import ShopItems from "@/components/shop/ShopItems.vue";
import CategorySelector from "@/components/shop/CategorySelector.vue";
import ModalItem from "@/components/ui/ModalItem.vue";
import FooterItem from "@/components/layout/FooterItem.vue";
import PurchaseModalContent from "@/components/shop/PurchaseModalContent.vue";
import DailyBonusCat from "@/components/ui/DailyBonusCat.vue";
import Decimal from "decimal.js";

const authStore = useAuthStore();
const shopStore = useBalanceStore();
const route = useRoute();
const router = useRouter();
const {t, currentLanguage} = useI18n();
const confirmModal = ref<InstanceType<typeof ModalItem> | null>(null);
const isShopLoading = ref(true);
const shopError = ref<string | null>(null);
const selectedCategory = ref<string | null>(typeof route.query.category === 'string' ? route.query.category : null);
const retryButton = ref<HTMLButtonElement | null>(null);
const shopCopy = computed(() => currentLanguage.value === 'uk' ? {
  eyebrow: 'КРАМНИЦЯ MYSTERRIA', title: 'Крамниця', subtitle: 'Предмети, послуги та підтримка сервера в одному місці.', status: 'Безпечні покупки через Discord', errorTitle: 'Ринок зараз зачинено', errorBody: 'Не вдалося зв’язатися з крамницею. Ваші попередні покупки в безпеці. Спробуйте знову або перевірте оновлення у Discord.', discord: 'Перевірити Discord', caption: 'Ринок відкриється, щойно зв’язок відновиться.'
} : {
  eyebrow: 'MYSTERRIA MARKET', title: 'The Quartermaster', subtitle: 'Server items, services, and support in one dependable place.', status: 'Purchases secured through Discord', errorTitle: 'The market is closed for now', errorBody: 'We could not reach the shop. Your previous purchases are safe. Try again or check Discord for service updates.', discord: 'Check Discord', caption: 'The market will reopen when the connection returns.'
});

// Purchase state
const purchaseAmount = ref(1);
const isGift = ref(false);
const recipientId = ref('');
const selectedServer = ref('');
const isProcessing = ref(false);

const selectedItem = computed(() => {
  if (!shopStore.currentPurchase) return null;
  return shopStore.items.find(item => item.id === shopStore.currentPurchase?.id) || null;
});

const insufficientFunds = computed(() => {
  if (!selectedItem.value || !shopStore.balance) return true;
  const totalPrice = new Decimal(selectedItem.value.price).mul(purchaseAmount.value);
  return shopStore.balance.amount.lessThan(totalPrice);
});
const requiresServerSelection = computed(() => selectedItem.value?.server_availability?.mode === 'selectable');

const handleCategorySelect = (categoryId: string) => {
  selectedCategory.value = categoryId;
  void router.push({query: {...route.query, category: categoryId}});
};

const handleBackToCategories = () => {
  selectedCategory.value = null;
  const query = {...route.query};
  delete query.category;
  void router.push({query});
};

watch(() => route.query.category, (category) => {
  selectedCategory.value = typeof category === 'string' ? category : null;
});

watch(
    () => [route.query.category, shopStore.items.length] as const,
    ([category, itemCount]) => {
      if (typeof category !== 'string' || !itemCount) return;
      const isValid = shopStore.items.some(item => item.is_active && item.category === category);
      if (!isValid) handleBackToCategories();
    },
    {immediate: true},
);

const confirmPurchase = async () => {
  if (!selectedItem.value) return;

  try {
    isProcessing.value = true;
    const success = await shopStore.initiatePurchase(
        selectedItem.value.id,
         purchaseAmount.value,
        isGift.value ? recipientId.value : undefined,
        selectedServer.value || undefined
    );

    if (success) {
      shopStore.currentPurchase = null;
      confirmModal.value?.closeModal();
    }
  } catch (error) {
    console.error('Purchase failed:', error);
  } finally {
    isProcessing.value = false;
  }
};

const cancelPurchase = () => {
  shopStore.currentPurchase = null;
  confirmModal.value?.closeModal();
};

// Initialize shop data when component mounts
onMounted(async () => {
  try {
    console.log('ShopView mounted, auth state:', authStore.isAuthenticated);

    // Always fetch services (public access)
    if (shopStore.items.length === 0) {
      console.log('No items in store, fetching services');
      await shopStore.fetchServices(false); // false = no auth required
    }

    // Fetch balance only if authenticated
    if (authStore.isAuthenticated && !shopStore.balance) {
      console.log('User authenticated, fetching balance');
      await shopStore.fetchBalance();
    }

    console.log('Shop data loaded:', {
      itemsCount: shopStore.items.length,
      hasBalance: !!shopStore.balance,
      isAuthenticated: authStore.isAuthenticated
    });
  } catch (error) {
    console.error('Error loading shop data:', error);
    shopError.value = error instanceof Error ? error.message : 'shop-unavailable';
  } finally {
    isShopLoading.value = false;
  }
});

// Watch for auth state changes and reload data if needed
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  console.log('Auth state changed in ShopView:', isAuthenticated);

  if (isAuthenticated) {
    console.log('User authenticated, fetching balance');

    try {
      // Always fetch balance when user authenticates
      await shopStore.fetchBalance();

      // Re-fetch services with auth to get user-specific data if needed
      await shopStore.fetchServices(true);
    } catch (error) {
      console.error('Error reloading shop data after auth change:', error);
    }
  }
}, {immediate: false});

// Watch for language changes and reload services
watch(currentLanguage, async (newLanguage, oldLanguage) => {
  if (oldLanguage && newLanguage !== oldLanguage) {
    console.log('Language changed, reloading services:', oldLanguage, '->', newLanguage);

    isShopLoading.value = true;
    shopError.value = null;

    try {
      // Re-fetch services with new language
      const requireAuth = authStore.isAuthenticated;
      await shopStore.fetchServices(requireAuth);

      console.log('Services reloaded for language:', newLanguage);
    } catch (error) {
      console.error('Error reloading services after language change:', error);
      shopError.value = error instanceof Error ? error.message : 'Failed to reload services for new language';
    } finally {
      isShopLoading.value = false;
    }
  }
}, {immediate: false});

// Retry loading function
const retryLoading = async () => {
  console.log('Retrying shop data loading');
  shopError.value = null;
  isShopLoading.value = true;

  try {
    await Promise.all([
      shopStore.fetchServices(authStore.isAuthenticated),
      ...(authStore.isAuthenticated ? [shopStore.fetchBalance()] : [])
    ]);

    console.log('Retry successful, items:', shopStore.items.length);
  } catch (error) {
    console.error('Retry failed:', error);
    shopError.value = error instanceof Error ? error.message : 'Retry failed';
  } finally {
    isShopLoading.value = false;
    if (shopError.value) {
      await nextTick();
      retryButton.value?.focus();
    }
  }
};

watch(
    () => shopStore.currentPurchase,
    (newPurchase) => {
      if (newPurchase && confirmModal.value) {
        // Reset local state
        purchaseAmount.value = 1;
        isGift.value = false;
        recipientId.value = '';
        selectedServer.value = newPurchase.selectedServer || '';
        
        void shopStore.fetchBalance();
        confirmModal.value.showModal({
          title: t("confirmPurchase") || "Confirm Purchase"
        });
      }
    },
    {deep: true},
);
</script>

<script lang="ts">
export default {
  name: "ShopView",
};
</script>

<style scoped>
/* Layout wrapper to ensure footer stays at bottom */
.shop-view-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.shop-main {
  flex: 1 0 auto;
  min-height: calc(100svh - 72px);
  background:
      linear-gradient(90deg, rgba(200, 178, 115, .035) 1px, transparent 1px),
      linear-gradient(rgba(200, 178, 115, .025) 1px, transparent 1px),
      #090b12;
  background-size: 72px 72px;
}

.shop-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 120px 24px 80px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.market-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; max-width: 1200px; margin: 0 auto 54px; padding-bottom: 30px; border-bottom: 1px solid rgba(200, 178, 115, .18); }
.market-header > div:first-child { max-width: 720px; }
.market-header span, .error-index { color: var(--myst-gold); font: 700 11px var(--font-ui); letter-spacing: .12em; }
.market-header h1 { margin: 8px 0 10px; font: 750 clamp(42px, 7vw, 76px)/.96 var(--font-display); letter-spacing: -.04em; }
.market-header p { margin: 0; color: var(--myst-ink-muted); font-size: 17px; }
.market-status { display: flex; align-items: center; gap: 9px; color: #aaa7aa; font: 600 12px var(--font-ui); white-space: nowrap; }
.market-status i { width: 7px; height: 7px; border-radius: 50%; background: #5bd28a; box-shadow: 0 0 9px rgba(91, 210, 138, .45); }

.shop-content {
  margin-top: 30px;
  width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

@media (max-width: 576px) {
  .shop-container {
    padding: 10px;
    max-width: 100%;
  }

  .shop-content {
    margin-top: 20px;
  }
}

/* Loading state styles */
.shop-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px;
}

.shop-loading .loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.shop-loading .spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-radius: 50%;
  border-top: 3px solid var(--myst-gold, #4ade80);
  animation: spin 1s linear infinite;
}

.shop-loading .loading-text {
  color: var(--myst-ink-strong);
  font-size: 16px;
  font-weight: 500;
  opacity: 0.8;
}

/* Error state styles */
.shop-error {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(360px, 1.1fr);
  align-items: stretch;
  max-width: 1200px;
  min-height: 380px;
  margin: 0 auto;
  border: 1px solid rgba(200, 178, 115, .18);
  background: #0d0f17;
  overflow: hidden;
}

.error-content {
  padding: clamp(34px, 5vw, 68px);
  align-self: center;
}

.error-icon {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 20px;
}

.error-content h2 {
  color: var(--myst-ink-strong);
  font-size: clamp(30px, 4vw, 48px);
  font-family: var(--font-display);
  font-weight: 750;
  line-height: 1.02;
  margin: 12px 0 16px;
}

.error-content p {
  color: var(--myst-ink-muted);
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 28px;
  max-width: 50ch;
}

.error-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; }
.error-actions a { display: inline-flex; align-items: center; min-height: 44px; color: #d9d2c5; font: 700 14px var(--font-ui); }
.market-visual { position: relative; min-height: 380px; margin: 0; overflow: hidden; }
.market-visual::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #0d0f17 0, transparent 34%), linear-gradient(0deg, rgba(5, 6, 10, .72), transparent 55%); }
.market-visual img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.65) contrast(1.08) brightness(.7); }
.market-visual figcaption { position: absolute; z-index: 1; right: 20px; bottom: 18px; left: 30%; color: #d5d0c7; font: 600 12px/1.5 var(--font-ui); text-align: right; }

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background-color: var(--myst-gold);
  color: #090b12;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
}

.retry-btn:hover {
  background-color: var(--myst-gold-soft);
  transform: translateY(var(--hover-control));
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .shop-container { padding: 94px 16px 56px; }
  .shop-content { margin-top: 20px; }
  .market-header { display: block; margin-bottom: 30px; padding-bottom: 22px; }
  .market-header > div:first-child { min-width: 0; }
  .market-header h1 { max-width: 100%; font-size: 30px; overflow-wrap: normal; word-break: normal; }
  .market-header p { font-size: 15px; }
  .market-status { margin-top: 18px; white-space: normal; }
  .shop-error { grid-template-columns: 1fr; }
  .market-visual { min-height: 200px; }
  .market-visual::after { background: linear-gradient(0deg, #0d0f17 0, transparent 55%); }
  .market-visual figcaption { left: 20px; text-align: left; }
  .error-content { padding: 30px 24px 36px; }
}

/* Purchase Ritual Footer Buttons */
.btn-ritual-primary {
  padding: 12px 24px;
  background: var(--myst-gold);
  color: #05070a;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
}

.btn-ritual-primary:hover:not(:disabled) {
  background: #fff;
  transform: translateY(var(--hover-control));
}

.btn-ritual-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ritual-secondary {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
}

.btn-ritual-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transform: translateY(var(--hover-control));
}
</style>
