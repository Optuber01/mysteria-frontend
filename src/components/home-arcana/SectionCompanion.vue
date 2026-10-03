<template>
  <section id="companion" class="arc-section sec-companion" aria-labelledby="sec-companion-title">
    <div class="arc-shell">
      <div class="sec-companion__panel">
        <!-- what the mod draws: the ritual circle, in the drawn Pathway's colour -->
        <figure class="sec-companion__visual">
          <div class="sec-companion__circle" role="img" :aria-label="t('home.world.companion.visualLabel')">
            <span class="sec-companion__ring" :style="{'--circle': `url(${circle})`}"></span>
            <Transition name="sec-companion-sigil">
              <img :key="card.id" :src="sigilNative(card.id)" alt="" class="sec-companion__sigil" width="512" height="512" loading="lazy" decoding="async">
            </Transition>
          </div>
          <figcaption>{{ sigilCaption }}</figcaption>
        </figure>

        <div class="sec-companion__copy">
          <ArcanaSectionHead :position="t('home.world.companion.position')" title-id="sec-companion-title" :title="t('companion.title')">
            {{ t('companion.lede') }}
          </ArcanaSectionHead>

          <ul class="sec-companion__features">
            <li v-for="feature in features" :key="feature.title">
              <i :class="feature.icon" aria-hidden="true"></i>
              <span><strong>{{ feature.title }}</strong> {{ feature.body }}</span>
            </li>
          </ul>

          <div class="sec-companion__get">
            <p class="arc-label">{{ t('companion.downloadEyebrow') }}</p>
            <div class="sec-companion__links">
              <a
                  v-for="platform in platforms"
                  :key="platform.url"
                  :href="platform.url"
                  class="sec-companion__link"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                <component :is="platform.icon" class="sec-companion__icon" aria-hidden="true"/>
                <span>{{ platform.name }}</span>
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            </div>
            <p class="sec-companion__note"><strong>{{ t('companion.optionalLabel') }}.</strong> {{ t('companion.optional') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import IconGithub from '@/assets/icons/IconGithub.vue';
import IconCurseForge from '@/assets/icons/IconCurseForge.vue';
import IconModrinth from '@/assets/icons/IconModrinth.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import {sigilNative} from './arcana-data';
import {useArcana} from './useArcana';
import circle from '@/assets/images/home-library/items/magic-circle.png';

const {t} = useI18n();
const {card, reading} = useArcana();

const sigilCaption = computed(() => t('home.world.companion.sigilCaption').replace('{pathway}', reading.value.name));

const features = computed(() => [
  {icon: 'fa-solid fa-keyboard', title: t('companion.featureHotkeysTitle'), body: t('companion.featureHotkeysBody')},
  {icon: 'fa-solid fa-wand-magic-sparkles', title: t('companion.featureVisualsTitle'), body: t('companion.featureVisualsBody')},
  {icon: 'fa-solid fa-volume-high', title: t('companion.featurePresenceTitle'), body: t('companion.featurePresenceBody')},
]);
const platforms = [
  {name: 'GitHub Releases', url: 'https://github.com/ikeepcalm/coi-client/releases', icon: IconGithub},
  {name: 'CurseForge', url: 'https://www.curseforge.com/minecraft/mc-mods/coi-client', icon: IconCurseForge},
  {name: 'Modrinth', url: 'https://modrinth.com/mod/coi-client', icon: IconModrinth},
];
</script>

<style scoped>
.sec-companion {
  padding-top: 0;
}

.sec-companion__panel {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  align-items: center;
  gap: clamp(28px, 4vw, 64px);
  padding: clamp(24px, 4vw, 56px);
  border-radius: var(--arc-radius-lg);
  background:
    radial-gradient(60% 80% at 22% 50%, color-mix(in oklab, var(--acc) 16%, transparent), transparent 70%),
    var(--arc-surface);
  box-shadow: inset 0 0 0 1px var(--arc-line);
}

.sec-companion__copy :deep(.arc-head) {
  --arc-head-gap: 24px;
  --arc-fs-display: clamp(32px, 3.6vw, 52px);
}

/* ---- the circle ---- */
.sec-companion__visual {
  display: grid;
  justify-items: center;
  gap: 16px;
  margin: 0;
}

.sec-companion__circle {
  position: relative;
  width: min(100%, 380px);
  aspect-ratio: 1;
}

.sec-companion__ring {
  position: absolute;
  inset: 0;
  background: var(--acc);
  -webkit-mask: var(--circle) center / contain no-repeat;
  mask: var(--circle) center / contain no-repeat;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 18px color-mix(in oklab, var(--acc) 60%, transparent));
  animation: arc-spin 60s linear infinite;
}

.sec-companion__sigil {
  position: absolute;
  inset: 27%;
  width: 46%;
  height: 46%;
  object-fit: contain;
  filter: drop-shadow(0 0 24px color-mix(in oklab, var(--acc) 55%, transparent));
}

.sec-companion-sigil-enter-active,
.sec-companion-sigil-leave-active {
  transition: opacity .6s ease, transform .8s cubic-bezier(.2, .8, .2, 1);
}

.sec-companion-sigil-enter-from {
  opacity: 0;
  transform: scale(.8) rotate(-20deg);
}

.sec-companion-sigil-leave-to {
  opacity: 0;
  transform: scale(1.1) rotate(20deg);
}

.sec-companion__visual figcaption {
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--arc-muted);
  text-align: center;
}

/* ---- copy ---- */
.sec-companion__features {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
  display: grid;
  gap: 12px;
}

.sec-companion__features li {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 14px;
  align-items: baseline;
  color: var(--arc-muted);
  font-size: 15px;
  line-height: 1.55;
}

.sec-companion__features i {
  color: var(--acc);
}

.sec-companion__features strong {
  color: var(--arc-ink);
  font-weight: 600;
}

.sec-companion__get .arc-label {
  margin-bottom: 12px;
}

.sec-companion__links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sec-companion__link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 50px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--arc-bg);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  color: var(--arc-ink);
  font-weight: 500;
  font-size: 14.5px;
  transition: box-shadow .2s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.sec-companion__link:hover {
  box-shadow: inset 0 0 0 1px var(--acc);
  transform: translateY(-2px);
  color: var(--arc-ink);
}

.sec-companion__link i {
  margin-left: auto;
  font-size: 11px;
  color: var(--arc-muted);
}

.sec-companion__icon {
  flex: none;
  width: 20px;
  height: 20px;
  color: var(--acc);
}

.sec-companion__note {
  margin: 14px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--arc-muted);
}

.sec-companion__note strong {
  color: var(--arc-ink);
}

@media (max-width: 1100px) {
  .sec-companion__links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .sec-companion__panel {
    grid-template-columns: 1fr;
  }

  .sec-companion__circle {
    width: min(70vw, 300px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sec-companion__ring {
    animation: none;
  }

  .sec-companion-sigil-enter-active,
  .sec-companion-sigil-leave-active {
    transition: opacity .2s ease;
  }

  .sec-companion-sigil-enter-from,
  .sec-companion-sigil-leave-to {
    transform: none;
  }
}
</style>
