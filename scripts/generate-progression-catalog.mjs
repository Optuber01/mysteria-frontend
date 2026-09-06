import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceUrl = new URL('../src/assets/sources/pathway-abilities.json', import.meta.url);
const outputUrl = new URL('../src/assets/sources/progression-catalog.json', import.meta.url);

const standardPathwayIds = new Set([
  'abyss', 'chained', 'darkness', 'death', 'demoness', 'door', 'emperor',
  'error', 'fool', 'fortune', 'giant', 'hanged', 'hermit', 'justiciar',
  'moon', 'mother', 'paragon', 'priest', 'sun', 'tower', 'tyrant', 'visionary',
]);

const source = JSON.parse(await readFile(sourceUrl, 'utf8'));
const entries = source.pathways.map((entry) => {
  const sequences = [...(entry.sequences ?? [])].sort((a, b) => b.sequence - a.sequence);
  const startingSequence = sequences[0] ?? null;
  const abilities = sequences.flatMap((sequence) => sequence.abilities ?? []);

  return {
    id: entry.id,
    kind: standardPathwayIds.has(entry.id) ? 'pathway' : 'boon',
    startingSequence: startingSequence
      ? { sequence: startingSequence.sequence, name: startingSequence.name }
      : null,
    strengths: abilities.slice(0, 3).map((ability) => ({
      id: ability.id,
      name: ability.name,
    })),
    sequenceCount: sequences.length,
    abilityCount: abilities.length,
  };
});

await writeFile(
  outputUrl,
  `${JSON.stringify({ lastUpdated: source.lastUpdated, entries }, null, 2)}\n`,
  'utf8',
);

console.log(`Generated ${entries.length} homepage progression entries at ${fileURLToPath(outputUrl)}`);
