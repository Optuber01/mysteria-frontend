import {computed, type MaybeRefOrGetter, toValue} from 'vue';
import {useI18n} from '@/composables/useI18n';

/**
 * How long a purchase lasts: "One-time" for keys and permanent perks, otherwise the
 * length the price pays for ("1 month", "12 months" is "1 year"). A price is for that
 * whole term, so it is never shown as "per month".
 */
export function useTermLabel(months: MaybeRefOrGetter<number | undefined>) {
    const {t, plural} = useI18n();
    const form = (unit: 'months' | 'years', n: number) => plural(n, {
        one: t(`shopPage.term.${unit}One`),
        few: t(`shopPage.term.${unit}Few`),
        many: t(`shopPage.term.${unit}Many`),
    }).replace('{n}', String(n));

    return computed(() => {
        const m = toValue(months);
        if (!m) return t('shopPage.term.oneTime');
        return m % 12 === 0 ? form('years', m / 12) : form('months', m);
    });
}
