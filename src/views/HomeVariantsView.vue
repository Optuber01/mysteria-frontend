<template>
  <div class="variant-lab">
    <header class="lab-header">
      <div class="lab-header__brand">
        <IconLogo class="lab-header__logo" aria-hidden="true" />
        <span>Mysterria / homepage studies</span>
      </div>
      <p>Ten distinct directions for the next homepage pass.</p>
      <RouterLink class="lab-header__exit" to="/">Exit studies <span aria-hidden="true">↗</span></RouterLink>
    </header>

    <nav class="lab-index" aria-label="Homepage variants">
      <a v-for="variant in variants" :key="variant.id" :href="`#${variant.id}`">
        <span>{{ variant.number }}</span>
        <b>{{ variant.name }}</b>
      </a>
    </nav>

    <main>
      <section
        v-for="variant in variants"
        :id="variant.id"
        :key="variant.id"
        class="variant"
        :class="`variant--${variant.id}`"
        :aria-labelledby="`${variant.id}-title`"
      >
        <div class="variant__topline">
          <span>{{ variant.number }} / {{ variant.name }}</span>
          <span>{{ variant.philosophy }}</span>
        </div>

        <header class="variant__header">
          <div class="variant__brand">
            <IconLogo class="variant__logo" aria-hidden="true" />
            <strong>Mysterria</strong>
          </div>
          <nav aria-label="Variant navigation">
            <span>Guide</span>
            <span>Pathways</span>
            <span>World</span>
          </nav>
          <div class="variant__utilities">
            <span>EN / UK</span>
            <span class="variant__status"><i /> 62 online</span>
            <b>Play ↗</b>
          </div>
        </header>

        <div class="variant__stage">
          <div class="variant__copy">
            <span class="variant__eyebrow">{{ variant.eyebrow }}</span>
            <h2 :id="`${variant.id}-title`">{{ variant.headline }}</h2>
            <p>{{ variant.body }}</p>
            <div class="variant__actions">
              <a href="#" @click.prevent>{{ variant.cta }} <span aria-hidden="true">→</span></a>
              <a href="#" @click.prevent>{{ variant.secondary }}</a>
            </div>
            <div class="variant__ip"><i /> mc.mysterria.net <button type="button" aria-label="Copy server address">□</button></div>
          </div>

          <div class="variant__art" aria-label="Homepage image direction">
            <img class="variant__image variant__image--main" :src="variant.image" alt="" loading="lazy">
            <img class="variant__image variant__image--secondary" :src="variant.secondaryImage" alt="" loading="lazy">
            <div class="variant__art-label">{{ variant.artLabel }}</div>
            <div class="variant__scene-index" aria-hidden="true">01 · 02 · 03 · 04 · 05</div>
          </div>
        </div>

        <div class="variant__follow-through">
          <span class="variant__follow-number">01</span>
          <div>
            <strong>{{ variant.followTitle }}</strong>
            <p>{{ variant.followText }}</p>
          </div>
          <span class="variant__follow-arrow" aria-hidden="true">↓</span>
        </div>
      </section>
    </main>

    <footer class="lab-footer">
      <strong>Choose a direction.</strong>
      <span>These are visual studies, not ten competing production routes.</span>
      <RouterLink to="/">Return to the current homepage ↗</RouterLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
import IconLogo from '@/assets/icons/IconLogo.vue';
import heroDawnCliffside from '@/assets/images/home/hero/hero-dawn-cliffside.webp';
import heroBlackgoldSanctuary from '@/assets/images/home/hero/hero-blackgold-sanctuary.webp';
import heroWatchtowerNight from '@/assets/images/home/hero/hero-watchtower-night.webp';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import emporium from '@/assets/images/home/world/emporium.webp';

type Variant = {
  id: string;
  number: string;
  name: string;
  philosophy: string;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  secondary: string;
  image: string;
  secondaryImage: string;
  artLabel: string;
  followTitle: string;
  followText: string;
};

const variants: Variant[] = [
  {
    id: 'editorial', number: '01', name: 'Editorial', philosophy: 'A collectible design magazine',
    eyebrow: 'Issue 01 / The Fool', headline: 'A world worth getting lost in.',
    body: 'A Lord of the Mysteries-inspired Minecraft server built for Pathways, potions, and consequences.',
    cta: 'Enter the world', secondary: 'Read the latest dispatch', image: heroDawnCliffside, secondaryImage: breweryScene,
    artLabel: 'Cliffside / 06:42', followTitle: 'Field notes / becoming a beyonder', followText: 'The next spread introduces the first potion as a chapter, not a feature list.',
  },
  {
    id: 'archive', number: '02', name: 'Occult archive', philosophy: 'A forbidden artifact with a pulse',
    eyebrow: 'Folio 001 / Restricted', headline: 'Your first sequence starts in the dark.',
    body: 'Open the archive. Choose a Pathway. Leave a mark on a world that remembers.',
    cta: 'Enter the archive', secondary: 'Open the latest folio', image: heroBlackgoldSanctuary, secondaryImage: heroWatchtowerNight,
    artLabel: 'Blackgold Sanctuary / Sequence IX', followTitle: 'The sequence', followText: 'A ceremonial book rises through smoke, then gives way to the rituals that shape your ascent.',
  },
  {
    id: 'atlas', number: '03', name: 'Night atlas', philosophy: 'A living map of the unknown',
    eyebrow: 'Coordinates 51.09 / 03.14', headline: 'Read the sky. Choose your Pathway.',
    body: 'A cinematic RPG server where every route leads deeper beyond the veil.',
    cta: 'Plot a route', secondary: 'View the latest signal', image: heroWatchtowerNight, secondaryImage: heroBlackgoldSanctuary,
    artLabel: 'North Watchtower / Field 05', followTitle: 'Observation log', followText: 'The book section becomes a route line: formula, ingredients, brew, awaken, digest.',
  },
  {
    id: 'grimoire', number: '04', name: 'Grimoire', philosophy: 'A tactile field journal assembled by a Seer',
    eyebrow: 'Marginalia / Keep your notes', headline: 'Brew what should not exist.',
    body: 'Collect clues, follow rituals, and build a story that feels handwritten into the world.',
    cta: 'Turn the page', secondary: 'Read the latest entry', image: breweryScene, secondaryImage: emporium,
    artLabel: 'Evidence A / Alchemist’s Bench', followTitle: 'The first page', followText: 'The progression chapter opens like a spread: formula on the left, a living book on the right.',
  },
  {
    id: 'console', number: '05', name: 'Command console', philosophy: 'The server as a mysterious operating system',
    eyebrow: 'MYSTERRIA // ONLINE', headline: 'Connect to the unknown.',
    body: 'Pathways, dungeons, rituals. One persistent world. Your next command is the first decision.',
    cta: '> Connect to server', secondary: 'View latest log', image: emporium, secondaryImage: heroWatchtowerNight,
    artLabel: 'WORLD_FEED / EMPORIUM', followTitle: 'Boot sequence', followText: 'A clean route from formula to awakening replaces soft marketing with a readable system.',
  },
  {
    id: 'arcade', number: '06', name: 'Arcade HUD', philosophy: 'A premium game-mode select screen',
    eyebrow: 'Choose your first sequence', headline: 'Pick a path. Make it matter.',
    body: 'Jump into a Lord of the Mysteries-inspired Minecraft RPG full of worlds to unlock and powers to earn.',
    cta: 'Play the first sequence', secondary: 'Read the changelog', image: emporium, secondaryImage: heroDawnCliffside,
    artLabel: 'WORLD 01 / THE EMPORIUM', followTitle: 'Next mode: progression', followText: 'The book rises as a playable sequence select, with the controls carried forward as a HUD rail.',
  },
  {
    id: 'botanical', number: '07', name: 'Field journal', philosophy: 'Quiet naturalist sanctuary and living alchemy',
    eyebrow: 'Field journal / Entry 01', headline: 'Cultivate something impossible.',
    body: 'Find a quiet corner of the world, brew your first potion, and grow into a power of your own.',
    cta: 'Begin the field note', secondary: 'Read the newest entry', image: heroDawnCliffside, secondaryImage: breweryScene,
    artLabel: 'Cliffside herbarium / Dawn', followTitle: 'Specimen one', followText: 'The first chapter becomes a calm brew log, with the book emerging from a shared paper baseline.',
  },
  {
    id: 'observatory', number: '08', name: 'Observatory', philosophy: 'Choose a Pathway by reading the sky',
    eyebrow: 'Chart 01 / The veil is thin', headline: 'The stars already know your route.',
    body: 'Step into a dark, living atlas of dungeons, rituals, and hidden powers.',
    cta: 'Read the chart', secondary: 'Open the newest observation', image: heroWatchtowerNight, secondaryImage: heroBlackgoldSanctuary,
    artLabel: 'Azimuth 41° / Night watch', followTitle: 'The observation log', followText: 'The progression book rises like a luminous volume from the lower edge of the chart.',
  },
  {
    id: 'poster', number: '09', name: 'Travel poster', philosophy: 'A saturated expedition poster for crossing the veil',
    eyebrow: 'The veil is open', headline: 'Cross over. Become more.',
    body: 'Choose a Pathway, brew your first potion, and make your way beyond the veil.',
    cta: 'Enter the world', secondary: 'Read the latest dispatch', image: heroDawnCliffside, secondaryImage: emporium,
    artLabel: 'Destination: Cliffside Sanctuary', followTitle: '01 / The first step', followText: 'A route line carries directly into the book chapter, with no blank spacer between worlds.',
  },
  {
    id: 'modernist', number: '10', name: 'Modernist system', philosophy: 'A restrained Swiss editorial diagram',
    eyebrow: 'System / Mysterria 01', headline: 'A Minecraft server with a memory.',
    body: 'Pathways, rituals, dungeons, and a world that remembers what you do.',
    cta: 'Play now', secondary: 'Read the changelog', image: heroBlackgoldSanctuary, secondaryImage: heroDawnCliffside,
    artLabel: 'BLACKGOLD / 04—05', followTitle: '01 / Become a beyonder', followText: 'A single rule and chapter number move directly into the progression system.',
  },
];
</script>

<style scoped>
.variant-lab {
  --lab-ink: #1c1916;
  min-width: 0;
  color: var(--lab-ink);
  background: #171613;
  font-family: var(--font-body, Manrope, sans-serif);
}

.lab-header {
  position: sticky;
  z-index: 20;
  top: 0;
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 12px clamp(16px, 4vw, 56px);
  color: #f6f1e8;
  background: rgba(23, 22, 19, .9);
  border-bottom: 1px solid rgba(246, 241, 232, .14);
  backdrop-filter: blur(16px);
}

.lab-header__brand { display: inline-flex; align-items: center; gap: 10px; font: 700 .75rem/1 var(--font-mono, monospace); letter-spacing: .08em; text-transform: uppercase; }
.lab-header__logo { width: 30px; height: 30px; }
.lab-header p { margin: 0; color: rgba(246, 241, 232, .58); font-size: .82rem; }
.lab-header__exit { margin-left: auto; color: #fff; font-size: .78rem; }
.lab-header__exit:hover { color: #d1b7ff; }

.lab-index {
  position: fixed;
  z-index: 21;
  top: 50%;
  right: 16px;
  display: grid;
  gap: 4px;
  transform: translateY(-50%);
}
.lab-index a { width: 112px; display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; color: rgba(246, 241, 232, .58); background: rgba(23, 22, 19, .74); font: 700 .56rem/1 var(--font-mono, monospace); letter-spacing: .06em; text-transform: uppercase; transition: color .2s, background-color .2s, transform .2s; }
.lab-index a:hover { color: #fff; background: #322d48; transform: translateX(-4px); }
.lab-index span { color: #a88cff; }
.lab-index b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; }

.variant { --accent: #7656d8; --paper: #f6f0e5; --soft: #e8dfd1; --muted: #746b5d; position: relative; min-height: 820px; padding: 20px clamp(20px, 5vw, 80px) 0; overflow: hidden; background: var(--paper); color: var(--lab-ink); scroll-margin-top: 72px; }
.variant__topline { position: relative; z-index: 3; display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--lab-ink) 18%, transparent); color: var(--muted); font: 700 .58rem/1.2 var(--font-mono, monospace); letter-spacing: .12em; text-transform: uppercase; }
.variant__header { position: relative; z-index: 3; min-height: 64px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
.variant__brand { display: inline-flex; align-items: center; gap: 9px; font: 800 1rem/1 var(--font-display, sans-serif); }
.variant__logo { width: 34px; height: 34px; }
.variant__header nav { display: flex; justify-content: center; gap: 22px; color: var(--muted); font: 700 .58rem/1 var(--font-mono, monospace); letter-spacing: .1em; text-transform: uppercase; }
.variant__utilities { justify-self: end; display: flex; align-items: center; gap: 14px; color: var(--muted); font: 700 .58rem/1 var(--font-mono, monospace); letter-spacing: .08em; text-transform: uppercase; }
.variant__utilities b { padding: 9px 13px; border-radius: 999px; color: #fff; background: var(--accent); }
.variant__status { display: inline-flex; align-items: center; gap: 5px; }
.variant__status i, .variant__ip i { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; background: #31ad72; }
.variant__stage { position: relative; min-height: 575px; display: grid; grid-template-columns: minmax(280px, .85fr) minmax(440px, 1.5fr); align-items: center; gap: 5vw; }
.variant__copy { position: relative; z-index: 4; max-width: 540px; }
.variant__eyebrow { display: block; margin-bottom: 20px; color: var(--accent); font: 800 .6rem/1.2 var(--font-mono, monospace); letter-spacing: .16em; text-transform: uppercase; }
.variant__copy h2 { max-width: 570px; margin: 0 0 22px; font: 800 clamp(3.2rem, 6vw, 6.6rem)/.9 var(--font-display, sans-serif); letter-spacing: -.055em; }
.variant__copy p { max-width: 420px; margin: 0 0 27px; color: var(--muted); font-size: clamp(.95rem, 1.25vw, 1.12rem); line-height: 1.6; }
.variant__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 18px; }
.variant__actions a:first-child { display: inline-flex; align-items: center; gap: 10px; padding: 14px 19px; border-radius: 999px; color: #fff; background: var(--accent); font-weight: 800; box-shadow: 0 12px 24px color-mix(in srgb, var(--accent) 25%, transparent); }
.variant__actions a:last-child { color: var(--muted); font-size: .82rem; font-weight: 800; }
.variant__actions a:hover { filter: brightness(1.06); }
.variant__ip { display: inline-flex; align-items: center; gap: 9px; color: var(--muted); font: 700 .72rem/1 var(--font-mono, monospace); }
.variant__ip button { width: 25px; height: 25px; padding: 0; border: 1px solid currentColor; border-radius: 50%; color: inherit; background: transparent; font-size: .8rem; }
.variant__art { position: relative; min-height: 530px; isolation: isolate; }
.variant__image { position: absolute; max-width: none; object-fit: cover; filter: saturate(1.04) contrast(1.02); transition: transform .6s cubic-bezier(.22, 1, .36, 1), filter .4s; }
.variant__image--main { z-index: 1; inset: 0; width: 100%; height: 100%; border-radius: 34px; }
.variant__image--secondary { z-index: 2; right: -4%; bottom: -5%; width: 31%; height: 32%; border: 10px solid var(--paper); border-radius: 14px; box-shadow: 0 18px 38px rgba(31, 26, 20, .17); }
.variant__art:hover .variant__image--main { transform: scale(1.025); filter: saturate(1.13) contrast(1.04); }
.variant__art-label { position: absolute; z-index: 4; left: 20px; bottom: 18px; padding: 10px 13px; border-radius: 999px; color: #fff; background: rgba(18, 17, 16, .66); backdrop-filter: blur(12px); font: 700 .6rem/1 var(--font-mono, monospace); letter-spacing: .1em; text-transform: uppercase; }
.variant__scene-index { position: absolute; z-index: 4; right: 18px; top: 17px; color: rgba(255, 255, 255, .72); font: 700 .58rem/1 var(--font-mono, monospace); letter-spacing: .14em; }
.variant__follow-through { position: relative; z-index: 3; min-height: 116px; display: grid; grid-template-columns: 52px minmax(0, 1fr) 28px; align-items: center; gap: 18px; max-width: 690px; padding: 18px 0 24px; border-top: 1px solid color-mix(in srgb, var(--lab-ink) 18%, transparent); }
.variant__follow-number { color: var(--accent); font: 800 1.8rem/1 var(--font-display, sans-serif); }
.variant__follow-through strong { display: block; margin-bottom: 3px; font: 800 .8rem/1.2 var(--font-mono, monospace); letter-spacing: .12em; text-transform: uppercase; }
.variant__follow-through p { margin: 0; color: var(--muted); font-size: .79rem; }
.variant__follow-arrow { color: var(--accent); font-size: 1.4rem; }

/* 01 Editorial */
.variant--editorial { --paper: #f3eee4; --accent: #2449b7; --muted: #706b63; }
.variant--editorial .variant__copy h2 { font-family: Georgia, serif; font-weight: 700; letter-spacing: -.055em; }
.variant--editorial .variant__stage { grid-template-columns: minmax(300px, .7fr) minmax(520px, 1.55fr); }
.variant--editorial .variant__image--main { border-radius: 0; clip-path: polygon(4% 0, 100% 0, 100% 100%, 0 100%); }
.variant--editorial .variant__image--secondary { border-width: 6px; border-radius: 0; transform: rotate(2deg); }

/* 02 Occult archive */
.variant--archive { --paper: #0a1018; --lab-ink: #eee5d2; --muted: #a9a391; --soft: #17252a; --accent: #ba914b; }
.variant--archive .variant__topline, .variant--archive .variant__header { border-color: rgba(238, 229, 210, .17); }
.variant--archive .variant__copy h2 { font-family: Georgia, serif; font-weight: 400; letter-spacing: -.03em; }
.variant--archive .variant__image--main { border-radius: 50% 50% 18px 18px; filter: saturate(.76) brightness(.78) contrast(1.1); }
.variant--archive .variant__image--secondary { border-color: var(--paper); border-radius: 50%; }
.variant--archive .variant__art::after { content: "✦"; position: absolute; z-index: 3; left: 48%; top: 45%; display: grid; width: 84px; height: 84px; place-items: center; border: 1px solid rgba(186, 145, 75, .68); border-radius: 50%; color: var(--accent); background: rgba(10, 16, 24, .35); font-size: 1.8rem; }

/* 03 Atlas */
.variant--atlas { --paper: #10182b; --lab-ink: #e9edf4; --muted: #9aa8c2; --accent: #9a83f0; }
.variant--atlas .variant__copy h2 { font-family: Georgia, serif; font-weight: 400; }
.variant--atlas .variant__art { border-radius: 28px; background: radial-gradient(circle at 45% 45%, rgba(154, 131, 240, .23) 0 2px, transparent 3px), repeating-radial-gradient(circle at 45% 45%, transparent 0 42px, rgba(154, 131, 240, .11) 43px 44px); }
.variant--atlas .variant__image--main { inset: 6% 3% 7% 8%; border-radius: 50% 38% 42% 60%; filter: saturate(.78) brightness(.72); }
.variant--atlas .variant__image--secondary { width: 28%; height: 27%; border-color: #10182b; border-radius: 50%; }
.variant--atlas .variant__art-label { color: #cfc1ff; background: rgba(17, 22, 44, .7); }

/* 04 Grimoire */
.variant--grimoire { --paper: #e9dfcf; --accent: #7351ac; --muted: #766c60; background: repeating-linear-gradient(0deg, rgba(100, 79, 49, .03) 0 1px, transparent 1px 5px), var(--paper); }
.variant--grimoire .variant__copy h2 { font-family: Georgia, serif; font-weight: 400; }
.variant--grimoire .variant__art { min-height: 540px; }
.variant--grimoire .variant__image--main { inset: 4% 6% 5% 1%; border: 11px solid #f7efe1; border-radius: 2px; transform: rotate(-2deg); box-shadow: 9px 12px 0 rgba(76, 53, 36, .12); }
.variant--grimoire .variant__image--secondary { right: 0; bottom: 1%; border-width: 9px; border-radius: 2px; transform: rotate(4deg); }
.variant--grimoire .variant__art-label { border-radius: 2px; color: #43372d; background: #d7b36b; }

/* 05 Console */
.variant--console { --paper: #11141b; --lab-ink: #ebeadf; --muted: #90969f; --accent: #72e2a0; }
.variant--console .variant__topline, .variant--console .variant__header { border-color: rgba(235, 234, 223, .15); }
.variant--console .variant__copy h2 { font-family: var(--font-mono, monospace); font-size: clamp(2.8rem, 5vw, 5.4rem); letter-spacing: -.08em; }
.variant--console .variant__actions a:first-child { border-radius: 4px; color: #11141b; background: var(--accent); box-shadow: none; font-family: var(--font-mono, monospace); }
.variant--console .variant__actions a:last-child, .variant--console .variant__ip { font-family: var(--font-mono, monospace); }
.variant--console .variant__image--main { border: 1px solid rgba(114, 226, 160, .55); border-radius: 3px; filter: saturate(.7) brightness(.63) contrast(1.2); }
.variant--console .variant__image--secondary { border-color: #11141b; border-radius: 3px; }
.variant--console .variant__art::before { content: "MYSTERRIA // FIELD FEED\A 01000110 01001001 01000101 01001100 01000100"; white-space: pre; position: absolute; z-index: 3; top: 24px; left: 24px; color: rgba(114, 226, 160, .72); font: 700 .58rem/1.8 var(--font-mono, monospace); }

/* 06 Arcade */
.variant--arcade { --paper: #fcf7ed; --accent: #7355ed; --muted: #726a60; }
.variant--arcade .variant__stage { grid-template-columns: minmax(300px, .76fr) minmax(500px, 1.4fr); }
.variant--arcade .variant__image--main { border-radius: 24px; clip-path: polygon(9% 0, 100% 0, 92% 100%, 0 100%); }
.variant--arcade .variant__image--secondary { border-color: #fcf7ed; border-radius: 18px; transform: rotate(-5deg); }
.variant--arcade .variant__scene-index { padding: 11px 14px; border-radius: 999px; color: #fff; background: #f27e62; }

/* 07 Botanical */
.variant--botanical { --paper: #f2eee3; --accent: #2e6448; --muted: #6d7569; }
.variant--botanical .variant__copy h2 { font-family: Georgia, serif; font-weight: 400; }
.variant--botanical .variant__stage { grid-template-columns: minmax(300px, .76fr) minmax(500px, 1.35fr); }
.variant--botanical .variant__image--main { border-radius: 44% 56% 10% 10% / 18% 18% 8% 8%; filter: saturate(.85) brightness(.95); }
.variant--botanical .variant__image--secondary { width: 25%; height: 31%; border-color: #f2eee3; border-radius: 50% 8% 50% 8%; transform: rotate(3deg); }

/* 08 Observatory */
.variant--observatory { --paper: #11182d; --lab-ink: #f0e8d6; --muted: #a9b4ca; --accent: #d4ab61; }
.variant--observatory .variant__topline, .variant--observatory .variant__header { border-color: rgba(240, 232, 214, .16); }
.variant--observatory .variant__copy h2 { font-family: Georgia, serif; font-weight: 400; }
.variant--observatory .variant__art { background: radial-gradient(circle, rgba(212, 171, 97, .52) 0 1px, transparent 2px) 0 0 / 72px 72px; }
.variant--observatory .variant__image--main { inset: 2% 4% 3% 9%; border-radius: 50%; filter: saturate(.72) brightness(.68); }
.variant--observatory .variant__image--secondary { border-color: #11182d; border-radius: 50%; }
.variant--observatory .variant__art-label { color: #f0d8a8; background: rgba(17, 24, 45, .76); }

/* 09 Poster */
.variant--poster { --paper: #efe2c5; --accent: #422d91; --muted: #665a50; }
.variant--poster .variant__copy h2 { font-size: clamp(3.3rem, 7vw, 7rem); color: #422d91; text-transform: uppercase; }
.variant--poster .variant__image--main { border-radius: 0; filter: saturate(1.18) contrast(1.08) sepia(.08); }
.variant--poster .variant__image--secondary { border-color: #efe2c5; border-radius: 0; transform: rotate(5deg); }
.variant--poster .variant__art-label { border-radius: 2px; color: #efe2c5; background: #9a3e3f; }

/* 10 Modernist */
.variant--modernist { --paper: #f6f5f1; --accent: #7355ed; --muted: #6b6a67; }
.variant--modernist .variant__topline, .variant--modernist .variant__follow-through { border-color: #bbb9b4; }
.variant--modernist .variant__copy h2 { font-size: clamp(3rem, 5.7vw, 6.2rem); letter-spacing: -.075em; }
.variant--modernist .variant__actions a:first-child { border-radius: 6px; box-shadow: none; }
.variant--modernist .variant__image--main { border-radius: 0; filter: grayscale(1) contrast(1.18); }
.variant--modernist .variant__image--secondary { border-color: #f6f5f1; border-radius: 0; filter: grayscale(1); }
.variant--modernist .variant__scene-index { top: 50%; right: 12px; writing-mode: vertical-rl; color: var(--accent); }

@media (max-width: 1100px) {
  .lab-index { display: none; }
  .variant__stage { grid-template-columns: minmax(260px, .72fr) minmax(380px, 1.2fr); gap: 3vw; }
  .variant__copy h2 { font-size: clamp(2.9rem, 6.5vw, 5.5rem); }
}

@media (max-width: 760px) {
  .lab-header { align-items: flex-start; flex-wrap: wrap; gap: 8px 14px; padding: 12px 16px; }
  .lab-header p { order: 3; width: 100%; }
  .lab-header__exit { margin-left: auto; }
  .variant { min-height: 820px; padding: 16px 16px 0; }
  .variant__topline { font-size: .5rem; }
  .variant__topline span:last-child { max-width: 45%; text-align: right; }
  .variant__header { grid-template-columns: 1fr auto; min-height: 56px; }
  .variant__header nav { display: none; }
  .variant__utilities { gap: 7px; font-size: .5rem; }
  .variant__utilities .variant__status { display: none; }
  .variant__stage, .variant--editorial .variant__stage, .variant--arcade .variant__stage, .variant--botanical .variant__stage { display: flex; min-height: 680px; flex-direction: column; align-items: stretch; gap: 22px; padding-top: 42px; }
  .variant__copy { max-width: none; }
  .variant__copy h2 { max-width: 95%; font-size: clamp(3rem, 14vw, 5rem); }
  .variant__copy p { max-width: 500px; font-size: .9rem; }
  .variant__art { min-height: 310px; flex: 1; }
  .variant__image--secondary { width: 34%; height: 36%; }
  .variant__follow-through { min-height: 96px; grid-template-columns: 35px minmax(0, 1fr) 20px; gap: 10px; }
  .variant__follow-through p { font-size: .72rem; }
}

@media (prefers-reduced-motion: reduce) {
  .variant__image, .lab-index a { transition: none; }
}
</style>
