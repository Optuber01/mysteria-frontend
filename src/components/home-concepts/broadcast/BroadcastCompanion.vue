<template>
  <section class="bc-companion" aria-labelledby="bc-companion-title">
    <div class="bc-shell">
      <div id="companion" class="companion">
        <div v-reveal class="companion-copy">
          <p class="bc-label">{{ t('companion.eyebrow') }}</p>
          <h2 id="bc-companion-title" class="bc-h2 companion-title">{{ t('companion.title') }}</h2>
          <p class="bc-lede">{{ t('companion.lede') }}</p>
          <ul class="companion-features">
            <li v-for="feature in features" :key="feature.title">
              <i :class="feature.icon" aria-hidden="true"></i>
              <span>
                <strong>{{ feature.title }}</strong>
                <span>{{ feature.body }}</span>
              </span>
            </li>
          </ul>
          <p class="companion-optional">
            <strong>{{ t('companion.optionalLabel') }}</strong> {{ t('companion.optional') }}
          </p>
        </div>

        <div v-reveal="140" class="companion-card">
          <div class="companion-visual" aria-hidden="true">
            <img :src="circle" class="cv-circle" alt="" width="256" height="256" loading="lazy">
            <img :src="sigilLarge('fool')" class="cv-sigil" alt="" width="512" height="512" loading="lazy">
            <span class="cv-key k1">R</span>
            <span class="cv-key k2">F</span>
            <span class="cv-key k3">G</span>
          </div>
          <p class="card-label">{{ t('companion.downloadEyebrow') }}</p>
          <a
              v-for="platform in platforms"
              :key="platform.url"
              class="platform"
              :href="platform.url"
              rel="noopener noreferrer"
              target="_blank"
          >
            <component :is="platform.icon" class="platform-icon" aria-hidden="true"/>
            <span class="platform-name">{{ platform.name }}</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span class="bc-sr">{{ t('home.broadcast.newTab') }}</span>
          </a>
          <p class="card-note">{{ t('companion.platformNote') }}</p>
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
import circle from '@/assets/images/home-library/items/magic-circle.png';
import {sigilLarge, vReveal} from './broadcast';

const {t} = useI18n();


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
.bc-companion {
  scroll-margin-top: 0;
  padding: clamp(60px, 6.5vw, 96px) 0;
  background:
    radial-gradient(ellipse 50% 40% at 85% 75%, rgba(49, 80, 245, 0.16), transparent 70%),
    var(--bc-night);
}

/* ── Companion ── */
.companion {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
  scroll-margin-top: calc(var(--site-header-stack, 80px) + 24px);
}

.companion-title {
  margin: 18px 0 20px;
}

.companion-features {
  display: grid;
  gap: 18px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
}

.companion-features li {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.companion-features i {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(152, 171, 255, 0.12);
  color: var(--bc-blue-hi);
  font-size: 16px;
}

.companion-features strong {
  display: block;
  margin-bottom: 2px;
  font-weight: 600;
}

.companion-features li span span {
  font-size: 15px;
  line-height: 1.5;
  color: var(--bc-mute);
}

.companion-optional {
  margin: 28px 0 0;
  padding: 16px 18px;
  border-left: 2px solid var(--bc-blue-hi);
  border-radius: 0 10px 10px 0;
  background: rgba(243, 244, 248, 0.04);
  font-size: 14px;
  line-height: 1.55;
  color: #c9ccd8;
}

.companion-optional strong {
  margin-right: 4px;
  color: #fff;
}

.companion-card {
  padding: clamp(22px, 2.2vw, 30px);
  border: 1px solid var(--bc-line);
  border-radius: 20px;
  background: linear-gradient(180deg, var(--bc-night-3), var(--bc-night-2));
}

.companion-visual {
  position: relative;
  aspect-ratio: 16 / 8;
  margin-bottom: 18px;
  border-radius: 12px;
  background: radial-gradient(ellipse 60% 70% at 50% 50%, rgba(49, 80, 245, 0.35), transparent 72%), var(--bc-night);
  overflow: hidden;
}

.cv-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 92%;
  aspect-ratio: 1;
  transform-origin: center;
  translate: -50% -50%;
  image-rendering: pixelated;
  filter: hue-rotate(185deg) saturate(1.8) brightness(1.15) drop-shadow(0 0 20px rgba(120, 150, 255, 0.7));
  animation: cv-spin 30s linear infinite;
}

.cv-sigil {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 46%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 30px rgba(180, 175, 216, 0.6));
}

@keyframes cv-spin {
  to { transform: rotate(360deg); }
}

.cv-key {
  position: absolute;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--bc-line-strong);
  border-bottom-width: 3px;
  border-radius: 7px;
  background: var(--bc-night-3);
  font-family: var(--bc-font-mono);
  font-size: 13px;
  color: var(--bc-snow);
}

.k1 { left: 9%; top: 18%; }
.k2 { right: 10%; top: 28%; }
.k3 { left: 14%; bottom: 14%; }

.card-label {
  margin: 0 0 10px;
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-mute);
}

.platform {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--bc-line);
  color: var(--bc-snow);
  text-decoration: none;
  transition: color .25s ease, padding .3s var(--bc-ease);
}

.platform:hover {
  color: var(--bc-blue-hi);
  padding-left: 10px;
}

.platform-icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.platform-name {
  flex: 1;
  font-weight: 600;
}

.platform i {
  font-size: 12px;
  color: var(--bc-mute);
}

.card-note {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--bc-mute);
}

@media (max-width: 1000px) {
  .companion {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {

}

@media (prefers-reduced-motion: reduce) {
  .cv-circle {
    animation: none;
  }
}
</style>
