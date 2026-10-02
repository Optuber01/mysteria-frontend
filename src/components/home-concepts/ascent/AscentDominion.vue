<template>
  <section id="sequence-3" ref="rootRef" class="dom" aria-labelledby="ascent-dom-title">
    <div class="dom__haze" aria-hidden="true"></div>

    <div class="a-shell">
      <header class="dom__head a-split">
        <div>
          <p class="a-eyebrow" data-rv>
            <span class="a-seq">3</span><span class="a-seq">2</span><span class="a-seq">1</span>{{ t('home.ascent.dom.eyebrow') }}
          </p>
          <h2 id="ascent-dom-title" class="a-h2 dom__title" data-rv>{{ t('home.ascent.dom.title') }}</h2>
        </div>
        <p class="a-lede dom__lede" data-rv>{{ t('home.ascent.dom.lede') }}</p>
      </header>

      <ol ref="stairsRef" class="dom__stairs">
        <li v-for="(tier, index) in tiers" :key="tier.key" class="dom__tier" :style="{'--k': index}">
          <article class="dom__card" data-rv>
            <figure class="dom__img">
              <img :src="tier.img" :alt="tier.alt" width="900" :height="tier.h" loading="lazy" decoding="async">
            </figure>
            <div class="dom__card-body">
              <p class="dom__kicker">{{ tier.kicker }}</p>
              <h3 class="dom__card-title">{{ tier.title }}</h3>
              <p class="dom__card-text">{{ tier.body }}</p>
              <ul class="dom__chips">
                <li v-for="(chip, chipIndex) in tier.chips" :key="chip">
                  <span>{{ chip }}</span>
                  <i v-if="tier.chain && chipIndex < tier.chips.length - 1" class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </li>
              </ul>
            </div>
          </article>
        </li>
      </ol>

      <div class="dom__links" data-rv>
        <RouterLink :to="$lp('/guide/towns')" class="a-link">{{ t('home.ascent.dom.linkTowns') }}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></RouterLink>
        <RouterLink :to="$lp('/guide/economy')" class="a-link">{{ t('home.ascent.dom.linkEconomy') }}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReveals, useScrollProgress} from './useAscentScroll';
import cathedral from './img/cathedral.webp';
import agora from './img/agora.webp';
import emporium from './img/emporium.webp';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const stairsRef = ref<HTMLElement | null>(null);
useReveals(rootRef);
useScrollProgress(stairsRef, 'through');

const tiers = computed(() => [
  {
    key: 'church', img: cathedral, h: 473, alt: t('home.ascent.dom.imgChurch'),
    kicker: t('home.ascent.dom.churchKicker'), title: t('home.ascent.dom.churchTitle'), body: t('home.ascent.dom.churchBody'),
    chips: [t('home.ascent.dom.churchChip1'), t('home.ascent.dom.churchChip2'), t('home.ascent.dom.churchChip3')], chain: false,
  },
  {
    key: 'land', img: agora, h: 460, alt: t('home.ascent.dom.imgTown'),
    kicker: t('home.ascent.dom.landKicker'), title: t('home.ascent.dom.landTitle'), body: t('home.ascent.dom.landBody'),
    chips: [t('home.ascent.dom.tierTown'), t('home.ascent.dom.tierDomain'), t('home.ascent.dom.tierNation')], chain: true,
  },
  {
    key: 'wealth', img: emporium, h: 506, alt: t('home.ascent.dom.imgEmporium'),
    kicker: t('home.ascent.dom.wealthKicker'), title: t('home.ascent.dom.wealthTitle'), body: t('home.ascent.dom.wealthBody'),
    chips: ['Coppets', 'Licks', "Verl d'or", '/emporium'], chain: false,
  },
]);
</script>

<style scoped>
.dom {
  position: relative;
  padding: clamp(64px, 8vh, 96px) 0 clamp(56px, 7vh, 80px);
  overflow: hidden;
  background: linear-gradient(180deg, #0c0a0d 0%, #171a20 18%, #232830 55%, #353c46 100%);
}

.dom__haze {
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse 50% 30% at 80% 20%, rgba(200, 215, 230, 0.08), transparent 70%),
      radial-gradient(ellipse 70% 30% at 30% 100%, rgba(220, 230, 240, 0.1), transparent 70%);
  pointer-events: none;
}

.dom__head {
  position: relative;
}

.dom__title {
  margin-top: 14px;
}

.dom__lede {
  margin: 0;
}

/* Three steps, each higher than the last */
.dom__stairs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 28px);
  align-items: start;
  margin: clamp(28px, 4vh, 44px) 0 0;
  padding: 0;
  list-style: none;
}

.dom__tier {
  padding-top: calc((2 - var(--k)) * clamp(36px, 4.4vw, 72px));
  transform: translate3d(0, calc((0.5 - var(--p, 0.5)) * (var(--k) + 1) * 44px), 0);
}

.dom__card {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(242, 243, 245, 0.14);
  background: rgba(14, 16, 20, 0.6);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.dom__img {
  margin: 0;
  aspect-ratio: 2 / 1;
  overflow: hidden;
}

.dom__img img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dom__card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px 22px;
}

.dom__kicker {
  margin: 0;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-accent);
}

.dom__card-title {
  margin: 0;
  font-family: var(--a-head);
  font-size: clamp(19px, 1.6vw, 23px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.dom__card-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

.dom__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.dom__chips li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dom__chips span {
  padding: 5px 10px;
  border: 1px solid rgba(242, 243, 245, 0.2);
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--a-ink);
}

.dom__chips i {
  font-size: 10px;
  color: var(--a-ink-3);
}

.dom__links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 36px;
  margin-top: clamp(24px, 3.5vh, 40px);
}

@media (max-width: 1099px) {
  .dom__stairs {
    grid-template-columns: 1fr;
    max-width: 640px;
  }

  .dom__tier {
    padding-top: 0;
    transform: none;
  }

  .dom__tier + .dom__tier {
    margin-top: 20px;
  }

  .dom__tier:nth-child(2) {
    margin-left: 8%;
  }

  .dom__tier:nth-child(3) {
    margin-left: 16%;
  }
}

@media (max-width: 599px) {
  .dom {
    padding: 72px 0 80px;
  }

  .dom__stairs {
    display: flex;
    gap: 12px;
    max-width: none;
    margin-inline: calc(var(--gutter) * -1);
    padding: 0 var(--gutter) 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--gutter);
  }

  .dom__tier {
    flex: 0 0 82%;
    scroll-snap-align: start;
  }

  .dom__tier + .dom__tier {
    margin-top: 0;
  }

  .dom__tier:nth-child(n) {
    margin-left: 0;
  }

  .dom__img {
    aspect-ratio: 2.4;
  }

  .dom__card-body {
    padding: 18px 18px 20px;
  }

  .dom__card-text {
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dom__tier {
    transform: none;
  }
}
</style>
