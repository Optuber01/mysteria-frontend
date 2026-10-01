# Mysterria homepage content and asset guide

The homepage is one continuous, object-led journey assembled in
`src/views/HomeView.vue`:

1. Bright arrival in Mysterria (`HomeHero`)
2. What Mysterria is (`WhatIsMysterria`)
3. A player's first potion and advancement (`ProgressionStoryV3`)
4. Pathways and Boons (`PathwayOrbit`)
5. Real server world systems and live stats (`BeyondPathways`)
6. Getting started and the guided join (`GettingStarted`, `JoinJourney`)
7. Upstream's companion mod section (`CompanionMod`, the footer's `#companion` anchor)

All copy lives in `src/locales/*.json` under `home.*`. English is the source;
the other locales start as English placeholders for Weblate, and zh-TW is
generated from zh-CN by `scripts/build-zh-tw.mjs`. Internal links go through
`$lp()` so they keep the reader's locale.

Each chapter preserves native scrolling. Sticky visuals enhance the story, while
reduced-motion and narrow/zoomed layouts retain readable static content.

## Verified sources

- Server address and status: `SERVER_IP` and the shared poller in
  `src/composables/useServer.ts`, read by the homepage through
  `src/composables/useSharedServerStatus.ts`
- Live Beyonder stats: `useBeyonderStats()` (`/api/beyonder-stats`, which needs
  `CATWALK_API_TOKEN` on the deployment)
- Latest update: `newsAPI.getLatest()` in `src/views/HomeView.vue`
- Detailed Sequences and abilities:
  `src/assets/sources/pathway-abilities.json`
- Compact homepage projection:
  `src/assets/sources/progression-catalog.json`
- Projection generator: `scripts/generate-progression-catalog.mjs`
- Progression and world-system copy: the Mysterria wiki and the corresponding
  guide topics in `src/data/guide/en.json`
- Gameplay textures: the Mysterria resource pack's Circle of Imagination items
- World captures: the Mysterria wiki repository's approved server imagery

`npm run build` regenerates the compact progression catalog before Vite
builds. The generator runs upstream's `src/data/pathways.ts` at build time and
stores localized pathway names in the catalog, so the homepage never ships the
full pathway archive. The standard 22 IDs are treated as Pathways; any additional archive
entry is categorized as a Boon. Starting Sequence, preview abilities, Sequence
count, and ability count are all derived from the detailed archive. Unknown
entries receive a safe visual fallback, so a data update cannot silently omit
them from the homepage.

The full archive remains the source of truth for `/pathways/:pathway`. Update it,
then run `npm run generate:progression` when reviewing the homepage locally.

## Presentation metadata

`src/data/homePathways.ts` contains only information missing from the gameplay
archive: public display names, image aliases, palettes, motifs, and motion
profiles. Add richer presentation metadata for a new entry when available, but
do not add Sequence names or abilities there.

The LOTM-informed motifs are art direction, not claims about Mysterria
mechanics. Public gameplay copy must continue to follow the current Mysterria
wiki and game archive.

## Asset provenance

- `home/hero/` holds the rotating hero captures listed in
  `src/data/homeHeroSlides.ts`.
- `home/progression/` uses a real Mysterria brewery capture, the in-game
  cauldron interface, COI-owned potion, ingredient and recipe textures, and the
  vanilla enchanting-table book atlas. The animated player still uses the
  standard Steve skin as a placeholder until a Mysterria skin is chosen.
- `home/world/` and `community-archive/` hold the dungeon, creature, Guardian,
  settlement and church captures used by the world chapter.
- Pathway and Boon sigils remain the existing project assets in
  `src/assets/images/pathways/` and `public/pathway-art/` (outside
  `/pathways/`, which upstream redirects to the localized route before Vercel
  serves static files).

Do not publish raw ModelEngine/MEG textures from the resource pack until their
third-party license is confirmed. Server screenshots that contain those models
may be used when the server team approves the capture.

When replacing imagery:

1. Prefer an approved real in-game capture or project-owned item/model asset.
2. Export WebP or AVIF at the actual maximum display size.
3. Keep the hero under about 300 KB where practical.
4. Add intrinsic dimensions and lazy-load below-the-fold images.
5. Preserve alt text when the image communicates content; decorative layers
   should remain empty-alt and `aria-hidden`.

## Honest live-world states

The homepage never fills missing server fields with mock facts.

- Player count/status comes from the shared server poller.
- Beyonder totals and top pathways come from `/api/beyonder-stats`.
- Latest update comes from the news API.
- Facts with no first-party source (towns, organizations, events, discoveries)
  are not shown at all. Add a row only once an API exposes the value.

## Interaction contracts

- Pathways and Boons use the same structured catalog and existing detail route.
- Desktop assembly is driven by vertical scroll, then supports pointer position,
  drag, wheel, previous/next controls, and arrow keys with snap behavior.
- Mobile uses a horizontal snap carousel with controls and a complete list
  fallback.
- Hover details must always have focus, click, and touch equivalents.
- Interactive targets stay at least 44 CSS pixels.
- Dialogs trap focus, close with Escape, and restore focus to their trigger.
- At 200% zoom and in reduced-motion mode, complex scenes become editorial,
  readable layouts rather than requiring animation to understand the content.

## Content replacement checklist

Before changing public mechanics copy, verify it against current plugin behavior
and the public Mysterria wiki. In particular, confirm:

- ingredient and brewing rules;
- acting/digestion feedback;
- personal ritual and Madness behavior;
- Boon altar progression;
- organization/town behavior;
- dungeon, event, economy and housing descriptions;
- availability and freshness guarantees for live APIs.

If a fact cannot be verified, omit it or show an unavailable state. Do not use a
future-content promise that would require a later homepage edit.
