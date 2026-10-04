/**
 * A homepage-length summary of an ability description: its first complete
 * sentence, without the cooldown/option details that follow. Never cuts a
 * sentence in the middle; if even the first sentence is long, it ends at the
 * last clause boundary that fits.
 */
const SENTENCE_END = /(?<=[.!?。！？])\s+/u;
const CLAUSE_END = /[,;:—–]\s/gu;

/** A leading tag such as "Passive." or "Toggle ability." is not a summary. */
const isLabel = (sentence: string) => sentence.split(' ').length <= 3;

export function abilitySummary(description: string, maxLength = 110): string {
  const text = description.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  const sentences = text.split(SENTENCE_END);
  const first = sentences.find((sentence) => !isLabel(sentence)) ?? sentences[0] ?? text;
  const ended = /[.!?。！？…]$/u.test(first) ? first : `${first}.`;
  if (ended.length <= maxLength) return ended;

  let cut = -1;
  for (const match of ended.matchAll(CLAUSE_END)) {
    if (match.index !== undefined && match.index <= maxLength) cut = match.index;
  }
  return cut > maxLength / 2 ? `${ended.slice(0, cut)}.` : ended;
}
