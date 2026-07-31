# Mysterria homepage content and asset guide

The homepage is one continuous, object-led journey assembled in
`src/views/HomeView.vue`:

1. Bright arrival in Mysterria
2. A player's first potion and advancement
3. Scroll-assembled Pathways and Boons
4. Real server world systems
5. The guided join sequence

Each chapter preserves native scrolling. Sticky visuals enhance the story, while
reduced-motion and narrow/zoomed layouts retain readable static content.

## Verified sources

- Server address and status adapter: `src/services/serverStatus.ts`
- Latest update: `newsAPI.getLatest()` in `src/views/HomeView.vue`
- Detailed Sequences and abilities:
  `src/assets/sources/pathway-abilities.json`
- Compact homepage projection:
  `src/assets/sources/progression-catalog.json`
- Projection generator: `scripts/generate-progression-catalog.mjs`
- Progression and world-system copy: the Mysterria wiki and the corresponding
  guide topics in `src/data/guideContent.ts`
- Gameplay textures: the Mysterria resource pack's Circle of Imagination items
- World captures: the Mysterria wiki repository's approved server imagery

`npm run build-only` regenerates the compact progression catalog before Vite
builds. The standard 22 IDs are treated as Pathways; any additional archive
entry is categorized as a Boon. Starting Sequence, preview abilities, Sequence
count, and ability count are all derived from the detailed archive. Unknown
entries receive a safe visual fallback, so a data update cannot silently omit
them from the homepage.

The full archive remains the source of truth for `/pathways/:pathway`. Update it,
then run `npm run generate:progression` when reviewing the homepage locally.

## Presentation metadata

`src/data/pathways.ts` contains only information missing from the gameplay
archive: public display names, image aliases, palettes, motifs, and motion
profiles. Add richer presentation metadata for a new entry when available, but
do not add Sequence names or abilities there.

The LOTM-informed motifs are art direction, not claims about Mysterria
mechanics. Public gameplay copy must continue to follow the current Mysterria
wiki and game archive.

## Asset provenance

- `mysterria-dawn.webp` is promotional artwork created by re-lighting and
  art-directing an existing Mysterria castle capture. It is a homepage backdrop,
  not a gameplay screenshot.
- `home/progression/` uses a real Mysterria brewery capture, COI-owned potion,
  ingredient, recipe, ritual-book and acting textures, and vanilla block textures
  for the plugin's exact 18-block Normal Ritual Altar layout. The animated player
  uses the standard Steve skin rendered as a real articulated Minecraft rig.
- `home/world/` uses repo-backed dungeon, creature, boss, Emporium, economy and
  town captures. These are shown as distinct locations rather than as repeated
  crops of the hero.
- Pathway and Boon sigils remain the existing project assets in
  `src/assets/images/pathways/` and `public/pathways/`.

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

- Player count/status comes from the live status adapter.
- Latest update comes from the news API.
- Town/organization, event, and discovery values remain explicitly unavailable
  until a first-party API exposes them.

Implement `getLivingWorldSnapshot()` in `src/services/serverStatus.ts` when that
API exists. Preserve nullable fields and the `loading`, `online`, `offline`, and
`unavailable` state model. `createMockServerDataAdapter()` is for tests and
previews only and must not be presented as production data.

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
