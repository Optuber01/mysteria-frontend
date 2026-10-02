<template>
  <section class="bc-features bc-light" aria-labelledby="bc-features-title">
    <div class="bc-shell">
      <header class="features-head">
        <div v-reveal>
          <p class="bc-label">{{ t('home.broadcast.features.label') }}</p>
          <h2 id="bc-features-title" class="bc-h2">{{ t('home.broadcast.features.title') }}</h2>
        </div>
        <p v-reveal="120" class="bc-lede">{{ t('home.broadcast.features.lede') }}</p>
      </header>

      <ul class="tiles">
        <li
            v-for="(tile, index) in tiles"
            :key="tile.id"
            v-reveal="(index % 3) * 90"
            :class="['tile', `tile-${tile.id}`]"
        >
          <RouterLink :to="$lp(tile.to)" class="tile-link" @pointermove="onTilePointer">
            <span class="tile-media">
              <template v-if="tile.id === 'pathway'">
                <span class="sigil-stack" aria-hidden="true">
                  <img v-for="id in stackIds" :key="id" :class="['stack-sigil', `stack-${id}`]" :src="sigilLarge(id)" alt="" width="512" height="512" loading="lazy" decoding="async">
                </span>
              </template>
              <img v-else :src="tile.image" :alt="t(`home.broadcast.features.tiles.${tile.id}.alt`)" loading="lazy" decoding="async" width="960" height="540">
              <img v-if="tile.id === 'act'" :src="magicCircle" class="tile-circle" alt="" aria-hidden="true" width="256" height="256" loading="lazy">
              <span class="tile-glare" aria-hidden="true"></span>
              <span class="tile-num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            </span>
            <span class="tile-copy">
              <span class="tile-title">{{ t(`home.broadcast.features.tiles.${tile.id}.title`) }}</span>
              <span class="tile-body">{{ t(`home.broadcast.features.tiles.${tile.id}.body`) }}</span>
              <span class="tile-more">{{ t(`home.broadcast.features.tiles.${tile.id}.more`) }} <span aria-hidden="true">→</span></span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';
import {sigilLarge, vReveal} from './broadcast';
import brewery from '@/assets/images/home-library/captures/brewery-scene.webp';
import nave from '@/assets/images/home-library/community-archive/churches/fog-cathedral/cathedral-nave.webp';
import guardian from '@/assets/images/home-library/community-archive/events/guardians/guardian-dragon-encounter.webp';
import agora from '@/assets/images/home-library/captures/wiki/agora-plots.webp';
import emporium from '@/assets/images/home-library/captures/wiki/emporium.webp';
import magicCircle from '@/assets/images/home-library/items/magic-circle.png';

const {t} = useI18n();

const stackIds = ['door', 'fool', 'sun'];

const tiles = [
  {id: 'pathway', to: '/pathways', image: ''},
  {id: 'brew', to: '/guide/first-potion', image: brewery},
  {id: 'act', to: '/guide/progression', image: nave},
  {id: 'fight', to: '/guide/activities', image: guardian},
  {id: 'build', to: '/guide/towns', image: agora},
  {id: 'trade', to: '/guide/economy', image: emporium},
];

/* Cursor-following glare, written straight to the hovered tile. */
const onTilePointer = (event: PointerEvent) => {
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--gx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--gy', `${event.clientY - rect.top}px`);
};
</script>

<style scoped>
.bc-features {
  padding: clamp(68px, 7.5vw, 110px) 0 clamp(60px, 6.5vw, 96px);
}

.features-head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 24px 72px;
  align-items: end;
  margin-bottom: clamp(32px, 4vw, 56px);
}

.features-head .bc-h2 {
  margin-top: 18px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(28px, 3vw, 44px) clamp(16px, 1.8vw, 28px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  grid-column: span 4;
}

.tile-fight {
  grid-column: span 6;
}

.tile-build,
.tile-trade {
  grid-column: span 3;
}

.tile-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.tile-media {
  position: relative;
  display: block;
  aspect-ratio: 16 / 11;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bc-night-2);
  isolation: isolate;
}

.tile-fight .tile-media {
  aspect-ratio: auto;
  height: 100%;
  min-height: 280px;
}

.tile-build .tile-media,
.tile-trade .tile-media {
  aspect-ratio: 16 / 13;
}

.tile-fight .tile-link {
  display: grid;
  grid-template-rows: 1fr auto;
}

.tile-media > img:not(.tile-circle) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.1s var(--bc-ease);
}

.tile-link:hover .tile-media > img:not(.tile-circle),
.tile-link:focus-visible .tile-media > img:not(.tile-circle) {
  transform: scale(1.06);
}

.tile-brew .tile-media > img { object-position: 50% 70%; }
.tile-act .tile-media > img { object-position: 50% 60%; filter: brightness(1.25) contrast(1.05); }
.tile-fight .tile-media > img { object-position: 40% 50%; }
.tile-build .tile-media > img { object-position: 50% 50%; }
.tile-trade .tile-media > img { object-position: 45% 50%; }

/* The pathway tile is a composed sigil cluster rather than a capture. */
.tile-pathway .tile-media {
  background:
    radial-gradient(ellipse 60% 60% at 50% 55%, rgba(49, 80, 245, 0.35), transparent 70%),
    radial-gradient(ellipse 90% 80% at 50% 120%, rgba(180, 175, 216, 0.25), transparent 60%),
    var(--bc-night);
}

.sigil-stack {
  position: absolute;
  inset: 0;
  transition: transform 1.1s var(--bc-ease);
}

.tile-link:hover .sigil-stack {
  transform: scale(1.05);
}

.stack-sigil {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 46%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
  transition: transform 1.1s var(--bc-ease);
}

.stack-door {
  width: 34%;
  transform: translate(-128%, -42%) rotate(-8deg);
  opacity: 0.8;
}

.stack-sun {
  width: 34%;
  transform: translate(28%, -58%) rotate(8deg);
  opacity: 0.8;
}

.tile-link:hover .stack-door { transform: translate(-138%, -44%) rotate(-12deg); }
.tile-link:hover .stack-sun { transform: translate(38%, -60%) rotate(12deg); }

.tile-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 46%;
  margin: -23% 0 0 -23%;
  aspect-ratio: 1;
  image-rendering: pixelated;
  opacity: 0.85;
  filter: hue-rotate(180deg) saturate(1.6) brightness(1.2) drop-shadow(0 0 18px rgba(120, 150, 255, 0.7));
  animation: circle-spin 40s linear infinite;
}

@keyframes circle-spin {
  to { transform: rotate(360deg); }
}

.tile-glare {
  position: absolute;
  inset: 0;
  background: radial-gradient(360px circle at var(--gx, 50%) var(--gy, 50%), rgba(255, 255, 255, 0.18), transparent 60%);
  opacity: 0;
  transition: opacity .4s ease;
  pointer-events: none;
}

.tile-link:hover .tile-glare {
  opacity: 1;
}

.tile-num {
  position: absolute;
  top: 14px;
  left: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(7, 8, 12, 0.6);
  backdrop-filter: blur(6px);
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: #fff;
}

.tile-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 4px 0;
}

.tile-title {
  font-family: var(--bc-font-display);
  font-size: clamp(19px, 1.55vw, 24px);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  background: linear-gradient(var(--bc-blue-ink), var(--bc-blue-ink)) 0 100% / 0 2px no-repeat;
  transition: background-size .45s var(--bc-ease);
  width: fit-content;
  padding-bottom: 2px;
}

.tile-link:hover .tile-title,
.tile-link:focus-visible .tile-title {
  background-size: 100% 2px;
}

.tile-body {
  font-size: 16px;
  line-height: 1.55;
  color: var(--bc-ink-2);
}

.tile-more {
  margin-top: 4px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bc-blue-ink);
}

@media (max-width: 1100px) {
  .tile,
  .tile-fight {
    grid-column: span 6;
  }

  .tile-build,
  .tile-trade {
    grid-column: span 6;
  }

  .tile-build .tile-media,
  .tile-trade .tile-media,
  .tile-fight .tile-media {
    aspect-ratio: 4 / 3;
    height: auto;
    min-height: 0;
  }

  .tile-fight .tile-link {
    display: flex;
  }
}

@media (max-width: 760px) {
  .features-head {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .tile,
  .tile-fight,
  .tile-build,
  .tile-trade {
    grid-column: 1 / -1;
  }

  .tile-media,
  .tile-build .tile-media,
  .tile-trade .tile-media,
  .tile-fight .tile-media {
    aspect-ratio: 16 / 10;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile-circle {
    animation: none;
  }
}
</style>
