<template>
  <section id="reading" class="arc-section arc-reading" aria-labelledby="arc-reading-title">
    <div class="arc-shell arc-reading__grid">
      <div class="arc-reading__copy">
        <p class="arc-reading__kicker">
          <img :src="sigilThumb(card.id)" alt="" class="arc-reading__sigil" width="44" height="44" loading="lazy">
          <span>{{ t('home.arcana.reading.kicker') }}</span>
        </p>
        <h2 id="arc-reading-title" :key="reading.id" class="arc-reading__name">
          <span class="arc-reading__num">{{ card.boon ? t('home.arcana.deck.boon') : card.numeral }}</span>
          {{ reading.name }}
        </h2>
        <p class="arc-reading__story">{{ story }}</p>

        <dl class="arc-reading__stats">
          <div>
            <dt>{{ t('home.arcana.reading.statSequences') }}</dt>
            <dd>{{ reading.sequenceCount }}</dd>
          </div>
          <div>
            <dt>{{ t('home.arcana.reading.statAbilities') }}</dt>
            <dd>{{ reading.abilityCount || '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('home.arcana.reading.statStart') }}</dt>
            <dd class="is-word">{{ reading.seq9 || '-' }}</dd>
          </div>
        </dl>

        <div v-if="reading.early.length" class="arc-reading__abilities">
          <p class="arc-label">{{ t('home.arcana.reading.firstAbilities').replace('{role}', reading.seq9) }}</p>
          <ul :key="reading.id">
            <li v-for="(ability, index) in reading.early" :key="ability.name" :style="{'--i': index}">
              <strong>{{ ability.name }}</strong>
              <span>{{ ability.description }}</span>
            </li>
          </ul>
        </div>

        <div class="arc-reading__actions">
          <RouterLink :to="$lp(`/pathways/${card.id}`)" class="arc-btn arc-btn--solid">
            {{ t('home.arcana.reading.open').replace('{name}', reading.name) }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
          <a href="#deck" class="arc-btn arc-btn--ghost">{{ t('home.arcana.reading.browse') }}</a>
        </div>
      </div>

      <!-- The ladder: Sequence 9 at the bottom, the throne at the top -->
      <div class="arc-ladder" :aria-label="t('home.arcana.reading.ladderLabel').replace('{name}', reading.name)" role="group">
        <p class="arc-label arc-ladder__top">{{ card.boon ? t('home.arcana.reading.boonCap') : t('home.arcana.reading.throne') }}</p>
        <ol :key="reading.id + String(reading.loaded)" class="arc-ladder__rungs" reversed>
          <li
              v-for="(rung, index) in rungsTopDown"
              :key="rung.sequence"
              :class="{'is-start': rung.sequence === 9, 'is-divine': rung.sequence <= 4}"
              :style="{'--i': rungsTopDown.length - index}"
          >
            <span class="arc-ladder__seq">{{ rung.sequence }}</span>
            <span class="arc-ladder__name">{{ rung.name }}</span>
            <span v-if="rank(rung.sequence)" class="arc-ladder__rank">{{ rank(rung.sequence) }}</span>
            <span v-if="rung.sequence === 9" class="arc-ladder__you">{{ t('home.arcana.reading.youStart') }}</span>
          </li>
        </ol>
        <p v-if="!rungsTopDown.length" class="arc-ladder__loading">{{ t('home.arcana.reading.loading') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {sigilThumb} from './arcana-data';
import {useArcana} from './useArcana';

const {t, currentLanguage} = useI18n();
const {card, reading, data} = useArcana();

const rungsTopDown = computed(() => reading.value.ladder.slice().sort((a, b) => a.sequence - b.sequence));
const rank = (n: number) => (data.value && !card.value.boon ? data.value.sequenceRank(n, currentLanguage.value) : '');

const story = computed(() => {
  const r = reading.value;
  const key = card.value.boon ? 'home.arcana.reading.storyBoon' : 'home.arcana.reading.story';
  return t(key)
      .replace('{name}', r.name)
      .replace('{role}', r.seq9 || r.name)
      .replace('{count}', String(r.sequenceCount))
      .replace('{abilities}', String(r.abilityCount || '-'));
});
</script>

<style scoped>
.arc-reading__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr);
  gap: clamp(32px, 6vw, 96px);
  align-items: center;
}

.arc-reading__kicker {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 18px;
  font-family: var(--arc-caps);
  font-size: 11.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--acc);
}

.arc-reading__sigil {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 0 10px color-mix(in oklab, var(--acc) 50%, transparent));
}

.arc-reading__name {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(44px, 6.8vw, 104px);
  line-height: .95;
  letter-spacing: -.03em;
  color: var(--arc-ink);
  animation: arc-rise .7s cubic-bezier(.2, .8, .2, 1) both;
}

.arc-reading__num {
  display: block;
  margin-bottom: 12px;
  font-family: var(--arc-caps);
  font-weight: 500;
  font-size: .26em;
  letter-spacing: .1em;
  color: var(--acc);
}

.arc-reading__story {
  max-width: 36em;
  margin: 24px 0 30px;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.65;
  color: var(--arc-muted);
}

.arc-reading__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 0 30px;
  border-top: 1px solid var(--arc-line);
  border-bottom: 1px solid var(--arc-line);
}

.arc-reading__stats div {
  padding: 16px 16px 16px 0;
}

.arc-reading__stats div + div {
  padding-left: 18px;
  border-left: 1px solid var(--arc-line);
}

.arc-reading__stats dt {
  font-family: var(--arc-caps);
  font-size: 10.5px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.arc-reading__stats dd {
  margin: 6px 0 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(26px, 2.6vw, 38px);
  line-height: 1.1;
  color: var(--acc);
}

.arc-reading__stats dd.is-word {
  font-size: clamp(16px, 1.5vw, 21px);
  line-height: 1.3;
  padding-top: 6px;
  overflow-wrap: anywhere;
}

.arc-reading__abilities ul {
  list-style: none;
  margin: 12px 0 32px;
  padding: 0;
  display: grid;
  gap: 10px;
}

.arc-reading__abilities li {
  display: grid;
  grid-template-columns: minmax(130px, auto) 1fr;
  gap: 4px 18px;
  padding: 12px 16px;
  border-left: 2px solid var(--acc);
  background: linear-gradient(90deg, color-mix(in oklab, var(--acc) 9%, transparent), transparent 80%);
  animation: arc-rise .6s cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(var(--i) * 80ms + 120ms);
}

.arc-reading__abilities strong {
  font-weight: 600;
  color: var(--arc-ink);
}

.arc-reading__abilities span {
  color: var(--arc-muted);
  font-size: 15px;
}

.arc-reading__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* ---- ladder ---- */
.arc-ladder {
  position: relative;
  padding: 26px 26px 22px;
  border: 1px solid var(--arc-line);
  border-radius: 14px;
  background:
    radial-gradient(80% 50% at 50% 0%, color-mix(in oklab, var(--acc) 14%, transparent), transparent 70%),
    var(--arc-surface);
}

.arc-ladder__top {
  margin: 0 0 14px;
  text-align: center;
}

.arc-ladder__rungs {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.arc-ladder__rungs::before {
  content: '';
  position: absolute;
  left: 21px;
  top: 14px;
  bottom: 14px;
  width: 2px;
  background: linear-gradient(0deg, var(--acc), color-mix(in oklab, var(--acc) 15%, transparent));
}

.arc-ladder__rungs li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 40px;
  padding: 4px 10px 4px 0;
  border-radius: 8px;
  animation: arc-rise .5s cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(var(--i) * 45ms);
}

.arc-ladder__seq {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 30px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 13px;
  font-weight: 600;
  color: var(--arc-ink);
}

.arc-ladder__seq::before {
  content: '';
  position: absolute;
  inset: 4px 12px;
  border-radius: 4px;
  background: var(--arc-surface);
  border: 1.5px solid color-mix(in oklab, var(--acc) 55%, transparent);
  transform: rotate(45deg);
  z-index: -1;
}

.arc-ladder__name {
  min-width: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--arc-ink);
  overflow-wrap: anywhere;
}

.arc-ladder__rank {
  margin-left: auto;
  font-family: var(--arc-caps);
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--arc-muted);
  white-space: nowrap;
}

.arc-ladder__rungs li.is-start {
  background: color-mix(in oklab, var(--acc) 16%, transparent);
}

.arc-ladder__rungs li.is-start .arc-ladder__seq::before {
  background: var(--acc);
  border-color: var(--acc);
}

.arc-ladder__rungs li.is-start .arc-ladder__seq {
  color: var(--arc-on-acc);
}

.arc-ladder__you {
  margin-left: auto;
  padding: 3px 8px;
  border-radius: 99px;
  background: var(--acc);
  color: var(--arc-on-acc);
  font-family: var(--arc-caps);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .1em;
  text-transform: uppercase;
  white-space: nowrap;
}

.arc-ladder__loading {
  margin: 20px 0;
  text-align: center;
  color: var(--arc-muted);
}

@media (max-width: 900px) {
  .arc-reading__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .arc-reading__abilities li {
    grid-template-columns: 1fr;
  }

  .arc-reading__stats div {
    padding-right: 8px;
  }

  .arc-reading__stats div + div {
    padding-left: 10px;
  }

  .arc-ladder {
    padding: 20px 14px 16px;
  }
}
</style>
