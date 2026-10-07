<template>
  <!-- One item: its picture, what it is and does, the price, and the way to buy it. -->
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
      <h3 class="arc-h4 store-card__name">
        <RouterLink :to="$lp(detailPath)" class="store-card__link">{{ itemName }}</RouterLink>
      </h3>
      <p v-if="item.description" class="store-card__description">{{ item.description }}</p>

      <ul v-if="item.points?.length" class="store-card__points">
        <li v-for="(point, index) in item.points.slice(0, 4)" :key="index">
          <i class="fa-solid fa-check" aria-hidden="true"></i>
          <span>
            {{ point.text }}
            <span v-if="point.tooltip" class="store-card__hint">{{ point.tooltip }}</span>
          </span>
        </li>
      </ul>

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
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  transition: box-shadow .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
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
  font-size: 32px;
  opacity: .6;
}

.store-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: var(--arc-pad);
}

.store-card__link {
  color: inherit;
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
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.store-card__points {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 12px 0 0;
  border-top: var(--arc-bw) solid var(--arc-line);
  list-style: none;
  font-size: var(--arc-fs-small);
  line-height: 1.45;
}

.store-card__points li {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.store-card__points i {
  flex: none;
  color: var(--arc-muted);
  font-size: 11px;
}

.store-card__hint {
  display: block;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
}

.store-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.store-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  margin-top: auto;
  padding-top: 14px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.store-card__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.store-card__now {
  color: var(--arc-ink);
  font-size: 22px;
  font-weight: 650;
  line-height: 1.1;
}

.store-card__was,
.store-card__marks {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

.store-card__buy {
  flex: none;
}

/* the longer "sign in" label takes the row's width, whether or not it wraps */
.store-card__buy.is-sign-in {
  flex: 1 0 auto;
}

@media (max-width: 420px) {
  .store-card__buy {
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
