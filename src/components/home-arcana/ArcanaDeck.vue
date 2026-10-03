<template>
  <section id="deck" class="arc-section arc-deck" aria-labelledby="arc-deck-title">
    <div class="arc-shell">
      <ArcanaSectionHead numeral="✶" :position="t('home.arcana.deck.position')" title-id="arc-deck-title" center>
        <template #title>{{ t('home.arcana.deck.titleA') }} <em>{{ t('home.arcana.deck.titleB') }}</em></template>
        {{ t('home.arcana.deck.lede') }}
      </ArcanaSectionHead>

      <ul class="arc-deck__grid">
        <li v-for="item in core" :key="item.id" class="arc-deck__item" :class="{'is-current': item.id === currentId}">
          <RouterLink :to="$lp(`/pathways/${item.id}`)" class="arc-deck__card" :aria-label="t('home.arcana.deck.openLabel').replace('{name}', nameOf(item.id))">
            <ArcanaFace :id="item.id" :name="nameOf(item.id)" :role="seq9Of(item.id)"/>
          </RouterLink>
          <button
              type="button"
              class="arc-deck__draw"
              :aria-label="t('home.arcana.deck.drawLabel').replace('{name}', nameOf(item.id))"
              :aria-pressed="item.id === currentId"
              @click="choose(item.id)"
          >
            <i :class="item.id === currentId ? 'fa-solid fa-check' : 'fa-solid fa-wand-sparkles'" aria-hidden="true"></i>
            <span>{{ item.id === currentId ? t('home.arcana.deck.yours') : t('home.arcana.deck.draw') }}</span>
          </button>
        </li>
      </ul>

      <div class="arc-deck__boons-head">
        <p class="arc-label">{{ t('home.arcana.deck.boonsLabel') }}</p>
        <p>{{ t('home.arcana.deck.boonsBody') }}</p>
      </div>
      <ul class="arc-deck__grid arc-deck__grid--boons">
        <li v-for="item in boons" :key="item.id" class="arc-deck__item" :class="{'is-current': item.id === currentId}">
          <RouterLink :to="$lp(`/pathways/${item.id}`)" class="arc-deck__card" :aria-label="t('home.arcana.deck.openLabel').replace('{name}', nameOf(item.id))">
            <ArcanaFace :id="item.id" :name="nameOf(item.id)" :role="seq9Of(item.id)" :boon-label="t('home.arcana.deck.boon')"/>
          </RouterLink>
          <button
              type="button"
              class="arc-deck__draw"
              :aria-label="t('home.arcana.deck.drawLabel').replace('{name}', nameOf(item.id))"
              :aria-pressed="item.id === currentId"
              @click="choose(item.id)"
          >
            <i :class="item.id === currentId ? 'fa-solid fa-check' : 'fa-solid fa-wand-sparkles'" aria-hidden="true"></i>
            <span>{{ item.id === currentId ? t('home.arcana.deck.yours') : t('home.arcana.deck.draw') }}</span>
          </button>
        </li>
      </ul>

      <div class="arc-deck__cta">
        <RouterLink :to="$lp('/pathways')" class="arc-btn arc-btn--solid">
          {{ t('home.arcana.deck.archive') }}
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import ArcanaFace from './ArcanaFace.vue';
import {BOON_CARDS, CORE_CARDS} from './arcana-data';
import {useArcana} from './useArcana';

const {t} = useI18n();
const {currentId, nameOf, seq9Of, draw} = useArcana();
const core = CORE_CARDS;
const boons = BOON_CARDS;

const choose = (id: string) => {
  if (id !== currentId.value) void draw(id);
};
</script>

<style scoped>
.arc-deck__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(11, minmax(0, 1fr));
  gap: 18px 12px;
}

.arc-deck__grid--boons {
  grid-template-columns: repeat(10, minmax(0, 1fr));
  max-width: 80%;
  margin-inline: auto;
}

.arc-deck__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.arc-deck__card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1.62;
  container-type: inline-size;
  border-radius: 8px;
  transition: transform .45s cubic-bezier(.2, .8, .2, 1);
}

.arc-deck__card:hover,
.arc-deck__card:focus-visible {
  transform: translateY(-10px) rotate(-2deg) scale(1.04);
  z-index: 2;
}

.arc-deck__card:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 4px;
}

.arc-deck__item.is-current .arc-deck__card {
  transform: translateY(-6px);
  box-shadow: 0 0 0 2px var(--acc), 0 0 40px color-mix(in oklab, var(--acc) 40%, transparent);
}

.arc-deck__card :deep(.arc-face) {
  padding: 8cqw 6cqw 9cqw;
}

.arc-deck__card :deep(.arc-face__name) {
  font-size: 10.5cqw;
  letter-spacing: 0;
}

.arc-deck__card :deep(.arc-face__role) {
  font-size: 7.4cqw;
  letter-spacing: .02em;
  line-height: 1.25;
}

.arc-deck__card :deep(.arc-face__numeral) {
  font-size: 11cqw;
}

.arc-deck__draw {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 99px;
  font-family: var(--arc-caps);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--arc-muted);
  cursor: pointer;
  transition: color .2s, background-color .2s;
}

.arc-deck__draw:hover {
  color: var(--arc-ink);
  background: color-mix(in oklab, var(--acc) 16%, transparent);
}

.arc-deck__draw:focus-visible {
  outline: 2px solid var(--arc-ink);
  outline-offset: 2px;
}

.arc-deck__item.is-current .arc-deck__draw {
  color: var(--acc);
}

.arc-deck__boons-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 6px 16px;
  margin: clamp(28px, 4vw, 44px) 0 18px;
  text-align: center;
}

.arc-deck__boons-head p {
  margin: 0;
  color: var(--arc-muted);
  font-size: 15px;
}

.arc-deck__cta {
  display: flex;
  justify-content: center;
  margin-top: clamp(24px, 3vw, 36px);
}

@media (max-width: 1280px) {
  .arc-deck__grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }

  .arc-deck__grid--boons {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    max-width: 62%;
  }
}

@media (max-width: 800px) {
  .arc-deck__grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .arc-deck__grid--boons {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    max-width: none;
  }
}

/* phones: each row becomes a swipeable rail of cards */
@media (max-width: 640px) {
  .arc-deck__grid,
  .arc-deck__grid--boons {
    display: flex;
    gap: 12px;
    max-width: none;
    margin-inline: calc(clamp(18px, 4vw, 64px) * -1);
    padding: 16px clamp(18px, 4vw, 64px) 6px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: clamp(18px, 4vw, 64px);
    scrollbar-width: thin;
  }

  .arc-deck__item {
    flex: 0 0 112px;
    scroll-snap-align: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-deck__card {
    transition: none;
  }
}
</style>
