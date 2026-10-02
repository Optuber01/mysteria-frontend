<template>
  <section id="sequence-4" ref="rootRef" class="crimson" aria-labelledby="ascent-crimson-title">
    <div class="crimson__stage">
      <div class="crimson__sky" aria-hidden="true">
        <div class="crimson__tint"></div>
        <div class="crimson__moon">
          <span class="crimson__moon-glow"></span>
          <img :src="moon" alt="" width="640" height="640" loading="lazy" decoding="async">
        </div>
        <div class="crimson__numeral">4</div>
      </div>

      <div class="a-shell crimson__grid">
        <div class="crimson__copy">
          <p class="a-eyebrow"><span class="a-seq a-seq--red">4</span>{{ t('home.ascent.crimson.eyebrow') }}</p>
          <h2 id="ascent-crimson-title" class="a-h2 crimson__title">{{ t('home.ascent.crimson.title') }}</h2>
          <p class="a-lede crimson__lede">{{ t('home.ascent.crimson.lede') }}</p>

          <ul class="crimson__list">
            <li v-for="(item, index) in list" :key="item.title" :style="{'--k': index}">
              <i :class="item.icon" aria-hidden="true"></i>
              <span>
                <strong>{{ item.title }}</strong>
                <span>{{ item.body }}</span>
              </span>
            </li>
          </ul>
        </div>

        <div class="crimson__shots">
          <figure class="crimson__shot crimson__shot--main">
            <img :src="dragon" :alt="t('home.ascent.crimson.imgDragon')" width="1400" height="760" loading="lazy" decoding="async">
            <figcaption>{{ t('home.ascent.crimson.capDragon') }}</figcaption>
          </figure>
          <figure class="crimson__shot crimson__shot--side">
            <img :src="radiant" :alt="t('home.ascent.crimson.imgRadiant')" width="960" height="521" loading="lazy" decoding="async">
            <figcaption>{{ t('home.ascent.crimson.capRadiant') }}</figcaption>
          </figure>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useScene} from './useAscentScroll';
import moon from '@/assets/images/home-library/crimson-moon.webp';
import dragon from './img/guardian-dragon.webp';
import radiant from './img/guardian-radiant.webp';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
useScene(rootRef, 2600);

const list = computed(() => [
  {icon: 'fa-solid fa-shield-halved', title: t('home.ascent.crimson.guardianTitle'), body: t('home.ascent.crimson.guardianBody')},
  {icon: 'fa-solid fa-eye', title: t('home.ascent.crimson.moonTitle'), body: t('home.ascent.crimson.moonBody')},
  {icon: 'fa-solid fa-compass', title: t('home.ascent.crimson.wildTitle'), body: t('home.ascent.crimson.wildBody')},
]);
</script>

<style scoped>
.crimson {
  --p: 0;
  --rise: clamp(0, calc(0.35 + var(--p) / 0.45), 1);
  --shots: clamp(0, calc((var(--p) + 0.1) / 0.55), 1);
  position: relative;
  height: 110vh;
  background: linear-gradient(180deg, #12141c 0%, #0c0a0d 40%, #0c0a0d 100%);
}

.crimson__stage {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 100vh;
  padding-top: var(--site-header-stack, 96px);
  overflow: hidden;
}

.crimson__sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.crimson__tint {
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse 60% 70% at 70% 40%, rgba(170, 18, 30, 0.55), transparent 70%),
      linear-gradient(180deg, rgba(60, 6, 12, 0.6), rgba(20, 4, 8, 0.2));
  opacity: var(--rise);
}

.crimson__moon {
  position: absolute;
  top: 8vh;
  right: calc(var(--spine-space) + 4vw);
  width: min(62vh, 40vw);
  aspect-ratio: 1;
  transform: translate3d(0, calc((1 - var(--rise)) * 60vh), 0) scale(calc(0.85 + 0.15 * var(--rise)));
  will-change: transform;
}

.crimson__moon img {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.crimson__moon-glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle, rgba(220, 30, 40, 0.5), rgba(160, 10, 20, 0.15) 45%, transparent 68%);
  opacity: var(--rise);
}

.crimson__numeral {
  position: absolute;
  left: -3vw;
  bottom: -18vh;
  font-family: var(--a-display);
  font-size: 100vh;
  font-weight: 900;
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 140, 140, 0.13);
  transform: translate3d(0, calc(var(--p) * -10vh), 0);
}

.crimson__grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: clamp(32px, 4vw, 72px);
  align-items: center;
}

.crimson__title {
  margin-top: 14px;
}

.crimson__lede {
  margin: 22px 0 0;
}

.crimson__list {
  display: grid;
  gap: 18px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

.crimson__list li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 16px;
}

.crimson__list i {
  margin-top: 4px;
  color: #ff7a7a;
}

.crimson__list strong {
  display: block;
  margin-bottom: 4px;
  font-family: var(--a-head);
  font-size: 17px;
  font-weight: 700;
}

.crimson__list li > span > span {
  font-size: 15px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

.crimson__shots {
  position: relative;
  height: min(62vh, 560px);
}

.crimson__shot {
  position: absolute;
  margin: 0;
  border: 1px solid rgba(255, 120, 120, 0.22);
  background: #0c0a0d;
  box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
}

.crimson__shot img {
  display: block;
  width: 100%;
  height: auto;
}

.crimson__shot figcaption {
  padding: 10px 14px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f2c9c9;
}

.crimson__shot--main {
  left: 0;
  bottom: 6%;
  width: 82%;
  opacity: var(--shots);
  transform: translate3d(0, calc((1 - var(--shots)) * 18vh), 0);
}

.crimson__shot--side {
  right: 0;
  top: 0;
  width: 46%;
  opacity: clamp(0, calc(var(--shots) * 1.4 - 0.2), 1);
  transform: translate3d(0, calc((1 - var(--shots)) * 30vh), 0);
}

@media (max-width: 1099px) {
  .crimson__moon {
    right: 3vw;
  }
}

@media (max-width: 899px), (prefers-reduced-motion: reduce) {
  .crimson {
    height: auto;
  }

  .crimson__stage {
    position: relative;
    height: auto;
    padding: clamp(96px, 14vh, 140px) 0;
  }
}

@media (max-width: 899px) {
  .crimson__grid {
    grid-template-columns: 1fr;
  }

  .crimson__moon {
    top: 40px;
    right: -16vw;
    width: 70vw;
  }

  .crimson__numeral {
    display: none;
  }

  .crimson__shots {
    display: grid;
    gap: 16px;
    height: auto;
  }

  .crimson__shot {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .crimson__shot--side {
    width: 70%;
    justify-self: end;
  }
}
</style>
