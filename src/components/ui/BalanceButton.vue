<template>
  <!-- One root (display: contents) so the parent's class and scoped rules reach it:
       as a fragment, the header's `.header-chip` responsive rule never applied. -->
  <span class="balance-root">
  <button
      v-if="profile"
      :class="['balance-chip', { 'is-icon-only': iconMode }]"
      :title="t('topUpBalance')"
      type="button"
      @click="handleTopUpClick"
  >
    <IconMark class="chip-icon"/>
    <span v-if="!iconMode" class="chip-amount">{{ formattedBalance }}</span>
  </button>

  <!-- Currency Conversion Modal -->
  <Teleport to="body">
    <Transition name="ritual-fade">
      <div v-if="showCurrencyModal" class="modal-ritual-overlay" @click="closeCurrencyModal">
        <div
            aria-labelledby="balance-currency-title"
            aria-modal="true"
            class="modal-ritual-content compact"
            role="dialog"
            @click.stop
            @keydown.esc="closeCurrencyModal"
        >
          <div class="modal-ritual-header">
            <h2 id="balance-currency-title" class="ritual-title">{{ t('currencySettings') }}</h2>
            <button :aria-label="t('close')" class="modal-ritual-close" type="button" @click="closeCurrencyModal">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="modal-ritual-body no-scrollbar">
            <div class="ritual-section">
              <h3 class="ritual-section-title">{{ t('displayCurrency') }}</h3>
              <p class="ritual-section-desc">{{ t('displayCurrencyDesc') }}</p>
              <div class="currency-ritual-grid">
                <button
                    v-for="curr in currencies"
                    :key="curr.code"
                    :aria-pressed="currentCurrency === curr.code"
                    :class="['currency-ritual-option', { active: currentCurrency === curr.code }]"
                    type="button"
                    @click="selectCurrency(curr.code)"
                >
                  <span v-if="curr.symbol" class="curr-symbol">{{ curr.symbol }}</span>
                  <IconMark v-else class="curr-icon"/>
                  <span class="curr-name">{{ curr.code === 'POINTS' ? t('marks') : curr.code }}</span>
                  <span class="curr-rate">{{ getRateText(curr.code) }}</span>
                </button>
              </div>
            </div>

            <div class="ritual-section">
              <h3 class="ritual-section-title">{{ t('paymentConversionRates') }}</h3>
              <div class="conversion-ledger">
                <div class="ledger-row">
                  <span class="ledger-label">USD</span>
                  <span class="ledger-val">1:40</span>
                </div>
                <div class="ledger-row">
                  <span class="ledger-label">EUR</span>
                  <span class="ledger-val">1:44</span>
                </div>
              </div>
            </div>

            <div v-if="usesRealCurrency" class="ritual-warning-box">
              <p class="warning-ritual-text">
                {{ t('donationWarning') }}
              </p>
            </div>

            <div class="modal-ritual-actions">
              <a :href="topUpUrl" class="arc-btn arc-btn--solid btn-ritual-primary" target="_blank" rel="noopener noreferrer">
                {{ t('topUpBalance') }}
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  </span>
</template>

<script lang="ts" setup>
import {useBalanceStore} from "@/stores/balance";
import {useUserStore} from "@/stores/user";
import {useI18n} from "@/composables/useI18n";
import {useCurrency} from "@/composables/useCurrency";
import {computed, ref} from "vue";
import IconMark from "@/assets/icons/IconMark.vue";

defineProps<{
  iconMode?: boolean;
}>();

const balanceStore = useBalanceStore();
const userStore = useUserStore();
const {t, intlLocale} = useI18n();
const {currentCurrency, setCurrency, usesRealCurrency} = useCurrency();

const profile = computed(() => userStore.currentUser);

/* The amount is always in Marks; the sigil beside it carries the unit, so no
   currency glyph belongs in the string itself. */
const formattedBalance = computed(() => {
  const amount = balanceStore.currentBalance?.amount;
  if (amount === undefined || amount === null) return "-";
  return Number(amount).toLocaleString(intlLocale.value);
});

const donatelloUrl = computed(() => balanceStore.donatelloUrl);
/* Donatello is the Ukrainian processor; everyone else tops up in real currency. */
const topUpUrl = computed(() =>
    usesRealCurrency.value
        ? 'https://buymeacoffee.com/mysterria'
        : donatelloUrl.value
);
const showCurrencyModal = ref(false);

const currencies = [
  {code: 'USD', symbol: '$'},
  {code: 'EUR', symbol: '€'},
  {code: 'POINTS', symbol: null}
] as const;

const getRateText = (code: string) => {
  if (code === 'POINTS') return t('showActualPoints');
  const rate = code === 'USD' ? '40' : '44';
  return t('oneCurrencyRate').replace('{currency}', code).replace('{rate}', rate);
};

const closeCurrencyModal = () => {
  showCurrencyModal.value = false;
};

const selectCurrency = (currency: 'USD' | 'EUR' | 'POINTS') => {
  setCurrency(currency);
};

const handleTopUpClick = () => {
  if (usesRealCurrency.value) {
    showCurrencyModal.value = true;
  } else {
    window.open(donatelloUrl.value, '_blank');
  }
};
</script>

<style scoped>
.balance-root {
  display: contents;
}

.balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 0;
  border-radius: 10px;
  background: color-mix(in oklab, var(--acc) 8%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  color: var(--arc-ink);
  cursor: pointer;
  font-family: var(--arc-body);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: box-shadow .2s ease, background-color .2s ease;
}

.balance-chip:hover {
  background: color-mix(in oklab, var(--acc) 14%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.chip-icon {
  width: 16px;
  height: 16px;
  color: var(--acc-ink);
}

.balance-chip.is-icon-only {
  width: 38px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

/* the currency sheet: the same dialog look as ModalItem */
.modal-ritual-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in oklab, var(--arc-bg) 72%, transparent);
  backdrop-filter: blur(8px);
}

.modal-ritual-content.compact {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 440px;
  border-radius: var(--arc-r-lg);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 24px 70px var(--arc-shadow-strong);
  color: var(--arc-ink);
}

.modal-ritual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: var(--arc-bw) solid var(--arc-line);
}

.ritual-title {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
}

.modal-ritual-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: none;
  color: var(--arc-muted);
  font-size: 18px;
  cursor: pointer;
}

.modal-ritual-close:hover {
  background: var(--arc-glass);
  color: var(--arc-ink);
}

.modal-ritual-body {
  padding: 22px;
}

.ritual-section {
  margin-bottom: 22px;
}

.ritual-section-title {
  margin: 0 0 6px;
  font-size: var(--arc-fs-body);
  font-weight: 600;
}

.ritual-section-desc {
  margin: 0 0 12px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

.currency-ritual-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.currency-ritual-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--arc-ink);
  font: inherit;
  cursor: pointer;
  transition: box-shadow .2s ease, background-color .2s ease;
}

.currency-ritual-option:hover {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.currency-ritual-option.active {
  background: color-mix(in oklab, var(--acc) 10%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.curr-symbol {
  font-size: 18px;
  font-weight: 600;
}

.curr-icon {
  width: 18px;
  height: 18px;
  color: var(--acc-ink);
}

.curr-name {
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.curr-rate {
  color: var(--arc-muted);
  font-size: 12px;
  text-align: center;
}

.conversion-ledger {
  border-radius: var(--arc-r-md);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.ledger-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-top: var(--arc-bw) solid var(--arc-line);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.ledger-row:first-child {
  border-top: 0;
}

.ledger-label {
  color: var(--arc-muted);
}

.ritual-warning-box {
  margin-bottom: 22px;
  padding: 12px 14px;
  border-left: var(--arc-bw-accent) solid var(--arc-line-acc);
}

.warning-ritual-text {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.5;
}

.btn-ritual-primary {
  width: 100%;
}

.ritual-fade-enter-active,
.ritual-fade-leave-active {
  transition: opacity .25s ease;
}

.ritual-fade-enter-from,
.ritual-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ritual-fade-enter-active,
  .ritual-fade-leave-active {
    transition: none;
  }
}
</style>
