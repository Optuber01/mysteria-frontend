/*
 * Builds src/assets/sources/progression-catalog.json, the homepage orbit's
 * slice of the pathway archive.
 *
 * The orbit only needs a handful of names and counts per pathway, but
 * src/data/pathways.ts carries every ability description in every locale
 * (~500 KB gzipped). Rather than ship that to the homepage, or re-implement its
 * rules here, this script runs the real module through Vite and records what
 * its own accessors return - pathwayName(), pick(), boonPathwayIds,
 * pathwayImageName() - for every locale. Re-run `npm run generate:progression`
 * whenever the pathway data or its overlays change.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outputUrl = new URL('../src/assets/sources/progression-catalog.json', import.meta.url);

const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
});

try {
  const data = await server.ssrLoadModule('/src/data/pathways.ts');
  const { LOCALES } = await server.ssrLoadModule('/src/locales/index.ts');
  const languages = Object.keys(LOCALES);

  // Store English plus only the locales that differ from it; the client falls
  // back to English exactly like pick() does.
  const localized = (resolve) => {
    const en = resolve('en');
    const value = { en };
    for (const language of languages) {
      const text = resolve(language);
      if (language !== 'en' && text && text !== en) value[language] = text;
    }
    return value;
  };

  const entries = data.pathways.map((pathway) => {
    const sequences = [...pathway.sequences].sort((a, b) => b.sequence - a.sequence);
    const starting = sequences[0];
    const abilities = sequences.flatMap((sequence) => sequence.abilities);

    return {
      id: pathway.id,
      kind: data.boonPathwayIds.has(pathway.id) ? 'boon' : 'pathway',
      image: data.pathwayImageName(pathway.id),
      name: localized((language) => data.pathwayName(pathway.id, language)),
      startingSequence: starting
        ? { sequence: starting.sequence, name: localized((language) => data.pick(starting.name, language)) }
        : null,
      strengths: abilities.slice(0, 3).map((ability) => localized((language) => data.pick(ability.name, language))),
      sequenceCount: sequences.length,
      abilityCount: abilities.length,
    };
  });

  await writeFile(
    outputUrl,
    `${JSON.stringify({ lastUpdated: data.pathwaysLastUpdated, entries }, null, 2)}\n`,
    'utf8',
  );
  console.log(`Generated ${entries.length} homepage progression entries at ${fileURLToPath(outputUrl)}`);
} finally {
  await server.close();
}
