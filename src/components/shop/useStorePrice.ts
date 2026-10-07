import {computed} from 'vue';
import Decimal from 'decimal.js';
import {useCurrency} from '@/composables/useCurrency';
import {useI18n} from '@/composables/useI18n';
import {useBalanceStore} from '@/stores/balance';

/** The Discord server, where payment problems are sorted out in a ticket. */
export const STORE_DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

/*
 * Buy Me a Coffee takes dollars and euros from everyone outside Ukraine; Ukrainian
 * readers pay through Donatello, whose link carries the nickname and balance id so the
 * payment is matched to the account (the same split BalanceButton makes in the header).
 */
const BUY_ME_A_COFFEE = 'https://buymeacoffee.com/mysterria';

/**
 * Prices and the top-up route for the store. Every price is stored in Marks; readers
 * outside Ukraine see it in their chosen currency first, with the Marks beside it, since
 * the balance a purchase draws on is always in Marks.
 */
export function useStorePrice() {
    const {t, intlLocale} = useI18n();
    const {currentCurrency, formatCurrency, usesRealCurrency, getCurrencyRate} = useCurrency();
    const balanceStore = useBalanceStore();

    const marks = (points: Decimal | number) =>
        `${Number(new Decimal(points).toFixed(0)).toLocaleString(intlLocale.value)} ${t('marks')}`;

    /** The price as read first: "$7.50", or "300 Marks" when the reader shows Marks. */
    const main = (points: Decimal | number) =>
        currentCurrency.value === 'POINTS' ? marks(points) : formatCurrency(points);

    /** The Marks beside a money price; empty when the main price is already in Marks. */
    const inMarks = (points: Decimal | number) =>
        currentCurrency.value === 'POINTS' ? '' : marks(points);

    const provider = computed(() => (usesRealCurrency.value ? 'bmc' : 'donatello'));
    const topUpUrl = computed(() => (usesRealCurrency.value ? BUY_ME_A_COFFEE : balanceStore.donatelloUrl));
    const rates = computed(() => ({usd: getCurrencyRate('USD'), eur: getCurrencyRate('EUR')}));

    return {marks, main, inMarks, provider, topUpUrl, rates};
}

/** Splits "text {link} text" around the placeholder, so a link can sit inside a sentence. */
export function splitAround(text: string, key = '{link}'): [string, string] {
    const i = text.indexOf(key);
    return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i + key.length)];
}
