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
      <label class="ritual-label" for="purchase-amount">{{ t('amount') || 'Amount' }}</label>
      <div class="amount-stepper">
        <button :aria-label="amountLabels.decrease" class="step-btn" type="button" @click="updateAmount(Math.max(1, amount - 1))">−</button>
        <input id="purchase-amount" :value="amount" autocomplete="off" class="amount-input" inputmode="numeric" min="1" name="amount" type="number" @blur="normalizeAmountInput" @input="handleAmountInput" />
        <button :aria-label="amountLabels.increase" class="step-btn" type="button" @click="updateAmount(amount + 1)">+</button>
      </div>
    </div>

    <div v-if="isGiftable" class="ritual-field">
      <label class="ritual-checkbox-field">
        <input :checked="isGift" class="checkbox-input" type="checkbox" @change="toggleGift">
        <span :class="{ active: isGift }" class="ritual-checkbox" aria-hidden="true">
          <i v-if="isGift" class="fa-solid fa-check"></i>
        </span>
        <span class="ritual-label-inline">{{ t('buyAsGift') || 'Purchase as a gift' }}</span>
      </label>
    </div>

    <div v-if="requiresServerSelection" class="ritual-field">
      <label class="ritual-label" for="purchase-server">{{ serverCopy.label }}</label>
      <select id="purchase-server" :value="selectedServer || ''" class="server-select" name="target-server" @change="updateServer">
        <option value="">{{ serverCopy.placeholder }}</option>
        <option v-for="server in availableServers" :key="server" :value="server">{{ server }}</option>
      </select>
      <p v-if="!availableServers.length" class="field-error" role="alert">{{ serverCopy.unavailable }}</p>
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

    <div v-if="balanceStore.isBalanceLoading" class="balance-state" role="status">{{ t('loading') }}</div>
    <div v-else-if="balanceStore.balanceError" class="balance-state balance-error" role="alert">
      <span>{{ serverCopy.balanceError }}</span>
      <button type="button" @click="emit('retry-balance')">{{ t('tryAgain') }}</button>
    </div>

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
  selectedServer?: string;
}>();

const emit = defineEmits<{
  (e: 'update:amount', value: number): void;
  (e: 'update:isGift', value: boolean): void;
  (e: 'update:recipientId', value: string): void;
  (e: 'update:selectedServer', value: string): void;
  (e: 'retry-balance'): void;
}>();

const {t, currentLanguage} = useI18n();
const amountLabels = computed(() => currentLanguage.value === 'uk' ? {decrease: 'Зменшити кількість', increase: 'Збільшити кількість'} : {decrease: 'Decrease amount', increase: 'Increase amount'});
const serverCopy = computed(() => currentLanguage.value === 'uk' ? {label: 'Сервер доставки', placeholder: 'Оберіть сервер', unavailable: 'Для цього товару немає доступних серверів.', balanceError: 'Не вдалося завантажити баланс.'} : {label: 'Delivery server', placeholder: 'Choose a server', unavailable: 'No delivery servers are currently available for this item.', balanceError: 'We could not load your balance.'});
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
const requiresServerSelection = computed(() => 'server_availability' in props.item && props.item.server_availability?.mode === 'selectable');
const availableServers = computed(() => 'server_availability' in props.item ? (props.item.server_availability?.servers ?? []) : []);

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
  if (!balanceStore.currentBalance) return false;
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
  const input = e.target as HTMLInputElement;
  const val = parseInt(input.value);
  if (!isNaN(val)) {
    updateAmount(Math.max(1, val));
  } else if (input.value) {
    input.value = props.amount.toString();
  }
};
const normalizeAmountInput = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement;
  const value = Number.parseInt(input.value);
  const normalized = Number.isFinite(value) ? Math.max(1, value) : props.amount;
  input.value = normalized.toString();
  updateAmount(normalized);
};

const toggleGift = () => {
  emit('update:isGift', !props.isGift);
};

const updateRecipient = (val: string) => {
  emit('update:recipientId', val);
};
const updateServer = (event: Event) => emit('update:selectedServer', (event.target as HTMLSelectElement).value);
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
}

.item-name {
  font-family: var(--font-display);
  font-size: 18px;
  color: #fff;
  margin: 0 0 4px 0;
}

.item-price-tag {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--myst-gold);
}

.ritual-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ritual-label {
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ritual-checkbox-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.checkbox-input:focus-visible + .ritual-checkbox { outline: 2px solid var(--myst-gold); outline-offset: 3px; }

.ritual-checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid rgba(200, 178, 115, 0.3);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--myst-gold);
  font-size: 12px;
  transition:
    background-color var(--motion-base) var(--ease-standard),
    border-color var(--motion-base) var(--ease-standard),
    color var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-sm);
}

.ritual-checkbox.active {
  background: rgba(200, 178, 115, 0.1);
  border-color: var(--myst-gold);
}

.ritual-label-inline {
  font-family: var(--font-ui);
  font-size: 13px;
  color: #aaa;
}

.server-select { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid rgba(200, 178, 115, .3); border-radius: var(--radius-md); background: #0b0d16; color: #f2eee6; font: 14px var(--font-ui); }
.field-error { margin: 8px 0 0; color: #f1a3a3; font-size: 13px; }
.balance-state { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1px solid rgba(200, 178, 115, .2); color: #c9c3b9; font-size: 13px; }
.balance-error { border-color: rgba(239, 100, 100, .3); }
.balance-state button { min-height: 40px; padding: 0 12px; border: 1px solid var(--myst-gold); border-radius: var(--radius-sm); background: transparent; color: var(--myst-gold); cursor: pointer; }

.amount-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-radius: var(--radius-md);
}

.step-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #fff;
  cursor: pointer;
  transition:
    background-color var(--motion-base) var(--ease-standard),
    color var(--motion-base) var(--ease-standard),
    transform var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-sm);
}

.step-btn:hover {
  background: var(--myst-gold);
  color: #000;
  transform: translateY(var(--hover-control));
}

.amount-input {
  width: 60px;
  height: 32px;
  background: transparent;
  border: none;
  color: #fff;
  text-align: center;
  font-family: var(--font-ui);
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
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-family: var(--font-ui);
  font-size: 16px;
  color: #888;
}

.total-value {
  font-family: var(--font-ui);
  font-size: 20px;
  font-weight: 700;
  color: var(--myst-gold);
}

.insufficient-funds-warning {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  color: #f87171;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-lg);
}

.ritual-fade-enter-active, .ritual-fade-leave-active { transition: opacity var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-enter); }
.ritual-fade-enter-from, .ritual-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
