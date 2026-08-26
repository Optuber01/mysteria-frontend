# Mysterria Homepage Redesign — UI/UX Audit

**Branch:** `Optuber/homepage-redesign-combined-20260803` (vs `main`, 72 commits, ~10,900 insertions)
**Audited:** Desktop 1440×900, preview deployment `mysterria-frontend-internal-dq1ykmjb0.vercel.app`
**Method:** 41 live-browser captures (20-stop full-page scroll sweep at ~700px intervals + 21 interaction states: hovers, clicks, tabs, modals, keyboard focus), each analyzed one-at-a-time by dedicated vision subagents; plus 8 parallel code-review subagents covering every new/changed component against `main`. No code was modified.

---

## Verdict

The redesign has a genuinely strong art direction — LotM-native voice, gold-on-black alchemy palette, mono terminal accents, an authored feel that decisively avoids generic AI-template output. But it ships in a **half-finished state**: a broken climax CTA (404), a chapter navigator that scrolls to the page top, a world section whose scenes are captured mid-transition more often than settled, internal production notes leaked into player-facing tooltips, illegible orbit nodes, an accessibility baseline with invisible keyboard focus in the primary nav, and a scroll architecture that contracts the document by ~5,200px mid-session while stacking ~130MB of compositor layers. Individually fixable; collectively it reads as unshipped.

---

## CRITICAL

1. **The emotional-climax CTA is a 404.** `DrinkAwakenScene.vue:90` links "Begin your journey" to `/play`; the router (`src/router/index.ts`) has no `/play` route (it's `/game`). It's also a raw `<a>`, forcing a full page reload out of the SPA — so users hit a 404 *and* lose SPA state. Verified against router table.

2. **Chapter navigation scrolls to page top.** Clicking "01 Discover / 03 Brew / 05 Awaken" landed all three captures on the homepage hero. Root cause: `goToChapter` (`ProgressionStoryV3.vue:328-336`) computes an *unclamped* target (`offsetHeight − innerHeight` can go negative → browser clamps `scrollTo` to 0), precomputes the coordinate instead of using an anchor, and the multi-second smooth flight gets invalidated by the deferred-chapter placeholder swap (`HomeView.vue:106-117,168-170`) and App's forced `scrollTop=0` on route change (`App.vue:46-53`).

3. **World-section scrollytelling never settles.** Across y8400→y11900 not one frame shows a clean scene: outgoing/incoming headlines double-exposed and clipped mid-glyph ("A Guardian **hanges he plan**.", "ild a place / at has / nsequences.", "Nothing here is a backd…"), stale hotspots from finished scenes stay live over leftover imagery, orphaned media fragments bleed off edges, captions cut mid-sentence. Transitions consume virtually the entire scroll budget — the narrative never gets one unobstructed beat per system. Scene-handoff math in `BeyondPathways.vue` (rail translation + per-beat clip/mask) overshoots its container.

4. **Guardians scene rests in a broken position.** After "Go to Guardians," the left copy column sits ~80–100px off-canvas clipping every line mid-glyph — persistent across two captures and a subsequent interaction (i13→i14). Not a transient animation frame; the landing composition is unusable. Same click also loses the inset-panel framing (canvas bleeds past the viewport edge, rail numerals land on pale imagery).

5. **Internal production notes leaked into player-facing UI.** Hotspot tooltips render CMS provenance commentary verbatim: *"This image is a Guardian encounter. Cosmos Incursions need their own capture before they earn a separate chapter."* (`BeyondPathways.vue:289`) and *"A genuine custom-creature encounter. A dedicated Wild Beyonder capture can replace it later."* (:281). This also violates the branch's own content doc rule (`docs/homepage-content.md:123`: no future-content promises requiring later edits).

6. **Keyboard focus is invisible in the primary nav.** After five Tabs, no focus indicator appears on any header item (i18). Cause: `HomeView.vue:142-146` overrides the app-wide ring with a near-invisible `#071f1d` outline for everything inside `.mysterria-home`, leaving only a white box-shadow that reads as an artifact elsewhere. Meanwhile a raw default-style white outline appears *stuck* on the footer RULES link even in hover-only captures (i19) — because clicking leaves DOM focus parked and no close path releases it (`HeaderItem.vue:41,362-366`). Focus styling is inconsistent three ways (global ring, home override, unstyled default).

7. **WORLD dropdown: click does nothing.** Hover opens instantly (`@mouseenter`, `HeaderItem.vue:30`); click then *toggles the already-open panel closed* under the cursor (`:39,308-311`) — i02 (click capture) shows no panel. First-touch users get open→instant-close flash. Also `aria-haspopup="true"` promises menu semantics the panel doesn't deliver.

8. **Most orbit pathways read as dead circles.** Dark-on-dark artwork (glyph palettes like `#403060` on the near-black seal fill, `pathways.ts:147-156` + `PathwayOrbit.vue:738`) combined with depth-dimming to opacity .46 / scale .62 (`PathwayOrbit.vue:314-316`) makes Door, Demoness, Chained, Fool, Hermit, Paragon, Moon, Wheel of Fortune appear as featureless black discs at various times. Labels are ~9px gray, single-line ellipsized ("Wheel of Fortune" clips). For the section whose job is choosing among 22 options, most options are effectively invisible. (Assets exist and load — this is pure presentation.)

9. **Live-world panel is a wall of "Unavailable" directly before the closer.** Four data rows + latest-update + two more statuses render bare "Unavailable"/blank, with the disclosure "No public towns, organization, event or discovery feed is connected." (grammar broken; network-engineering voice). Three-plus viewport-heights of dead values drain momentum right before "The portal is open." The section's climax is hollow.

10. **Deferred-chapter reservation mismatches reality by −580svh.** Reserved min-heights 420+690+430svh (`HomeView.vue:168-170`) vs actual mounted heights ~270+590+100svh. Users scroll through up to 330svh of empty tinted placeholder; on reveal the whole document contracts ~5,200–6,300px in one commit — visible jumps outside Chrome's scroll anchoring. A single Tab press triggers `revealAllChapters()` mounting all three chunks synchronously (one giant reflow).

11. **Compositor/GPU budget is critically oversubscribed.** Hero fog stack: three animated `blur(28/44/58px)` layers ≈136vw×66–105vh each (~24MB alone at DPR2; ~70–90MB with image+content), plus ~20 filtered/backdrop-filter surfaces site-wide, plus BeyondPathways' promoted 520vw×100vh rail layer (~60MB) re-rasterized through masks/clip-paths during translation, plus **two WebGL contexts created before the user scrolls past the hero** (VanillaBookRig `onMounted` ungated `PathwayOrbit`-chunk; skinview3d context created while parent is `visibility:hidden`). Low-power mitigation exists in PathwayOrbit only; hero/world ignore it.

12. **i18n regression vs main.** Homepage skips lazy i18n loading entirely (`if (home || i18nLoaded) return`, `HeaderItem.vue:238-243`) so localized (Ukrainian) users get hardcoded English on `/` with pop-translate after navigating away; the footer dropped `t()` completely vs main (`FooterItem.vue:22-27`); a potentially Ukrainian news title renders into the English page with no `lang` attribute (`BeyondPathways.vue:141,206`). WCAG 3.1.x failures introduced by this branch.

---

## MAJOR — by section

### Hero
- **No scrim protects the headline.** Only protection is a local blurred cream ellipse (`HomeHero.vue:213-222`); the radial "focus" layer is deliberately transparent at center (`:193-197`). Headline passes ~14.6:1 on the halo but drops to ~2.1:1 over dark foliage — legibility currently rides on luck of the artwork (old main had a dedicated overlay; removed).
- **Primary CTA hover weakens itself:** `.hero-action:hover` shadow `rgba(16,41,36,.15)` cascades over the resting green glow (`:334-337`) — hovering dims the button; bg shift #21644d→#184f3c ≈1.35:1 luminance delta is sub-perceptual. Meanwhile the *secondary* CTA's hover reads stronger, inverting hierarchy. No `:active` states anywhere (tap highlight globally suppressed).
- **Copy-address feedback whispers:** same-color 13px "Copy"→"Copied" text swap, no icon/toast (`:58,368`); clipboard-denial path silent (`catch {}`, `:123-125`); and it behaves differently from the header chip's ✓ badge — two copy affordances, two interaction languages on one page.
- **Micro-type contrast fail:** connection-bar labels `rgba(16,41,36,.52)` ≈ **2.3:1** at ~8.8px (`:364`). Scroll cue/fog message at ~10px.
- Address + player count shown twice within ~100px of viewport (header chip + hero bar) — uncoordinated duplication.

### Progression story (scrollytelling)
- **Debug-overlay aesthetics shipped inside an asset:** pure red/blue/yellow rectangles baked into `cauldron-interface.png` render verbatim in the altar GUI (`AltarBrewScene.vue:23`), with no legend; animated chips then fly into the same slots, doubling icons. Looks like a wireframe shipped to production.
- **Step indicator states are hue-only and phase-skewed:** complete = color-only change (WCAG 1.4.1 fail, `ProgressionStoryV3.vue:88,600-602`); active index flips at window boundaries while the visible scene lags (book exits 0.485–0.525, altar completes ~0.55 vs boundary 0.38/0.54 at `:229-233,261-263`) → footer says one chapter while the stage shows another.
- **Formula book reads as unfinished:** left leaf ~55% blank parchment with ghost skeleton rectangles (invisible hover-only hotspots, `FormulaBookScene.vue:202-222`); unpainted atlas backs on page turns (`VanillaBookRig.vue:522-544`).
- **Zero camera movement:** identical frozen brewery backdrop across ~2,100px; only the right artifact swaps. "Scrollytelling" plays as slideshow-with-wallpaper (confirmed by design in code — no parallax exists).
- **Pinned intro never exits** ("PLAYABLE PROGRESSION / Find it. Brew it. Become it." keyed only to entry var, `:481`) — redundant clutter competing with each chapter's own kicker, including a stale "Sequence 9 · Seer of the Fool Pathway" tagline during Drink/Awaken.
- **Stock Steve skin as the awakening centerpiece** (`steve.png`, `MinecraftPlayer.vue:25,280`): default Minecraft model with arms raised — placeholder energy on the flagship thematic beat; contact shadow fades to nothing exactly when `advance` mode lifts the figure off the ground (`:169,:319-339`).
- Figure sliced at section exit boundary (parallax-layer mismatch); inactive chapter-rail labels ~3.9:1 (AA fail); "Hover the book's entries…" instruction is hover-only wording despite tap support existing.

### Pathway orbit
- **Hover hijacks the entire feature:** mouseenter swaps emblem/name/tagline/image with no click (`PathwayOrbit.vue:481-487,288`) — cursor travel causes disruptive full-content swaps; and there is **no distinct selected state**: `is-selected` class binding exists (`:69`) with **no CSS rule**, so browsing vs committed look identical.
- Hover doesn't emit selection → JoinJourney's `selected-pathway` (`HomeView.vue:30`) disagrees with what the user last looked at.
- Background hue retargets a full-viewport 3-radial-gradient on every hovered token crossed (`:294-300,706-713`) — repaint-heavy and disorienting; then hard-cuts into the next section (theme lives only on this section).
- **Desktop has zero pagination/discovery affordance** for the rear half of the orbit — counter/arrows/hint styles exist as dead CSS (`:760-775`) with no markup; discovery relies on undocumented drag/arrows/hover-parallax. Mobile got pagination; desktop didn't.
- Dossier drawer is viewport-fixed regardless of content (`:797`): short names leave a ~130px void; long names push content down — vertical rhythm reshuffles every selection; display-type clamp(3.7–6.6rem) with no wrap constraint amplifies it.
- Tablist violates the tabs pattern: no roving tabindex, no arrow-key handling (`:24-39`); token buttons use `aria-pressed` toggle semantics for what is radio-like single choice; accessible name pollution "Inspect Death ␣" (trailing space, `:123`).
- Rotation writes layout-triggering `left/top` percentages for up to 22 absolutely-positioned buttons per rAF frame (`:303-320,340-346,384-395,498-516`) instead of transforms.

### World section
- Rail "Go to X" buttons have **no perceivable hover state** (i12) — interactivity undiscoverable until clicked blind.
- Dual numbering contradiction: kicker "FIELD NOTE 02 / 05" (five features, `BeyondPathways.vue:60`) vs six numbered rail stops including "06 Live world" (`:154-167,:328`) — which count is real?
- Expanded hotspot tooltips overlap the rail column with no flip-away-from-edge logic (i14); rail index collides with display type at multiple stops (s14,s17).
- Orphaned edge fragments from adjacent scenes bleed context-free into the Live-world slide (i15); red pixel artifact above "+ Player settlement" (s15); cathedral render so dark the actual craft is lost (s16); tilted cards clipped against the header line (s16); stale "SCROLL THROUGH THE FIELD NOTES" hint still pinned as the join section arrives.
- Word-reveal headline parks half-faded if the user stops at section entry (s11).

### Join + footer
- **Decorative "ORBIT CARRIED FORWARD" sigil collides with the conversion column** — terminal dot lands beside step-03 body text, label tucked under the sticky header (i16), with no explanation of why it's there.
- Join background imagery renders near-invisible dark mud — "The portal is open." promises a visual payoff that never appears; hard tonal seam from the black section above.
- **No social/Discord link anywhere** in join or footer — for an MC server whose retention loop is community, the footer's "COMMUNITY" is text-only while STAFF/WIKI/MAP exist only in the smallest type on the page.
- Copy confirmation caption sits *outside* the cream card at ~11px muted-on-dark (lowest-contrast element in the highest-stakes interaction) and nudges layout when inserted (i17).
- Page ends abruptly after legal row — no echoed address/CTA after the theatrical portal beat.

### Header/nav
- Light/dark flip has no hysteresis: single `scrollY < 24` boolean (`HeaderItem.vue:279`) re-flips during jitter/overscroll → crossfade flicker; route changes smooth-sweep through the threshold (`App.vue:46-53` + global `scroll-behavior:smooth`) so the header visibly animates dark→light after every navigation from depth.
- Fixed-bar height animates 82↔72px per frame (relayout each frame) and backdrop-filter blur transitions snap on non-interpolating browsers (`:408-422`); `scroll-padding-top:72px` assumes scrolled height but top-of-home header is 82px → anchors hide 10px under the bar.
- AuthButton (register/session UI) replaced by a bare LOGIN link on the homepage; "Home" nav item dropped (logo is now the only home affordance); services attention-dot discovery nudge dropped; mobile drawer service descriptions dropped.
- GUIDE hover doubles two weak cues (faint pill + short underline); LOGIN is the faintest element in the frosted top bar; dropdown panel boundary dissolves into the page (hairline border) with descriptions at borderline ~11px contrast; 13px trigger→panel gap invites hover-flicker (180ms grace).
- Hamburger keeps `aria-label="Open navigation"` when expanded; skip-link exists only on the homepage (same header ships without one everywhere else); z-index strategy is magic numbers (1000/2000/80/2).

### Copy & content
- **Jargon wall with no glossary:** first words on the page are "A PLAYABLE PATHWAY SYSTEM"; then "act your Sequence," "Beyonder Creature you must hunt," "Madness," "Digest," "acting points," "Energy Shards," "Secret Order," "Church Core," "Resolve," "potion loop" — nothing inline ties any term to the single buried beginner-guide link.
- **Sequence-title confusion everywhere:** tarot pathway name with an unrelated proper noun beneath — Wheel of Fortune → "Monster", Abyss → "Criminal", Death → "Corpse Collector", Emperor → "Lawyer" — reads as mislabeled entries; naming register inconsistent ("Black Emperor" beside plain "Emperor").
- **Dossier states the same fact twice side-by-side:** "41 documented abilities across 9 Sequences…" immediately followed by Archive row "9 Sequences · 41 abilities" (`pathways.ts:241` + `PathwayOrbit.vue:211,214`).
- **Direct factual contradiction about brewing rules:** live copy says supplements go in "any order, but never before the mains" (`ProgressionStoryV3.vue:189`) vs data file "in their written order" (`progression.ts:116`) — one must be wrong (the data file feeds only dead components).
- "Explore 22 pathways" hardcoded while everything else derives counts; omits the Boons tab entirely; will rot.
- Tone registers collide: terminal ops voice vs editorial field notes vs high-fantasy hero copy vs flat sysadmin disclosures ("Server status and updates are shown only when a first-party source answers.").
- CTA/outcome mismatches: header "Play" and hero "Start playing" both lead to `/guide` (promise play, deliver docs); two controls to the same destination in one hero viewport; "Archive" means modal on mobile and `/pathways/:id` on desktop.
- Footer legal self-contradiction: "Unofficial fan project · All rights reserved."
- Triple/quadruple redundancy in single viewports: sequence identity repeated 4–5× during Awaken; address + copy affordance ×3 across page.

### Performance/architecture (UX-visible)
- Five independent scroll engines (hero, header, progression, orbit, world) each queue their own rAF per scroll event with read-after-write interleave → **4–5 forced synchronous layouts per frame** (~250–300 flushes/sec during scroll); orbit additionally invalidates 22 inline-styled tokens/frame.
- three.js statically imported into the first-scroll progression chunk (~150KB gz eager) — partly for a single `Vector3` in `MinecraftPlayer.vue:22`; skinview3d chunk downloads at page load though its scene stays hidden until journey ≥68%.
- 3.79MB mp4 (no lower-bitrate variant) paid on any full-page scroll; 99KB webp used where a 34KB AVIF twin exists; full-scroll media worst case ≈6MB.
- Keydown reveals all three deferred chapters synchronously (one massive reflow); news API round-trip fires 1200px early.
- Global mousemove→rAF cursor loop runs on `/` where the cursor element is v-if'd out (`App.vue:85` vs `:10`).

---

## MINOR (selected)

- Status-chip separator clings to the number ("mc.mysterria.net **·73**") — `::before` margin vs flex gap (`ServerStatusChip.vue:94-98`); chip hardcodes address instead of importing `MYSTERRIA_ADDRESS`; chip hover ≈invisible (bg deltas both ≈#08151a); mobile-server-status `!important` block outranks scoped hovers (hover literally impossible by construction, `HeaderItem.vue:754-763`) and resurrects a chip another component hides `<768px`.
- Dead code shipped in repo (tree-shaken but diverging): `ProgressionStory.vue`, `ProgressionStoryV2.vue`, `RitualAltarScene.vue`, `progression3/DigestionScene.vue` (with dangling inspect IDs), `data/progression.ts`, legacy `public/pathways/*.webp` duplicates, 243KB unused `emporium.webp`; dead CSS blocks (orbit controls, catalog fallback promised by the content doc but never rendered, `.is-behind` overridden by inline style).
- Inspector popover mounts `position:fixed` whenever `open=true` even with null anchor (`SceneInspectorPopover.vue:68-98`) — prime suspect for the thin sliver pinned at the right window edge in every capture; scrim closes on `mousedown.self` while everything else uses click; closing via IntersectionObserver silently discards user context.
- Escape clears progression inspector only when focus is inside the stage; dossier lacks window-level Escape fallback; `dossierTrigger` never cleared after restore.
- Division-by-zero idiom relied upon in `drinkOpacity` (`fadeWindow(0.66,2,2,0.69)`), saved only by clamp01 rejecting non-finite.
- `PlayerAnimation` reallocated per scroll frame, old ones never disposed (GC churn); bubble respawn breaks the seeded-PRNG determinism claim.
- Mixed-language news title without `lang="uk"`; video description survives only as `title` attribute (ignored by many AT combos); aria-label on bare divs is dead ARIA (needs role=group).
- Short-landscape seam: `(max-width:720px)(max-height:690px)` removes the −100svh overlap while hero keeps 190svh travel → dead ~100svh band.
- Reduced-motion: strong overall (static layouts, unpinned hero, particles freeze) but `update()` pins progress at 0 — safe today only because the same query hides the nav; fragile coupling.
- No CSP/HSTS/security headers added in `vercel.json` (pre-existing gap, unchanged); no Sentry/analytics overhead added (clean).

---

## What works (keep these)

- **Authored art direction:** LotM-native voice, gold/black alchemy palette, mono accents — nothing generic about the visual language.
- **Server-status system:** live player count in a persistent chip, single-flight shared polling replacing main's per-instance mcapi polls, honest "Checked HH:MM" freshness stamps.
- **Cream SERVER ADDRESS card** in the closer — the one light surface in a dark stretch; unmistakable focal device with correct hierarchy.
- **Honest expectations:** Bedrock caveat, "no permanent cost," graceful degradation labels, UNOFFICIAL FAN PROJECT disclosure.
- **Wayfinding rails:** world right-rail active-state sync never lies even when layout breaks; progression chapter-rail active state is instantly readable.
- **Crafted MC pastiche where it lands:** parchment book spread, altar frame ornaments, five-step footer rail mapping Discover→Awaken; hotspot pill anatomy (+/− state).
- **Reduced-motion support is unusually thorough** (static layouts, unpinned hero, particle freezing, composable listening to live preference changes).
- **Cleanup discipline in teardown:** listeners/rAF/WebGL contexts disposed correctly wherever created.

---

## Regressions vs `main` (dropped features)

- Localized footer + localized chip tooltip (all hardcoded English now)
- i18n loading on the homepage (deliberately skipped)
- "Home" nav item; external-link support in nav config; services attention-dot nudge with localStorage dismissal
- AuthButton (register/session UI) on the homepage header
- Service descriptions in the mobile drawer
- Dedicated hero text-protection overlay
- Old homepage had none of the deferred-chapter height-mismatch/jank machinery (simpler, stabler page)

---

## Method caveats

- Captures used programmatic scrolling with 1.8–2.5s settles: IntersectionObserver/lazy-loading behavior (e.g., s13's missing Guardians media, late AVIF decodes) may differ under real wheel input — though i13/i14 prove the Guardians misalignment persists across interactions, and the height-reservation math is confirmed in code, not just pixels.
- Body scroll-lock: code implements overflow-hidden + inert correctly (`PathwayOrbit.vue:578-594`), yet captures show unlocked scrolling behind the dossier — either the deployed preview predates HEAD or the iOS Safari gap applies; needs a manual retest.
- Two subagent reports returned truncated tails (global-infra findings 1–16 and a11y findings 1–24 summaries); their conclusions are preserved via the "top actions" lines and corroborated by overlapping agents' citations.

## Highest-leverage fixes (ordered)

1. Point "Begin your journey" at `/game` (or add the route) — one line, removes a 404 at the page's climax.
2. Fix `goToChapter` clamping/anchoring; make chapter buttons scroll-into-view anchored.
3. Clamp world-scene handoff math so resting states settle clean; kill stale-hotspot persistence; fix the Guardians offset.
4. Strip production notes from tooltip copy; resolve the brewing-rule contradiction; de-jargon or glossary-link first-use terms.
5. Unify focus-visible styling (one tokenized rule, visible on light AND dark); release focus on dropdown close.
6. Give orbit nodes legible treatments (contrast-safe glyph plates, larger non-ellipsized labels, distinct selected state, desktop pagination affordance).
7. Reconcile reserved min-heights with mounted heights (or keep placeholders mounted and swap in place).
8. De-eager three.js; gate WebGL context creation on visibility; split/re-encode the mp4; collapse the fog stack.
9. Restore i18n on home + footer; add Discord/social to the closer.
