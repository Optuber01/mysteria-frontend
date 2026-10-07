/*
 * Tenure and dates in the reader's language. Units and their plurals come from Intl
 * ("1 year, 3 months", "1 рік, 3 місяці", "1年3个月"), so no plural tables live here.
 */

// Intl.ListFormat is in every browser the site supports, but newer than the project's TS lib.
type ListFormatCtor = new (locale: string, options: {style: 'long'; type: 'unit'}) => {format: (parts: string[]) => string};
const ListFormat = (Intl as unknown as {ListFormat: ListFormatCtor}).ListFormat;

const parse = (iso?: string | null): Date | null => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
};

/** Whole months from `from` to `to`, counting a month only once its day has come round. */
function monthsBetween(from: Date, to: Date): number {
    const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
    return to.getDate() < from.getDate() ? months - 1 : months;
}

const unit = (locale: string, name: 'year' | 'month' | 'day', value: number) =>
    new Intl.NumberFormat(locale, {style: 'unit', unit: name, unitDisplay: 'long'}).format(value);

/**
 * How long since `iso`: "1 year, 3 months", "5 months", "12 days"; null under a day.
 * `short` gives the largest unit only ("1 year"), for tight spots.
 */
export function formatTenure(iso: string | null | undefined, locale: string, short = false, now = new Date()): string | null {
    const since = parse(iso);
    if (!since || since > now) return null;
    const months = monthsBetween(since, now);
    if (months < 1) {
        const days = Math.floor((now.getTime() - since.getTime()) / 86_400_000);
        // Appointed today: "Staff for 0 days" says nothing, so the card keeps just the date.
        if (days < 1) return null;
        return unit(locale, 'day', days);
    }
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (short) return years ? unit(locale, 'year', years) : unit(locale, 'month', rest);
    const parts = [
        ...(years ? [unit(locale, 'year', years)] : []),
        ...(rest ? [unit(locale, 'month', rest)] : []),
    ];
    return new ListFormat(locale, {style: 'long', type: 'unit'}).format(parts);
}

/** "March 2025". */
export const formatMonth = (iso: string | null | undefined, locale: string) => {
    const date = parse(iso);
    return date ? new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'long'}).format(date) : null;
};

/** "12 March 2024". */
export const formatDay = (iso: string | null | undefined, locale: string) => {
    const date = parse(iso);
    return date ? new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'long', day: 'numeric'}).format(date) : null;
};
