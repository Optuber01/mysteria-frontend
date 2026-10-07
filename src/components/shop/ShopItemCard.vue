<template>
  <!-- One item, kept short: its picture, name and line, the price, and the way to buy it.
       The full list of what it does is on the item's own page. -->
  <article v-if="item.is_active" class="store-card">
    <!-- the picture repeats the name's link for the pointer; keyboards and readers use the name -->
    <RouterLink :to="$lp(detailPath)" class="store-card__media" tabindex="-1" aria-hidden="true">
      <img
          v-if="imageUrl && !imageFailed"
          :src="imageUrl"
          :fetchpriority="imagePriority"
          :loading="imagePriority === 'high' ? 'eager' : 'lazy'"
          alt=""
          class="store-card__image"
          decoding="async"
          width="640"
          height="360"
          @error="imageFailed = true"
      >
      <i v-else class="fa-solid fa-box-open store-card__glyph"></i>
    </RouterLink>

    <div class="store-card__body">
      <h3 class="store-card__name">
        <RouterLink :to="$lp(detailPath)" class="store-card__link">{{ itemName }}</RouterLink>
      </h3>
      <p v-if="item.description" class="store-card__description">{{ item.description }}</p>

      <div class="store-card__tags">
        <span class="arc-tag">{{ termLabel }}</span>
        <span v-if="item.is_giftable" class="arc-tag">
          <i class="fa-solid fa-gift" aria-hidden="true"></i>{{ t('shopPage.giftable') }}
        </span>
        <span v-if="hasDiscount" class="arc-tag arc-tag--acc">−{{ discountPercent }}%</span>
      </div>

      <div class="store-card__foot">
        <p class="store-card__price">
          <span v-if="hasDiscount" class="store-card__was">
            <span class="arc-sr">{{ t('shopPage.was') }}</span>
            <s>{{ price.main(item.price) }}</s>
          </span>
          <span class="store-card__now">{{ price.main(finalPrice) }}</span>
          <span v-if="price.inMarks(finalPrice)" class="store-card__marks">{{ price.inMarks(finalPrice) }}</span>
        </p>

        <button
            :disabled="isProcessing"
            type="button"
            :class="{'is-sign-in': !signedIn}"
            class="arc-btn arc-btn--ghost arc-btn--sm store-card__buy"
            @click="emit('purchase', item.id)"
        >
          <i v-if="isProcessing" class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
          {{ signedIn ? t('shopPage.buy') : t('shopPage.signInToBuy') }}
          <span v-if="signedIn" class="arc-sr">: {{ itemName }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from "vue";
import {Decimal} from "decimal.js";
import {useI18n} from "@/composables/useI18n";
import {useAuthStore} from "@/stores/auth";
import type {ServiceResponse} from "@/types/services";
import {getServiceDetailPath} from "@/utils/slug";
import {useStorePrice} from "./useStorePrice";
import {useTermLabel} from "./useTermLabel";

const props = withDefaults(defineProps<{
  item: ServiceResponse;
  isProcessing?: boolean;
  imagePriority?: 'high' | 'low' | 'auto';
}>(), {isProcessing: false, imagePriority: 'auto'});

const emit = defineEmits<{ (e: "purchase", itemId: string): void }>();
const {t} = useI18n();
const authStore = useAuthStore();
const price = useStorePrice();
const termLabel = useTermLabel(() => props.item.duration_months);

const signedIn = computed(() => authStore.isAuthenticated);
const imageFailed = ref(false);
const itemName = computed(() => props.item.display_name || props.item.name);
const detailPath = computed(() => getServiceDetailPath(props.item));

const imageUrl = computed(() => props.item.image || "");
watch(imageUrl, () => {
  imageFailed.value = false;
});

const activeDiscount = computed(() => props.item.discounts?.find(discount => {
  const now = Date.now();
  return now >= new Date(discount.start_date).getTime() && (!discount.end_date || now <= new Date(discount.end_date).getTime());
}));
const hasDiscount = computed(() => Boolean(activeDiscount.value));
const discountPercent = computed(() => activeDiscount.value?.discount_percent || 0);
const finalPrice = computed(() => new Decimal(props.item.price).mul(new Decimal(1).minus(new Decimal(discountPercent.value).div(100))));
</script>

<style scoped>
.store-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border-radius: var(--arc-r-md);
  background: var(--arc-raised);
  transition: transform .3s cubic-bezier(.2, .8, .2, 1);
}

/* the hairline is drawn over the picture too, so the card keeps one edge */
.store-card::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  content: '';
  pointer-events: none;
  transition: box-shadow .25s ease;
}

.store-card:hover {
  transform: translateY(-2px);
}

.store-card:hover::after {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.store-card__media {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--arc-card-2);
  color: var(--arc-muted);
}

.store-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-card__glyph {
  font-size: 24px;
  opacity: .6;
}

.store-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 14px;
}

.store-card__name {
  margin: 0;
  font-family: var(--arc-display);
  font-size: 16px;
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  line-height: 1.3;
  text-wrap: balance;
}

.store-card__link {
  color: var(--arc-ink);
  text-decoration: none;
}

.store-card__link:hover {
  color: var(--acc-ink);
}

.store-card__description {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  line-height: 1.45;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.store-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.store-card__tags .arc-tag {
  gap: 5px;
  min-height: 20px;
  padding: 1px 6px;
  font-size: 12px;
}

.store-card__tags .arc-tag i {
  font-size: 10px;
}

.store-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 10px;
  margin-top: auto;
  padding-top: 4px;
}

/* the price reads as one figure, the Marks under it */
.store-card__price {
  display: grid;
  margin: 0;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.store-card__now {
  color: var(--arc-ink);
  font-size: 18px;
  font-weight: 650;
}

.store-card__was,
.store-card__marks {
  color: var(--arc-muted);
  font-size: 12px;
}

.store-card__buy {
  flex: none;
  min-height: 36px;
  padding-inline: 14px;
  font-size: 14px;
}

/* the longer "sign in" label takes the row's width, and wraps in the longer languages */
.store-card__buy.is-sign-in {
  flex: 1 1 auto;
  min-width: 0;
  padding-block: 6px;
  text-align: center;
}

/* two to a row on phones: the button takes the card's width under the price */
@media (max-width: 560px) {
  .store-card__body {
    gap: 6px;
    padding: 10px 10px 10px;
  }

  .store-card__name {
    font-size: 15px;
  }

  .store-card__buy,
  .store-card__buy.is-sign-in {
    flex: 1 1 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .store-card,
  .store-card::after {
    transition: none;
  }

  .store-card:hover {
    transform: none;
  }
}
</style>
