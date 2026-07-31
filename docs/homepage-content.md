# Mysterria homepage content guide

The homepage is assembled in `src/views/HomeView.vue` from focused components
in `src/components/home/`. It uses real project imagery and the existing server
logo. No generated screenshots or fantasy art are included.

## Verified data sources

- Server address: `src/services/serverStatus.ts`
- Live online state and player count: `mcapi.us` through
  `getServerStatus()`. A failed request renders **Unavailable**.
- Latest update: the existing `newsAPI.getLatest()` response. A failed request
  renders **Unavailable**.
- Standard Pathways: `src/data/pathways.ts`, derived from
  `src/assets/sources/pathway-abilities.json`. The ten boon IDs used by the
  existing Pathway archive are excluded, leaving the 22 standard Pathways.
- Pathway strengths and the playstyle preview are derived from the earliest
  documented ability names in the archive. They are not separate editorial
  claims.

`createMockServerDataAdapter()` is available for tests and previews. Production
code uses the live adapter and must never present mock values as live facts.

## Content placeholders to replace

The copy deliberately labels missing details instead of inventing mechanics.
Replace these notes only after the server team verifies the behavior:

- Potion recipe sources, brewing interface and digestion feedback
- Advancement ritual conditions, failure behavior and safeguards
- Instability causes, thresholds, consequences and recovery
- Organization creation, territory, permissions and progression
- Dungeon, creature, location, event, economy, housing and town showcase
  details and approved in-game media
- Live towns/organizations, world event and discovery feeds

The relevant copy lives in:

- `ProgressionStory.vue` — the eight-stage progression loop
- `SystemChapters.vue` — the five system chapters
- `BeyondPathways.vue` — original world content
- `LivingWorld.vue` — live information and unavailable states

## Replacing live-world integrations

Implement `getLivingWorldSnapshot()` in `src/services/serverStatus.ts` when a
first-party API exists. Keep nullable fields and explicit unavailable UI so a
partial API response remains honest. If the status provider changes, preserve
the `ServerStatus` state model (`loading`, `online`, `offline`, `unavailable`).

## Assets and performance

Hero and world scenes reuse optimized Minecraft WebP files under
`src/assets/images/optimized/`. Below-the-fold images use native lazy loading.
The hero depth and progression story update only while visible; orbit animation
stops when it reaches its snap target. Reduced-motion mode removes scroll-linked
transforms and animated transitions.

When adding replacement images:

1. Use approved in-game captures only.
2. Export WebP or AVIF at the actual maximum display size.
3. Keep the hero image under roughly 300 KB where practical.
4. Add intrinsic `width` and `height`, and lazy-load below-the-fold media.

## Interaction and accessibility checks

- The Pathway orbit supports drag, pointer position, wheel, arrow keys and
  previous/next buttons.
- Mobile supports swipe plus previous/next buttons.
- The complete Pathway list is always available through the fallback disclosure.
- Keep all interactive targets at least 44 by 44 CSS pixels.
- Every hover preview must remain reachable by focus and click/touch.
- Do not remove the reduced-motion media queries or static content fallbacks.
