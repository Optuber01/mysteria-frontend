<template>
  <section class="what-is" aria-labelledby="what-is-title">
    <div class="what-is__inner">
      <div class="what-is__intro">
        <p class="what-is__eyebrow">WHAT IS MYSTERRIA?</p>
        <h2 id="what-is-title">A Minecraft MMORPG built around the Pathways of Lord of the Mysteries.</h2>
        <p>
          Mysterria turns advancement into a journey: discover formulas, brew potions, digest their power,
          complete rituals, and climb the Sequences while exploring a persistent multiplayer world.
        </p>
      </div>

      <div class="what-is__grid" aria-label="Core Mysterria pillars">
        <article>
          <span>01</span>
          <h3>Choose a Pathway</h3>
          <p>Your Pathway defines your abilities, progression, strengths, and the risks you take as you advance.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Advance through Sequences</h3>
          <p>Power is earned through potions, digestion and rituals rather than a conventional level grind.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Live in the world</h3>
          <p>Explore, fight, trade, discover secrets and make choices that matter in a persistent MMORPG world.</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.what-is {
  position: relative;
  padding: clamp(78px, 10vw, 144px) var(--home-content-gutter, clamp(20px, 4vw, 56px));
  color: var(--ink);
  background: color-mix(in srgb, var(--journey-mid) 94%, var(--surface, #fff) 6%);
  border-top: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
}

.what-is__inner {
  width: min(100%, var(--home-content-max, 1480px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: clamp(46px, 7vw, 104px);
  align-items: start;
}

.what-is__intro { max-width: 650px; }
.what-is__eyebrow {
  margin: 0 0 18px;
  color: color-mix(in srgb, var(--ink) 58%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .15em;
}
.what-is h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 4.8vw, 5.25rem);
  line-height: .95;
  letter-spacing: -.025em;
  font-weight: 700;
  text-wrap: balance;
}
.what-is__intro > p:last-child {
  max-width: 590px;
  margin: 26px 0 0;
  color: color-mix(in srgb, var(--ink) 72%, transparent);
  font-size: clamp(1rem, 1.25vw, 1.16rem);
  line-height: 1.72;
}

.what-is__grid {
  display: grid;
  gap: 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.what-is article {
  display: grid;
  grid-template-columns: 56px minmax(0, .75fr) minmax(220px, 1.25fr);
  gap: 22px;
  align-items: start;
  padding: 26px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.what-is article span {
  padding-top: 3px;
  color: color-mix(in srgb, var(--ink) 42%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .67rem;
  font-weight: 750;
}
.what-is article h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1;
}
.what-is article p {
  margin: 0;
  color: color-mix(in srgb, var(--ink) 68%, transparent);
  font-size: .94rem;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .what-is__inner { grid-template-columns: 1fr; gap: 48px; }
  .what-is__intro { max-width: 760px; }
}

@media (max-width: 620px) {
  .what-is { padding-top: 64px; padding-bottom: 64px; }
  .what-is article { grid-template-columns: 38px 1fr; gap: 10px 14px; }
  .what-is article p { grid-column: 2; }
}
</style>
