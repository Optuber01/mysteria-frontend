<template>
  <section ref="sectionRef" class="bc-world" aria-labelledby="bc-world-title">
    <div class="bc-shell">
      <header class="world-head">
        <div v-reveal>
          <p class="bc-label">{{ t('home.broadcast.world.label') }}</p>
          <h2 id="bc-world-title" class="bc-h2">{{ t('home.broadcast.world.title') }}</h2>
        </div>
        <p v-reveal="120" class="bc-lede">{{ t('home.broadcast.world.lede') }}</p>
      </header>

      <div class="panels">
        <figure
            v-for="(panel, index) in panels"
            :key="panel.id"
            v-reveal="(index % 3) * 100"
            :class="['panel', `panel-${panel.id}`]"
        >
          <div class="panel-media">
            <img :src="panel.image" :alt="t(`home.broadcast.world.panels.${panel.id}.alt`)" loading="lazy" decoding="async" :width="panel.w" :height="panel.h">
          </div>
          <figcaption class="panel-copy">
            <span class="panel-tag">{{ t(`home.broadcast.world.panels.${panel.id}.tag`) }}</span>
            <span class="panel-title">{{ t(`home.broadcast.world.panels.${panel.id}.title`) }}</span>
            <span class="panel-body">{{ t(`home.broadcast.world.panels.${panel.id}.body`) }}</span>
          </figcaption>
        </figure>
      </div>

      <ul class="facts">
        <li v-for="(fact, index) in facts" :key="fact" v-reveal="index * 70" class="fact">
          <span class="fact-value">{{ t(`home.broadcast.world.facts.${fact}.value`) }}</span>
          <span class="fact-label">{{ t(`home.broadcast.world.facts.${fact}.label`) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {prefersReducedMotion, useScrollProgress, vReveal} from './broadcast';
import rift from '@/assets/images/home-library/community-archive/dungeons/snow-ring-rift/snow-ring-rift-clear-front.webp';
import cathedral from '@/assets/images/home-library/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import moon from '@/assets/images/home-library/crimson-moon.webp';
import guardian from '@/assets/images/home-library/community-archive/events/guardians/guardian-radiant-encounter-close.webp';
import castle from '@/assets/images/optimized/Server.webp';

const {t} = useI18n();

const panels = [
  {id: 'rifts', image: rift, w: 960, h: 521},
  {id: 'churches', image: cathedral, w: 1600, h: 841},
  {id: 'moon', image: moon, w: 640, h: 640},
  {id: 'guardians', image: guardian, w: 960, h: 521},
  {id: 'nations', image: castle, w: 1920, h: 1080},
];

const facts = ['size', 'travel', 'safety', 'loot', 'season'];

const sectionRef = ref<HTMLElement | null>(null);
const {start} = useScrollProgress(() => sectionRef.value, '--wp');
onMounted(() => {
  if (!prefersReducedMotion()) start();
});
</script>

<style scoped>
.bc-world {
  --wp: 0.5;
  padding: clamp(60px, 6.5vw, 96px) 0;
  background: var(--bc-night);
}

.world-head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 24px 72px;
  align-items: end;
  margin-bottom: clamp(32px, 4vw, 52px);
}

.world-head .bc-h2 {
  margin-top: 18px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(12px, 1.4vw, 20px);
}

.panel {
  position: relative;
  margin: 0;
  border-radius: 18px;
  overflow: hidden;
  background: var(--bc-night-2);
  isolation: isolate;
  min-height: 350px;
}

.panel-rifts { grid-column: span 7; min-height: 480px; }
.panel-churches { grid-column: span 5; min-height: 480px; }
.panel-moon,
.panel-guardians,
.panel-nations { grid-column: span 4; }

.panel-media {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.panel-media img {
  position: absolute;
  inset: -6% 0;
  width: 100%;
  height: 112%;
  object-fit: cover;
  transform: translate3d(0, calc((var(--wp) - 0.5) * -60px), 0) scale(1.02);
  transition: scale 1.2s var(--bc-ease);
}

.panel:hover .panel-media img {
  scale: 1.05;
}

.panel-rifts img { object-position: 50% 40%; }
.panel-churches img { object-position: 52% 30%; }
.panel-guardians img { object-position: 50% 40%; }
.panel-nations img { object-position: 30% 50%; filter: brightness(1.3) saturate(1.1); }

/* The moon is a pixel sprite, not a capture: frame it as a night sky. */
.panel-moon {
  background: radial-gradient(ellipse 80% 70% at 50% 35%, #3a0a12, #12040a 70%);
}

.panel-moon .panel-media img {
  inset: 8% auto auto 50%;
  width: 62%;
  height: auto;
  aspect-ratio: 1;
  margin-left: -31%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 60px rgba(255, 60, 70, 0.45));
}

.panel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, transparent 35%, rgba(7, 8, 12, 0.55) 62%, rgba(7, 8, 12, 0.94) 100%);
}

.panel-copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: clamp(20px, 2.2vw, 32px);
}

.panel-tag {
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-blue-hi);
}

.panel-title {
  font-family: var(--bc-font-display);
  font-size: clamp(20px, 1.9vw, 30px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.panel-rifts .panel-title,
.panel-churches .panel-title {
  font-size: clamp(24px, 2.4vw, 38px);
}

.panel-body {
  max-width: 52ch;
  font-size: 15px;
  line-height: 1.55;
  color: #d0d3de;
}

.facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin: clamp(32px, 4vw, 52px) 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--bc-line);
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px 20px 0 0;
}

.fact + .fact {
  padding-left: 20px;
  border-left: 1px solid var(--bc-line);
}

.fact-value {
  font-family: var(--bc-font-display);
  font-size: clamp(17px, 1.4vw, 21px);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.fact-label {
  font-size: 14px;
  line-height: 1.5;
  color: var(--bc-mute);
}

@media (max-width: 1100px) {
  .panel-rifts,
  .panel-churches {
    grid-column: span 6;
    min-height: 480px;
  }

  .panel-moon,
  .panel-guardians {
    grid-column: span 6;
  }

  .panel-nations {
    grid-column: 1 / -1;
  }

  .facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 24px;
  }

  .fact:nth-child(4) {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 760px) {
  .world-head {
    grid-template-columns: 1fr;
  }

  .panel,
  .panel-rifts,
  .panel-churches,
  .panel-moon,
  .panel-guardians,
  .panel-nations {
    grid-column: 1 / -1;
    min-height: 400px;
  }

  .facts {
    grid-template-columns: 1fr 1fr;
  }

  .fact,
  .fact + .fact {
    padding-left: 0;
    border-left: 0;
  }

  .fact:nth-child(even) {
    padding-left: 16px;
    border-left: 1px solid var(--bc-line);
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-media img {
    transform: none;
  }
}
</style>
