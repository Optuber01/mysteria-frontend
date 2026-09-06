<template>
  <section class="getting-started" aria-labelledby="getting-started-title">
    <div class="getting-started__inner">
      <div class="getting-started__heading">
        <p>START YOUR JOURNEY</p>
        <h2 id="getting-started-title">From first login to your first Sequence.</h2>
      </div>

      <ol class="getting-started__steps">
        <li>
          <span>01</span>
          <div>
            <h3>Join the server</h3>
            <p>Connect to Mysterria and enter the persistent world.</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <h3>Find your direction</h3>
            <p>Explore, learn the systems and decide which Pathway you want to pursue.</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <h3>Begin advancing</h3>
            <p>Work toward formulas, ingredients, potions and the rituals required to move through the Sequences.</p>
          </div>
        </li>
      </ol>

      <div class="getting-started__actions">
        <RouterLink to="/guide">Read the guide <span aria-hidden="true">→</span></RouterLink>
        <RouterLink to="/pathways">Browse Pathways <span aria-hidden="true">→</span></RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.getting-started {
  padding: clamp(76px, 9vw, 126px) var(--home-content-gutter, clamp(20px, 4vw, 56px));
  color: var(--ink);
  background: color-mix(in srgb, var(--journey-end) 90%, var(--surface, #fff) 10%);
  border-top: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.getting-started__inner {
  width: min(100%, var(--home-content-max, 1480px));
  margin: 0 auto;
}
.getting-started__heading {
  display: grid;
  grid-template-columns: minmax(180px, .36fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
  margin-bottom: clamp(42px, 6vw, 74px);
}
.getting-started__heading p {
  margin: 7px 0 0;
  color: color-mix(in srgb, var(--ink) 52%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .67rem;
  font-weight: 800;
  letter-spacing: .15em;
}
.getting-started h2 {
  max-width: 900px;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 5vw, 5.5rem);
  line-height: .92;
  letter-spacing: -.025em;
}
.getting-started__steps {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.getting-started__steps li {
  min-height: 190px;
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 18px;
  padding: 30px clamp(18px, 2.5vw, 34px) 30px 0;
}
.getting-started__steps li + li {
  padding-left: clamp(18px, 2.5vw, 34px);
  border-left: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.getting-started__steps span {
  color: color-mix(in srgb, var(--ink) 42%, transparent);
  font-family: var(--font-mono, monospace);
  font-size: .66rem;
  font-weight: 750;
}
.getting-started__steps h3 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2vw, 2.15rem);
  line-height: 1;
}
.getting-started__steps p {
  max-width: 330px;
  margin: 0;
  color: color-mix(in srgb, var(--ink) 66%, transparent);
  font-size: .93rem;
  line-height: 1.65;
}
.getting-started__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  margin-top: 28px;
}
.getting-started__actions a {
  color: var(--ink);
  font-size: .78rem;
  font-weight: 800;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 36%, transparent);
  padding-bottom: 3px;
}
.getting-started__actions a:hover { border-color: var(--ink); }
.getting-started__actions a:focus-visible { outline: 3px solid var(--primary); outline-offset: 4px; }

@media (max-width: 800px) {
  .getting-started__heading { grid-template-columns: 1fr; gap: 14px; }
  .getting-started__steps { grid-template-columns: 1fr; }
  .getting-started__steps li { min-height: 0; padding: 24px 0; }
  .getting-started__steps li + li { padding-left: 0; border-left: 0; border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
}
</style>
