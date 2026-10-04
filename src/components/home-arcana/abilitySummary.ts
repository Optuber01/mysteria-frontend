/**
 * A homepage-length summary of an ability description: its first complete
 * sentence (past a leading tag such as "Passive."), tidied and always ending in
 * a full stop. Never cuts a clause: a first sentence longer than `maxLength`
 * (about two lines of the dossier) only drops a trailing aside set off by a
 * dash, and only when what stays is the sentence's whole main clause.
 */
const SENTENCE_END = /(?<=[.!?])\s+|(?<=[。！？])/u;
/** A dash that sets off an aside: " — ", " – ", or a spaced hyphen " - ". */
const ASIDE = /\s+[—–-]\s+/u;

/** A leading tag such as "Passive." or "Toggle ability." is not a summary ("Induce hunger pressure." is). */
const isLabel = (sentence: string) => sentence.split(' ').length <= 2;

export function abilitySummary(description: string, maxLength = 150): string {
  const text = description
      .replace(/%%/g, '%')
      .replace(/\s+/g, ' ')
      // the archive sometimes leaves a space before punctuation ("from sight .")
      .replace(/\s+([.,!?;:。！？])/gu, '$1')
      // a spaced hyphen is a dash
      .replace(/ - /g, ' – ')
      .trim();
  const sentences = text.split(SENTENCE_END).map(sentence => sentence.trim()).filter(Boolean);
  let first = sentences.find(sentence => !isLabel(sentence)) ?? sentences[0] ?? text;
  if (first.length > maxLength) {
    const aside = ASIDE.exec(first);
    if (aside && aside.index >= 40) first = first.slice(0, aside.index).replace(/[,;:]$/u, '');
  }
  return /[.!?。！？…]$/u.test(first) ? first : `${first}.`;
}
