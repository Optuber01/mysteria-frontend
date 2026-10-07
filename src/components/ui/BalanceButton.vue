<template>
  <!-- One root (display: contents) so the parent's class and scoped rules reach it:
       as a fragment, the header's `.header-chip` responsive rule never applied. -->
  <span class="balance-root">
  <button
      v-if="profile"
      ref="chipRef"
      :aria-expanded="usesRealCurrency ? showCurrencyModal : undefined"
      :aria-haspopup="usesRealCurrency ? 'dialog' : undefined"
      :class="['balance-chip', { 'is-icon-only': iconMode }]"
      :title="t('topUpBalance')"
      type="button"
      @click="handleTopUpClick"
  >
    <IconMark class="chip-icon"/>
    <span v-if="!iconMode" class="chip-amount">{{ formattedBalance }}</span>
    <span v-else class="arc-sr">{{ t('topUpBalance') }}</span>
  </button>

  <!-- Currency Conversion Modal -->
  <Teleport to="body">
    <!-- the shared dialog motion (arcana.css): the backdrop fades, the panel rises in and sinks back -->
    <Transition name="arc-dialog">
      <div v-if="showCurrencyModal" class="balance-modal" @click="closeCurrencyModal">
        <div
            ref="dialogRef"
            :aria-labelledby="titleId"
            aria-modal="true"
            class="balance-dialog"
            role="dialog"
            tabindex="-1"
            @click.stop
            @keydown="onDialogKeydown"
        >
          <div class="balance-head">
            <h2 :id="titleId" class="balance-title">{{ t('currencySettings') }}</h2>
            <button :aria-label="t('close')" class="balance-close" type="button" @click="closeCurrencyModal">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="balance-body">
            <div class="balance-section">
              <h3 class="balance-section-title">{{ t('displayCurrency') }}</h3>
              <p class="balance-section-desc">{{ t('displayCurrencyDesc') }}</p>
              <div class="currency-grid">
                <button
                    v-for="curr in currencies"
                    :key="curr.code"
                    :aria-pressed="currentCurrency === curr.code"
                    :class="['arc-tile', 'currency-option', { active: currentCurrency === curr.code }]"
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

            <div class="balance-section">
              <h3 class="balance-section-title">{{ t('paymentConversionRates') }}</h3>
              <div class="balance-ledger">
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

            <p v-if="usesRealCurrency" class="balance-note">
              {{ t('donationWarning') }}
            </p>

            <a :href="topUpUrl" class="arc-btn arc-btn--solid balance-topup" target="_blank" rel="noopener noreferrer">
              {{ t('topUpBalance') }}
              <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              <span class="arc-sr">{{ t('header.newTab') }}</span>
            </a>
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
import {computed, nextTick, ref, useId, watch} from "vue";
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
const titleId = `balance-currency-${useId()}`;
const chipRef = ref<HTMLButtonElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

/* the dialog takes focus when it opens, keeps Tab inside, closes on Escape, and hands
   focus back to the chip (as ModalItem does) */
watch(showCurrencyModal, async (open) => {
  if (open) {
    await nextTick();
    dialogRef.value?.focus();
  } else {
    chipRef.value?.focus();
  }
});

const focusables = () => [...(dialogRef.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
) ?? [])];

const onDialogKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopPropagation();
    closeCurrencyModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

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

/* a header control: 36px at the 10px radius, the bar's hover (accent hairline, wash, lift) */
.balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
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
  transition:
    box-shadow var(--arc-dur-2) var(--arc-ease),
    background-color var(--arc-dur-2) var(--arc-ease),
    transform var(--arc-dur-2) var(--arc-ease);
}

.balance-chip:hover {
  background: color-mix(in oklab, var(--acc) 14%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
  transform: translateY(-2px);
}

.balance-chip:active {
  transform: scale(.98);
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
.balance-modal {
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

.balance-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 24px 70px var(--arc-shadow-strong);
  color: var(--arc-ink);
}

.balance-dialog:focus-visible {
  outline: none;
}

.balance-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  border-bottom: var(--arc-bw) solid var(--arc-line);
}

.balance-title {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
}

.balance-close {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: none;
  color: var(--arc-muted);
  font-size: 18px;
  cursor: pointer;
  transition: color var(--arc-dur-1) var(--arc-ease), background-color var(--arc-dur-1) var(--arc-ease);
}

.balance-close:hover {
  background: var(--arc-glass);
  color: var(--arc-ink);
}

.balance-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 22px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.balance-section {
  margin-bottom: 22px;
}

.balance-section-title {
  margin: 0 0 6px;
  font-size: var(--arc-fs-body);
  font-weight: 600;
}

.balance-section-desc {
  margin: 0 0 12px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

.currency-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

/* a .arc-tile; selected is the one accent stroke */
.currency-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  font: inherit;
  cursor: pointer;
}

.currency-option.active {
  background: color-mix(in oklab, var(--acc) 10%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.curr-symbol,
.curr-icon {
  display: grid;
  place-items: center;
  height: 24px;
}

.curr-symbol {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.curr-icon {
  width: 20px;
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

/* hairline rows, no box around them */
.ledger-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: var(--arc-bw) solid var(--arc-line);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.ledger-label {
  color: var(--arc-muted);
}

.balance-note {
  margin: 0 0 22px;
  padding: 4px 0 4px 14px;
  border-left: var(--arc-bw-accent) solid var(--arc-line-acc);
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.5;
}

.balance-topup {
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .balance-chip:hover,
  .balance-chip:active {
    transform: none;
  }
}
</style>
