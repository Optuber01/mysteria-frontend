<template>
  <section id="companion" ref="rootRef" class="comp" aria-labelledby="ascent-comp-title">
    <div class="a-shell comp__grid">
      <div class="comp__copy">
        <p class="a-eyebrow a-eyebrow--ink" data-rv>{{ t('companion.eyebrow') }}</p>
        <h2 id="ascent-comp-title" class="a-h2 a-h2--ink comp__title" data-rv>{{ t('companion.title') }}</h2>
        <p class="comp__lede" data-rv>{{ t('companion.lede') }}</p>

        <ul class="comp__features">
          <li v-for="feature in features" :key="feature.title" data-rv>
            <i :class="feature.icon" aria-hidden="true"></i>
            <span>
              <strong>{{ feature.title }}</strong>
              <span>{{ feature.body }}</span>
            </span>
          </li>
        </ul>
      </div>

      <div class="comp__card" data-rv>
        <p class="comp__card-label">{{ t('companion.downloadEyebrow') }}</p>
        <a
            v-for="platform in platforms"
            :key="platform.url"
            class="comp__platform"
            :href="platform.url"
            target="_blank"
            rel="noopener noreferrer"
        >
          <component :is="platform.icon" class="comp__platform-icon"/>
          <span class="comp__platform-name">{{ platform.name }}</span>
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>
        <p class="comp__note">{{ t('companion.platformNote') }}</p>
        <p class="comp__optional">
          <strong>{{ t('companion.optionalLabel') }}</strong>
          {{ t('companion.optional') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import IconGithub from '@/assets/icons/IconGithub.vue';
import IconCurseForge from '@/assets/icons/IconCurseForge.vue';
import IconModrinth from '@/assets/icons/IconModrinth.vue';
import {useReveals} from './useAscentScroll';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
useReveals(rootRef);

const features = computed(() => [
  {icon: 'fa-solid fa-keyboard', title: t('companion.featureHotkeysTitle'), body: t('companion.featureHotkeysBody')},
  {icon: 'fa-solid fa-wand-magic-sparkles', title: t('companion.featureVisualsTitle'), body: t('companion.featureVisualsBody')},
  {icon: 'fa-solid fa-volume-high', title: t('companion.featurePresenceTitle'), body: t('companion.featurePresenceBody')},
]);

/* GitHub first: it always carries the newest build. */
const platforms = [
  {name: 'GitHub Releases', url: 'https://github.com/ikeepcalm/coi-client/releases', icon: IconGithub},
  {name: 'CurseForge', url: 'https://www.curseforge.com/minecraft/mc-mods/coi-client', icon: IconCurseForge},
  {name: 'Modrinth', url: 'https://modrinth.com/mod/coi-client', icon: IconModrinth},
];
</script>

<style scoped>
.comp {
  position: relative;
  padding: clamp(64px, 8vh, 96px) 0 clamp(64px, 9vh, 100px);
  background: linear-gradient(180deg, #e8ecf0 0%, #dde2e7 100%);
  color: var(--l-ink);
  border-top: 1px solid rgba(11, 12, 14, 0.08);
}

.comp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: clamp(32px, 5vw, 88px);
  align-items: center;
}

.comp__title {
  margin-top: 14px;
  color: var(--l-ink);
}

.comp__lede {
  max-width: 40em;
  margin: 22px 0 0;
  font-size: 17px;
  line-height: 1.65;
  color: var(--l-muted);
}

.comp__features {
  display: grid;
  gap: 14px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.comp__features li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 14px;
}

.comp__features i {
  margin-top: 4px;
  color: var(--l-accent);
}

.comp__features strong {
  display: block;
  margin-bottom: 3px;
  font-family: var(--a-head);
  font-size: 17px;
  font-weight: 700;
}

.comp__features li > span > span {
  font-size: 15px;
  line-height: 1.6;
  color: var(--l-muted);
}

.comp__card {
  display: grid;
  gap: 10px;
  padding: clamp(24px, 3vw, 34px);
  background: var(--l-ink);
  color: var(--a-ink);
  box-shadow: 0 30px 80px rgba(20, 30, 40, 0.25);
}

.comp__card-label {
  margin: 0 0 8px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-accent);
}

.comp__platform {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  padding: 0 16px;
  border: 1px solid rgba(242, 243, 245, 0.16);
  color: var(--a-ink);
  text-decoration: none;
  transition: border-color 0.25s ease, background-color 0.25s ease;
}

.comp__platform:hover {
  border-color: var(--a-accent);
  background: rgba(73, 226, 255, 0.06);
}

.comp__platform:focus-visible {
  outline: 2px solid var(--a-accent);
  outline-offset: 2px;
}

.comp__platform-icon {
  width: 20px;
  height: 20px;
  color: var(--a-accent);
}

.comp__platform-name {
  flex: 1;
  font-family: var(--a-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.comp__platform i {
  font-size: 11px;
  color: var(--a-ink-3);
}

.comp__note {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--a-ink-2);
}

.comp__optional {
  margin: 8px 0 0;
  padding-top: 16px;
  border-top: 1px solid rgba(242, 243, 245, 0.12);
  font-size: 13px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

.comp__optional strong {
  margin-right: 6px;
  color: var(--a-ink);
}

@media (max-width: 899px) {
  .comp__grid {
    grid-template-columns: 1fr;
  }
}
</style>
