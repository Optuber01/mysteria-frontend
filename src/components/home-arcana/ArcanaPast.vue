<template>
  <section id="past" ref="sectionRef" class="arc-section arc-past" aria-labelledby="arc-past-title">
    <div class="arc-shell arc-past__grid">
      <div class="arc-past__copy">
        <ArcanaSectionHead numeral="I" :position="t('home.arcana.past.position')" title-id="arc-past-title">
          <template #title>{{ t('home.arcana.past.titleA') }} <em>{{ t('home.arcana.past.titleB') }}</em></template>
          {{ t('home.arcana.past.lede') }}
        </ArcanaSectionHead>

        <ul class="arc-past__facts">
          <li v-for="fact in facts" :key="fact.label">
            <strong>{{ fact.value }}</strong>
            <span>{{ fact.label }}</span>
          </li>
        </ul>
      </div>

      <!-- The novel on one side of the card, the server on the other -->
      <div class="arc-past__card-wrap">
        <button
            type="button"
            class="arc-past__card"
            :class="{'is-turned': turned}"
            :aria-pressed="turned"
            :aria-label="t('home.arcana.past.turn')"
            @click="turned = !turned; touched = true"
        >
          <span class="arc-past__flip">
            <span class="arc-past__side arc-past__side--novel">
              <img :src="novelArt" :alt="t('home.arcana.past.novelAlt')" loading="lazy" decoding="async" width="900" height="600">
              <span class="arc-past__tag">{{ t('home.arcana.past.novelTag') }}</span>
            </span>
            <span class="arc-past__side arc-past__side--game">
              <img :src="gameArt" :alt="t('home.arcana.past.gameAlt')" loading="lazy" decoding="async" width="960" height="521">
              <span class="arc-past__tag">{{ t('home.arcana.past.gameTag') }}</span>
            </span>
          </span>
        </button>
        <p class="arc-past__turn-hint" aria-hidden="true">
          <i class="fa-solid fa-rotate" aria-hidden="true"></i>
          {{ turned ? t('home.arcana.past.hintBack') : t('home.arcana.past.hint') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import novelArt from '@/assets/images/optimized/Anime.webp';
import gameArt from '@/assets/images/home-library/community-archive/dungeons/eye-rift/eye-rift-front.webp';

const {t, intlLocale} = useI18n();
const {totalBeyonders} = useBeyonderStats();

const turned = ref(false);
const touched = ref(false);
const sectionRef = ref<HTMLElement | null>(null);

const facts = computed(() => [
  {value: '22 + 10', label: t('home.arcana.past.factPathways')},
  {
    value: totalBeyonders.value ? totalBeyonders.value.toLocaleString(intlLocale.value) : t('home.arcana.past.factBeyondersFallback'),
    label: t('home.arcana.past.factBeyonders'),
  },
  {value: t('home.arcana.past.factSeasonValue'), label: t('home.arcana.past.factSeason')},
  {value: t('home.arcana.past.factEditionValue'), label: t('home.arcana.past.factEdition')},
]);

/* Turn the card once by itself the first time it is properly on screen. */
let observer: IntersectionObserver | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || touched.value) return;
    timer = setTimeout(() => {
      if (!touched.value) turned.value = true;
    }, 1100);
    observer?.disconnect();
  }, {threshold: 0.6});
  if (sectionRef.value) observer.observe(sectionRef.value.querySelector('.arc-past__card') ?? sectionRef.value);
});
onUnmounted(() => {
  observer?.disconnect();
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.arc-past__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr);
  gap: clamp(32px, 6vw, 100px);
  align-items: center;
}

.arc-past__facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--arc-line);
  border: 1px solid var(--arc-line);
  border-radius: 12px;
  overflow: hidden;
}

.arc-past__facts li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  background: var(--arc-bg);
}

.arc-past__facts strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(20px, 2vw, 28px);
  line-height: 1.15;
  color: var(--arc-ink);
}

.arc-past__facts span {
  font-size: 14px;
  color: var(--arc-muted);
}

/* ---- the turning card ---- */
.arc-past__card-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.arc-past__card {
  all: unset;
  position: relative;
  display: block;
  width: min(100%, 330px);
  aspect-ratio: 1 / 1.62;
  perspective: 1600px;
  cursor: pointer;
  border-radius: 18px;
}

.arc-past__card:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 8px;
}

.arc-past__flip {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateZ(-3deg);
  transition: transform 1.1s cubic-bezier(.6, -0.05, .2, 1.1);
}

.arc-past__card:hover .arc-past__flip {
  transform: rotateZ(-1deg) translateY(-6px);
}

.arc-past__card.is-turned .arc-past__flip {
  transform: rotateZ(3deg) rotateY(180deg);
}

.arc-past__card.is-turned:hover .arc-past__flip {
  transform: rotateZ(1deg) rotateY(180deg) translateY(-6px);
}

.arc-past__side {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 18px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: #111;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, .6),
    0 0 0 1px color-mix(in oklab, var(--acc) 50%, transparent),
    0 0 90px color-mix(in oklab, var(--acc) 20%, transparent);
}

.arc-past__side::after {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 10px;
  pointer-events: none;
}

.arc-past__side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.arc-past__side--novel img {
  object-position: 50% 30%;
}

.arc-past__side--game {
  transform: rotateY(180deg);
}

.arc-past__side--game img {
  object-position: 50% 50%;
}

.arc-past__tag {
  position: absolute;
  left: 50%;
  bottom: 26px;
  translate: -50% 0;
  padding: 7px 14px;
  border-radius: 99px;
  background: rgba(8, 8, 10, .78);
  backdrop-filter: blur(6px);
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
}

.arc-past__turn-hint {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

@media (max-width: 900px) {
  .arc-past__grid {
    grid-template-columns: 1fr;
  }

  .arc-past__card {
    width: min(78vw, 340px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-past__flip {
    transition: none;
  }
}
</style>
