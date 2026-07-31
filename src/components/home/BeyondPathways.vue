<template>
  <section id="world" class="beyond" aria-labelledby="beyond-title">
    <header class="beyond-header">
      <p class="home-eyebrow">Beyond the Pathways</p>
      <h2 id="beyond-title">The world has its own reasons to explore.</h2>
      <p>
        Mysterria extends progression with original places, encounters and
        player-built systems. Select a marker to move across the world.
      </p>
    </header>

    <div class="world-window">
      <div
        class="world-panorama"
        :style="{ '--world-position': String(activeIndex / (features.length - 1)) }"
        aria-hidden="true"
      >
        <img
          class="world-back"
          src="@/assets/images/optimized/Server.webp"
          alt=""
          width="1920"
          height="1080"
          loading="lazy"
        >
        <img
          class="world-front"
          src="@/assets/images/optimized/banner.webp"
          alt=""
          width="1920"
          height="1080"
          loading="lazy"
        >
        <svg viewBox="0 0 1600 700">
          <path d="M60 494C260 395 353 514 535 395s333-79 460-176 335-38 518-151" />
          <path d="M58 510C278 411 361 536 547 411s335-78 465-174 330-31 512-143" />
        </svg>
      </div>

      <div class="world-markers" aria-label="Original world systems">
        <button
          v-for="(feature, index) in features"
          :key="feature.title"
          type="button"
          :class="{ active: index === activeIndex }"
          :style="{ left: `${feature.x}%`, top: `${feature.y}%` }"
          :aria-label="feature.title"
          :aria-pressed="index === activeIndex"
          @click="activeIndex = index"
        >
          <i>{{ index + 1 }}</i>
          <span>{{ feature.short }}</span>
        </button>
      </div>

      <div class="world-coordinate">
        <span>WORLD LAYER</span>
        <b>0{{ activeIndex + 1 }} — 0{{ features.length }}</b>
      </div>

      <Transition name="marker-copy" mode="out-in">
        <article :key="activeFeature.title" class="world-copy">
          <span>{{ activeFeature.kicker }}</span>
          <h3>{{ activeFeature.title }}</h3>
          <p>{{ activeFeature.copy }}</p>
          <small>Showcase details and verified in-game media are pending.</small>
        </article>
      </Transition>
    </div>

    <div class="world-mobile-nav" aria-label="World scene controls">
      <button type="button" aria-label="Previous world feature" @click="previous">←</button>
      <div>
        <span>{{ String(activeIndex + 1).padStart(2, '0') }} / 06</span>
        <strong>{{ activeFeature.title }}</strong>
      </div>
      <button type="button" aria-label="Next world feature" @click="next">→</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const features = [
  { title: 'Custom dungeons', short: 'Dungeons', kicker: 'Original encounters', copy: 'Explore original dungeon content built around Mysterria progression.', x: 10, y: 61 },
  { title: 'Original creatures', short: 'Creatures', kicker: 'New encounters', copy: 'Meet creatures created for Mysterria rather than a standard survival mob list.', x: 27, y: 42 },
  { title: 'Unique locations', short: 'Locations', kicker: 'Places with a purpose', copy: 'Travel to locations designed to support discovery and progression.', x: 45, y: 58 },
  { title: 'World events', short: 'Events', kicker: 'Shared moments', copy: 'Join world events that bring players into the same evolving activity.', x: 61, y: 31 },
  { title: 'Player economy', short: 'Economy', kicker: 'Player exchange', copy: 'Use a player economy connected to the server world and its progression.', x: 77, y: 52 },
  { title: 'Housing and towns', short: 'Towns', kicker: 'Build a place', copy: 'Create homes and towns that give players a lasting place in Mysterria.', x: 91, y: 25 },
];

const activeIndex = ref(0);
const activeFeature = computed(() => features[activeIndex.value]);

function previous() {
  activeIndex.value = (activeIndex.value - 1 + features.length) % features.length;
}

function next() {
  activeIndex.value = (activeIndex.value + 1) % features.length;
}
</script>

<style scoped>
.beyond {
  padding: clamp(90px, 13vw, 180px) 0;
  overflow: clip;
  color: #102924;
  background: #f5f0e6;
}

.beyond-header {
  width: min(1380px, calc(100% - 40px));
  display: grid;
  grid-template-columns: 1.3fr .7fr;
  align-items: end;
  gap: 60px;
  margin: 0 auto clamp(50px, 8vw, 100px);
}

.home-eyebrow {
  grid-column: 1 / -1;
  margin: 0 0 -42px;
  color: #8b632c;
  font: 600 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.beyond-header h2 {
  margin: 0;
  font: 650 clamp(3.4rem, 7vw, 7rem)/.86 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.055em;
}

.beyond-header > p:last-child {
  margin: 0 0 8px;
  color: #5e706b;
  line-height: 1.7;
}

.world-window {
  position: relative;
  width: min(1600px, calc(100% - 40px));
  height: min(70vw, 790px);
  min-height: 610px;
  margin: auto;
  overflow: hidden;
  border-radius: 34px;
  color: #fcf9f2;
  background: #0e2224;
  box-shadow: 0 35px 90px rgba(13, 40, 36, .18);
}

.world-panorama {
  position: absolute;
  inset: 0;
  width: 132%;
  transform: translateX(calc(var(--world-position) * -24%));
  transition: transform 1.1s cubic-bezier(.22, 1, .36, 1);
}

.world-panorama::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8, 21, 26, .74), transparent 45%, rgba(8, 21, 26, .38)),
    linear-gradient(0deg, rgba(8, 21, 26, .9), transparent 60%);
}

.world-panorama img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(.68) contrast(1.08);
}
.world-front { opacity: .2; mix-blend-mode: screen; }
.world-panorama svg { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; }
.world-panorama path {
  fill: none;
  stroke: rgba(215, 185, 120, .6);
  stroke-width: 2;
  stroke-dasharray: 5 12;
  vector-effect: non-scaling-stroke;
}
.world-panorama path + path { stroke: rgba(245, 240, 230, .17); stroke-dasharray: 1 9; }

.world-markers { position: absolute; inset: 0; z-index: 2; }
.world-markers button {
  position: absolute;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border: 0;
  color: #fcf9f2;
  background: transparent;
  cursor: pointer;
  transform: translate(-50%, -50%);
}
.world-markers i {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: none;
  border: 1px solid rgba(252, 249, 242, .48);
  border-radius: 50%;
  background: rgba(8, 21, 26, .62);
  font: 700 9px/1 "IBM Plex Mono", monospace;
  font-style: normal;
  backdrop-filter: blur(8px);
  transition: transform .35s, background .35s, color .35s;
}
.world-markers span {
  padding: 7px 9px;
  border-radius: 7px;
  background: rgba(8, 21, 26, .65);
  font: 600 9px/1 "IBM Plex Mono", monospace;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity .25s, transform .25s;
}
.world-markers button:hover span,
.world-markers button:focus-visible span,
.world-markers button.active span { opacity: 1; transform: none; }
.world-markers button.active i { color: #102924; background: #d7b978; transform: scale(1.22); }

.world-coordinate {
  position: absolute;
  z-index: 3;
  top: 28px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(252, 249, 242, .4);
  font: 500 8px/1 "IBM Plex Mono", monospace;
  letter-spacing: .14em;
}
.world-coordinate b { color: #d7b978; font-size: 10px; }

.world-copy {
  position: absolute;
  z-index: 3;
  left: clamp(24px, 5vw, 72px);
  bottom: clamp(24px, 5vw, 64px);
  max-width: 470px;
  padding: 26px;
  border: 1px solid rgba(252, 249, 242, .14);
  border-radius: 20px;
  background: rgba(8, 21, 26, .78);
  backdrop-filter: blur(16px);
}
.world-copy > span { color: #d7b978; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.world-copy h3 { margin: 12px 0; font: 650 clamp(2.2rem, 4vw, 4rem)/.9 "IBM Plex Sans Condensed", sans-serif; }
.world-copy p { margin: 0; color: rgba(252, 249, 242, .7); line-height: 1.6; }
.world-copy small { display: block; margin-top: 18px; color: rgba(252, 249, 242, .4); font: 500 9px/1.5 "IBM Plex Mono", monospace; }

.marker-copy-enter-active,
.marker-copy-leave-active { transition: opacity .25s, transform .45s cubic-bezier(.22, 1, .36, 1); }
.marker-copy-enter-from { opacity: 0; transform: translateY(16px); }
.marker-copy-leave-to { opacity: 0; transform: translateY(-10px); }

.world-mobile-nav { display: none; }

@media (max-width: 760px) {
  .beyond-header { grid-template-columns: 1fr; gap: 22px; }
  .home-eyebrow { margin: 0 0 0; }
  .world-window { width: calc(100% - 24px); min-height: 640px; border-radius: 24px; }
  .world-panorama { width: 220%; transform: translateX(calc(var(--world-position) * -54%)); }
  .world-markers span { display: none; }
  .world-copy { right: 18px; left: 18px; bottom: 18px; }
  .world-mobile-nav {
    width: calc(100% - 32px);
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    gap: 14px;
    margin: 20px auto 0;
  }
  .world-mobile-nav button {
    width: 48px;
    height: 48px;
    border: 1px solid rgba(16, 41, 36, .24);
    border-radius: 50%;
    color: #102924;
    background: transparent;
  }
  .world-mobile-nav div { display: grid; gap: 4px; text-align: center; }
  .world-mobile-nav span { color: #8b632c; font: 600 9px/1 "IBM Plex Mono", monospace; }
  .world-mobile-nav strong { font-size: .82rem; }
}

@media (prefers-reduced-motion: reduce) {
  .world-panorama,
  .world-markers i,
  .world-markers span { transition: none; }
}
</style>
