<template>
  <section id="sequence-6" ref="rootRef" class="rift" aria-labelledby="ascent-rift-title">
    <div ref="cinemaRef" class="rift__cinema">
      <img
          class="rift__img"
          :src="eyeRift"
          :alt="t('home.ascent.rift.imgEye')"
          width="1920"
          height="1042"
          loading="lazy"
          decoding="async"
      >
      <div class="rift__shade" aria-hidden="true"></div>
      <div class="a-shell rift__over">
        <p class="a-eyebrow" data-rv><span class="a-seq">6</span><span class="a-seq">5</span>{{ t('home.ascent.rift.eyebrow') }}</p>
        <h2 id="ascent-rift-title" class="a-h2 a-h2--xl rift__title" data-rv>
          <span>{{ t('home.ascent.rift.titleA') }}</span>
          <span class="rift__title-b">{{ t('home.ascent.rift.titleB') }}</span>
        </h2>
        <p class="a-lede rift__lede" data-rv>{{ t('home.ascent.rift.lede') }}</p>
        <ol class="rift__steps">
          <li v-for="(step, index) in steps" :key="step.cmd" class="rift__step" data-rv :style="{'--k': index}">
            <code class="rift__cmd">{{ step.cmd }}</code>
            <strong>{{ step.title }}</strong>
            <span>{{ step.body }}</span>
          </li>
        </ol>
      </div>
    </div>

    <div class="a-shell rift__body">
      <div class="rift__lower">
        <ul class="rift__facts">
          <li v-for="fact in facts" :key="fact.value" data-rv>
            <b>{{ fact.value }}</b>
            <span>{{ fact.label }}</span>
          </li>
        </ul>

        <div ref="galleryRef" class="rift__gallery">
          <figure class="rift__shot rift__shot--a">
            <img :src="snowRift" :alt="t('home.ascent.rift.imgSnow')" width="960" height="521" loading="lazy" decoding="async">
          </figure>
          <figure class="rift__shot rift__shot--b">
            <img :src="dungeon" :alt="t('home.ascent.rift.imgDungeon')" width="1075" height="503" loading="lazy" decoding="async">
          </figure>
        </div>
      </div>

      <RouterLink :to="$lp('/guide/activities')" class="a-link rift__link" data-rv>
        {{ t('home.ascent.rift.guide') }}
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReveals, useScrollProgress} from './useAscentScroll';
import eyeRift from '@/assets/images/home-library/captures/hero-eye-rift.webp';
import snowRift from '@/assets/images/home-library/community-archive/dungeons/snow-ring-rift/snow-ring-rift-clear-front.webp';
import dungeon from '@/assets/images/home-library/captures/wiki/dungeons.webp';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const cinemaRef = ref<HTMLElement | null>(null);
const galleryRef = ref<HTMLElement | null>(null);

useReveals(rootRef);
useScrollProgress(cinemaRef, 'through');
useScrollProgress(galleryRef, 'through');

const steps = computed(() => [1, 2, 3].map(n => ({
  cmd: t(`home.ascent.rift.s${n}Cmd`),
  title: t(`home.ascent.rift.s${n}Title`),
  body: t(`home.ascent.rift.s${n}Body`),
})));

const facts = computed(() => [1, 2, 3].map(n => ({
  value: t(`home.ascent.rift.f${n}Value`),
  label: t(`home.ascent.rift.f${n}Label`),
})));
</script>

<style scoped>
.rift {
  position: relative;
  background: linear-gradient(180deg, #15171b 0%, #0f1220 50%, #12141c 100%);
}

.rift__cinema {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: max(70vh, 560px);
  padding: 0 0 clamp(56px, 9vh, 110px);
  overflow: hidden;
}

.rift__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 40%;
  transform: scale(calc(1.22 - var(--p, 0) * 0.2)) translate3d(0, calc(var(--p, 0) * 4%), 0);
  transform-origin: 50% 40%;
  will-change: transform;
}

.rift__shade {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(180deg, #15171b 0%, rgba(21, 23, 27, 0.2) 22%, rgba(15, 18, 32, 0.1) 50%, rgba(15, 18, 32, 0.92) 86%, #0f1220 100%),
      linear-gradient(90deg, rgba(10, 12, 20, 0.75) 0%, rgba(10, 12, 20, 0) 60%);
}

.rift__over {
  position: relative;
}

.rift__title {
  margin-top: 16px;
}

.rift__title span {
  display: block;
}

.rift__title-b {
  color: transparent;
  background: linear-gradient(90deg, #fff 0%, var(--a-accent) 90%);
  -webkit-background-clip: text;
  background-clip: text;
}

.rift__body {
  position: relative;
  padding-bottom: clamp(64px, 9vh, 96px);
}

.rift__lede {
  max-width: 44em;
  margin: 24px 0 0;
  color: #d3d8df;
}

.rift__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin: clamp(28px, 4vh, 44px) 0 0;
  padding: 0;
  list-style: none;
}

.rift__step {
  position: relative;
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 22px 24px 24px;
  border-top: 2px solid var(--a-accent);
  background: rgba(10, 12, 22, 0.66);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transition-delay: calc(var(--k) * 90ms) !important;
}

.rift__cmd {
  justify-self: start;
  padding: 6px 10px;
  border: 1px solid rgba(73, 226, 255, 0.35);
  background: rgba(73, 226, 255, 0.08);
  font-family: var(--a-mono);
  font-size: 13px;
  color: var(--a-accent);
}

.rift__step strong {
  margin-top: 8px;
  font-family: var(--a-head);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.rift__step span {
  font-size: 15px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

.rift__lower {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
  margin-top: clamp(16px, 3vh, 36px);
}

.rift__facts {
  display: grid;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rift__facts li {
  display: grid;
  gap: 6px;
  padding-left: 20px;
  border-left: 1px solid var(--a-line-strong);
}

.rift__facts b {
  font-family: var(--a-display);
  font-size: clamp(46px, 5vw, 76px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.rift__facts span {
  font-size: 15px;
  color: var(--a-ink-2);
}

.rift__gallery {
  position: relative;
  height: clamp(240px, 22vw, 320px);
}

.rift__shot {
  position: absolute;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--a-line);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.rift__shot img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rift__shot--a {
  top: 0;
  left: 0;
  width: 70%;
  aspect-ratio: 960 / 521;
  transform: translate3d(0, calc((0.5 - var(--p, 0.5)) * 50px), 0);
}

.rift__shot--b {
  right: 0;
  bottom: 0;
  width: 62%;
  aspect-ratio: 1075 / 503;
  transform: translate3d(0, calc((0.5 - var(--p, 0.5)) * -70px), 0);
}

.rift__link {
  margin-top: clamp(28px, 4vh, 44px);
}

@media (max-width: 899px) {
  .rift__cinema {
    min-height: 64vh;
  }

  .rift__steps,
  .rift__lower {
    grid-template-columns: 1fr;
  }

  .rift__steps {
    gap: 12px;
  }

  .rift__step {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 6px 14px;
    padding: 18px;
  }

  .rift__cmd {
    grid-row: span 2;
  }

  .rift__step strong {
    margin-top: 0;
    font-size: 17px;
  }

  .rift__step span {
    font-size: 14px;
  }

  .rift__facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .rift__facts b {
    font-size: 24px;
  }

  .rift__shot--b {
    display: none;
  }

  .rift__shot--a {
    position: relative;
    width: 100%;
    transform: none;
  }

  .rift__facts li {
    padding-left: 12px;
  }

  .rift__facts span {
    font-size: 13px;
  }

  .rift__gallery {
    height: auto;
  }
}

@media (max-width: 480px) {
  .rift__step {
    grid-template-columns: 1fr;
  }

  .rift__cmd {
    grid-row: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rift__img,
  .rift__shot--a,
  .rift__shot--b {
    transform: none;
  }
}
</style>
