<template>
  <!-- The order before it is placed: how many, for whom, what it costs, and what is left. -->
  <div v-if="item" class="buy-form">
    <p class="buy-form__item">
      <strong>{{ name }}</strong>
      <span class="arc-muted">{{ t('shopPage.purchase.each') }}: {{ price.main(unitPrice) }}</span>
    </p>

    <div v-if="isBulkable" class="buy-form__field">
      <label class="buy-form__label" for="buy-quantity">{{ t('shopPage.purchase.quantity') }}</label>
      <div class="buy-form__stepper">
        <button
            :aria-label="t('shopPage.purchase.fewer')"
            :disabled="amount <= 1"
            class="arc-tile buy-form__step"
            type="button"
            @click="updateAmount(amount - 1)"
        >
          <span class="buy-form__minus" aria-hidden="true">−</span>
        </button>
        <input
            id="buy-quantity"
            :value="amount"
            class="arc-field buy-form__qty"
            inputmode="numeric"
            min="1"
            type="number"
            @input="handleAmountInput"
        >
        <button
            :aria-label="t('shopPage.purchase.more')"
            class="arc-tile buy-form__step"
            type="button"
            @click="updateAmount(amount + 1)"
        >
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <label v-if="isGiftable" class="buy-form__check">
      <input :checked="isGift" type="checkbox" @change="toggleGift">
      <span>{{ t('shopPage.purchase.gift') }}</span>
    </label>

    <!-- a gift opens the recipient field under the box; the fold takes the form's gap with it -->
    <ArcCollapse v-if="isGiftable" :open="isGift" class="buy-form__fold" lazy>
      <UserSelector
          class="buy-form__unfolded"
          :label="t('shopPage.purchase.recipient')"
          :model-value="recipientId"
          :placeholder="t('shopPage.purchase.recipientPlaceholder')"
          @update:model-value="updateRecipient"
      />
    </ArcCollapse>

    <dl class="arc-rows buy-form__sum">
      <div class="arc-row">
        <dt>{{ t('shopPage.purchase.total') }}</dt>
        <dd>
          <strong>{{ price.main(totalPrice) }}</strong>
          <span v-if="price.inMarks(totalPrice)" class="arc-muted"> · {{ price.inMarks(totalPrice) }}</span>
        </dd>
      </div>
      <div class="arc-row">
        <dt>{{ t('shopPage.purchase.balance') }}</dt>
        <dd>{{ balance ? price.marks(balance) : '…' }}</dd>
      </div>
      <div v-if="balance && !insufficientFunds" class="arc-row">
        <dt>{{ t('shopPage.purchase.after') }}</dt>
        <dd>{{ price.marks(balance.minus(totalPrice)) }}</dd>
      </div>
    </dl>

    <ArcCollapse :open="!!balance && insufficientFunds" class="buy-form__fold" lazy>
      <div class="buy-form__short buy-form__unfolded" role="status">
        <p>{{ shortText }}</p>
        <p class="buy-form__short-links">
          <a :href="price.topUpUrl.value" class="arc-link" target="_blank" rel="noopener noreferrer">
            {{ t('shopPage.balance.topUp') }}<span class="arc-sr"> ({{ t('shopPage.newTab') }})</span>
          </a>
          <RouterLink :to="$lp('/help') + '#top-ups'" class="arc-link">{{ t('shopPage.balance.howTitle') }}</RouterLink>
        </p>
      </div>
    </ArcCollapse>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import Decimal from 'decimal.js';
import ArcCollapse from '@/components/arcana/ArcCollapse.vue';
import {useI18n} from '@/composables/useI18n';
import {useBalanceStore} from '@/stores/balance';
import UserSelector from '@/components/shop/UserSelector.vue';
import type {ServiceMarkdownDto, ServiceResponse} from '@/types/services';
import {useStorePrice} from './useStorePrice';

const props = defineProps<{
  item: ServiceResponse | ServiceMarkdownDto;
  amount: number;
  isGift: boolean;
  recipientId: string;
}>();

const emit = defineEmits<{
  (e: 'update:amount', value: number): void;
  (e: 'update:isGift', value: boolean): void;
  (e: 'update:recipientId', value: string): void;
}>();

const {t} = useI18n();
const balanceStore = useBalanceStore();
const price = useStorePrice();

const name = computed(() => {
  if ('display_name' in props.item && props.item.display_name) return props.item.display_name;
  return props.item.name;
});

const unitPrice = computed(() => new Decimal(props.item.price.toString()));
const totalPrice = computed(() => unitPrice.value.mul(props.amount));

const isBulkable = computed(() => 'is_bulkable' in props.item
    ? props.item.is_bulkable
    : (props.item as ServiceMarkdownDto).isBulkable);
const isGiftable = computed(() => 'is_giftable' in props.item
    ? props.item.is_giftable
    : (props.item as ServiceMarkdownDto).isGiftable);

const balance = computed(() => balanceStore.currentBalance?.amount ?? null);
const insufficientFunds = computed(() => !balance.value || balance.value.lessThan(totalPrice.value));
const shortText = computed(() => t('shopPage.purchase.short')
    .replace('{amount}', price.marks(totalPrice.value.minus(balance.value ?? 0))));

const updateAmount = (val: number) => emit('update:amount', Math.max(1, val));

const handleAmountInput = (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  if (!isNaN(val)) updateAmount(val);
};

const toggleGift = () => emit('update:isGift', !props.isGift);
const updateRecipient = (val: string) => emit('update:recipientId', val);
</script>

<style scoped>
.buy-form {
  display: grid;
  gap: 20px;
}

/* a shut fold takes no room: it draws back over the gap before it, and its content keeps it */
.buy-form__fold {
  margin-top: -20px;
}

.buy-form__unfolded {
  margin-top: 20px;
}

.buy-form__item {
  display: grid;
  gap: 4px;
  margin: 0;
}

.buy-form__item strong {
  font-size: var(--arc-fs-h4);
  font-weight: 600;
}

.buy-form__item span {
  font-size: var(--arc-fs-small);
}

.buy-form__field {
  display: grid;
  gap: 8px;
}

.buy-form__label {
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.buy-form__stepper {
  display: flex;
  gap: 8px;
}

.buy-form__step {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  cursor: pointer;
}

.buy-form__minus {
  font-size: 20px;
  line-height: 1;
}

.buy-form__step:disabled {
  opacity: .45;
  cursor: not-allowed;
  transform: none;
}

.buy-form__qty {
  width: 84px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.buy-form__qty::-webkit-inner-spin-button,
.buy-form__qty::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.buy-form__check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  cursor: pointer;
  justify-self: start;
}

.buy-form__check input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--acc-solid);
}

.buy-form__sum {
  margin: 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.buy-form__sum .arc-row {
  justify-content: space-between;
  min-height: 44px;
  padding: 10px 0;
}

.buy-form__sum .arc-row:first-child {
  border-top: 0;
}

.buy-form__sum dt {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

.buy-form__sum dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.buy-form__sum strong {
  font-size: 18px;
  font-weight: 650;
}

.buy-form__short {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  font-size: var(--arc-fs-small);
}

.buy-form__short p {
  margin: 0;
}

.buy-form__short-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  font-weight: 600;
}
</style>
