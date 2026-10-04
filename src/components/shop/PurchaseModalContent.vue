<template>
  <div v-if="item" class="purchase-ritual-modal">
    <div class="purchase-item-summary">
      <div class="summary-details">
        <h4 class="item-name">{{ name }}</h4>
        <div class="item-price-tag">
          {{ t('pricePerUnit') || 'Price per unit' }}: {{ formattedPrice }}
        </div>
      </div>
    </div>

    <div v-if="isBulkable" class="ritual-field">
      <label class="ritual-label">{{ t('amount') || 'Amount' }}</label>
      <div class="amount-stepper">
        <button class="step-btn" @click="updateAmount(Math.max(1, amount - 1))">-</button>
        <input :value="amount" class="amount-input" min="1" type="number" @input="handleAmountInput"/>
        <button class="step-btn" @click="updateAmount(amount + 1)">+</button>
      </div>
    </div>

    <div v-if="isGiftable" class="ritual-field">
      <div class="ritual-checkbox-field" @click="toggleGift">
        <div :class="{ active: isGift }" class="ritual-checkbox">
          <i v-if="isGift" class="fa-solid fa-check"></i>
        </div>
        <span class="ritual-label-inline">{{ t('buyAsGift') || 'Purchase as a gift' }}</span>
      </div>
    </div>

    <Transition name="ritual-fade">
      <div v-if="isGift" class="ritual-field">
        <UserSelector
            :model-value="recipientId"
            :label="t('recipient') || 'Recipient'"
            :placeholder="t('searchRecipient') || 'Search by nickname...'"
            @update:model-value="updateRecipient"
        />
      </div>
    </Transition>

    <div class="total-ritual-price">
      <span class="total-label">{{ t('totalCost') || 'Total Cost' }}:</span>
      <span class="total-value">{{ formattedTotalPrice }}</span>
    </div>

    <div v-if="insufficientFunds" class="insufficient-funds-warning">
      <i class="fa-solid fa-triangle-exclamation"></i>
      {{ t('insufficientFundsMessage') }} {{ formattedMissingAmount }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useCurrency} from '@/composables/useCurrency';
import {useBalanceStore} from '@/stores/balance';
import UserSelector from '@/components/shop/UserSelector.vue';
import Decimal from 'decimal.js';
import type {ServiceMarkdownDto, ServiceResponse} from '@/types/services';

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
const {formatCurrency, currentCurrency} = useCurrency();
const balanceStore = useBalanceStore();

const name = computed(() => {
  if ('display_name' in props.item && props.item.display_name) return props.item.display_name;
  return props.item.name;
});

const price = computed(() => {
  return new Decimal(props.item.price.toString());
});

const isBulkable = computed(() => {
  if ('is_bulkable' in props.item) return props.item.is_bulkable;
  return (props.item as ServiceMarkdownDto).isBulkable;
});

const isGiftable = computed(() => {
  if ('is_giftable' in props.item) return props.item.is_giftable;
  return (props.item as ServiceMarkdownDto).isGiftable;
});

const formattedPrice = computed(() => {
  if (currentCurrency.value === 'POINTS') {
    return `${price.value.toString()} ${t('marks')}`;
  }
  return formatCurrency(price.value);
});

const totalPrice = computed(() => {
  return price.value.mul(props.amount);
});

const formattedTotalPrice = computed(() => {
  if (currentCurrency.value === 'POINTS') {
    return `${totalPrice.value.toString()} ${t('marks')}`;
  }
  return formatCurrency(totalPrice.value);
});

const insufficientFunds = computed(() => {
  if (!balanceStore.currentBalance) return true;
  return balanceStore.currentBalance.amount.lessThan(totalPrice.value);
});

const missingAmount = computed(() => {
  if (!insufficientFunds.value || !balanceStore.currentBalance) return new Decimal(0);
  return totalPrice.value.minus(balanceStore.currentBalance.amount);
});

const formattedMissingAmount = computed(() => {
  if (currentCurrency.value === 'POINTS') {
    return `${missingAmount.value.toString()} ${t('marks')}`;
  }
  return formatCurrency(missingAmount.value);
});

const updateAmount = (val: number) => {
  emit('update:amount', val);
};

const handleAmountInput = (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  if (!isNaN(val)) {
    updateAmount(Math.max(1, val));
  }
};

const toggleGift = () => {
  emit('update:isGift', !props.isGift);
};

const updateRecipient = (val: string) => {
  emit('update:recipientId', val);
};
</script>

<style scoped>
.purchase-ritual-modal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.purchase-item-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgb(var(--pm-ffffff) / 0.02);
  border: 1px solid rgb(var(--pm-ffffff) / 0.05);
  border-radius: 8px;
}

.item-name {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  color: rgb(var(--pm-ffffff));
  margin: 0 0 4px 0;
}

.item-price-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--myst-gold);
}

.ritual-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ritual-label {
  font-family: 'Playfair Display', serif;
  font-size: 14px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ritual-checkbox-field {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.ritual-checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid rgb(var(--pm-c8b273) / 0.3);
  background: rgb(var(--pm-ffffff) / 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--myst-gold);
  font-size: 12px;
  transition: all 0.3s;
}

.ritual-checkbox.active {
  background: rgb(var(--pm-c8b273) / 0.1);
  border-color: var(--myst-gold);
}

.ritual-label-inline {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: rgb(var(--pm-aaaaaa));
}

.amount-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  border: 1px solid rgb(var(--pm-ffffff) / 0.1);
  background: rgb(var(--pm-000000) / 0.2);
  padding: 4px;
  border-radius: 4px;
}

.step-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--pm-ffffff) / 0.05);
  border: none;
  color: rgb(var(--pm-ffffff));
  cursor: pointer;
  transition: all 0.3s;
}

.step-btn:hover {
  background: var(--myst-gold);
  color: rgb(var(--pm-000000));
}

.amount-input {
  width: 60px;
  height: 32px;
  background: transparent;
  border: none;
  color: rgb(var(--pm-ffffff));
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.amount-input::-webkit-inner-spin-button,
.amount-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.total-ritual-price {
  margin-top: 8px;
  padding: 16px;
  border-top: 1px dashed rgb(var(--pm-ffffff) / 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  color: rgb(var(--pm-888888));
}

.total-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  color: var(--myst-gold);
}

.insufficient-funds-warning {
  padding: 12px;
  background: rgb(var(--pm-ef4444) / 0.1);
  border-left: 3px solid rgb(var(--pm-ef4444));
  color: rgb(var(--pm-f87171));
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ritual-fade-enter-active, .ritual-fade-leave-active {
  transition: all 0.3s ease;
}

.ritual-fade-enter-from, .ritual-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<style>
/* Colour literals of the scoped styles above, as theme tokens (RGB triplets, used as
   rgb(var(--x) / alpha)): the dark values are the original literals, the light theme
   re-points them. Global so teleported content (modals) resolves them too. */
:root {
    --pm-000000: 0 0 0;
    --pm-888888: 136 136 136;
    --pm-aaaaaa: 170 170 170;
    --pm-c8b273: 200 178 115;
    --pm-ef4444: 239 68 68;
    --pm-f87171: 248 113 113;
    --pm-ffffff: 255 255 255;
}

:root[data-theme="parchment"] {
    --pm-000000: 255 255 255;
    --pm-888888: 85 83 94;
    --pm-aaaaaa: 85 83 94;
    --pm-c8b273: 180 44 62;
    --pm-ef4444: 195 5 30;
    --pm-f87171: 178 48 56;
    --pm-ffffff: 23 22 28;
}
</style>

