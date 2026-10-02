<template>
  <section class="bc-join" aria-labelledby="bc-join-title">
    <div class="join-media" aria-hidden="true">
      <img :src="coast" alt="" loading="lazy" decoding="async" width="1920" height="1009">
    </div>
    <div class="bc-shell join-inner">
      <div v-reveal class="join-copy">
        <p class="join-label">{{ t('home.broadcast.join.label') }}</p>
        <h2 id="bc-join-title" class="join-title">{{ t('home.broadcast.join.title') }}</h2>
        <ol class="join-steps">
          <li v-for="(step, index) in steps" :key="step">
            <span class="join-n">{{ index + 1 }}</span>
            <span>{{ t(`home.broadcast.join.steps.${step}`).replace('{address}', address) }}</span>
          </li>
        </ol>
      </div>

      <div v-reveal="140" class="join-actions">
        <button type="button" :class="['join-copy-btn', copyState]" @click="copy">
          <span class="join-ip">{{ address }}</span>
          <span class="join-act">
            <i :class="copyState === 'copied' ? 'fa-solid fa-check' : copyState === 'failed' ? 'fa-solid fa-xmark' : 'fa-solid fa-copy'" aria-hidden="true"></i>
            {{ copyState === 'copied' ? t('home.broadcast.copy.done') : copyState === 'failed' ? t('home.broadcast.copy.failedShort') : t('home.broadcast.copy.action') }}
          </span>
        </button>
        <p class="join-feedback" role="status" aria-live="polite">
          {{ copyState === 'copied' ? t('home.broadcast.copy.doneLong') : copyState === 'failed' ? t('home.broadcast.copy.failed').replace('{address}', address) : t('home.broadcast.join.requirements') }}
        </p>
        <div class="join-buttons">
          <RouterLink :to="$lp('/guide/connect')" class="bc-btn join-primary">
            {{ t('home.broadcast.join.guide') }} <span class="bc-arrow" aria-hidden="true">→</span>
          </RouterLink>
          <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noopener noreferrer" class="bc-btn join-ghost">
            <IconDiscord class="join-discord" aria-hidden="true"/>
            {{ t('home.broadcast.join.discord') }}
            <span class="bc-sr">{{ t('home.broadcast.newTab') }}</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import {useAddressCopy, vReveal} from './broadcast';
import coast from './assets/hero-coast-1920.webp';

const {t} = useI18n();
const {state: copyState, copy, address} = useAddressCopy();

const steps = ['add', 'pack', 'lobby'];
</script>

<style scoped>
.bc-join {
  position: relative;
  padding: clamp(60px, 6.5vw, 92px) 0;
  overflow: hidden;
  isolation: isolate;
  background: var(--bc-blue);
  color: #fff;
}

.join-media {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.join-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 40%;
  mix-blend-mode: luminosity;
  opacity: 0.55;
}

.join-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(30, 48, 200, 0.94) 0%, rgba(49, 80, 245, 0.62) 55%, rgba(49, 80, 245, 0.4) 100%);
}

.join-inner {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 48px clamp(32px, 5vw, 80px);
  align-items: end;
}

.join-label {
  margin: 0 0 18px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e3e8ff;
}

.join-title {
  margin: 0;
  font-family: var(--bc-font-display);
  font-weight: 700;
  font-size: clamp(34px, 4.3vw, 64px);
  line-height: 1;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.join-steps {
  display: grid;
  gap: 12px;
  margin: 36px 0 0;
  padding: 0;
  list-style: none;
  font-size: 17px;
}

.join-steps li {
  display: flex;
  align-items: center;
  gap: 14px;
}

.join-n {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  font-family: var(--bc-font-mono);
  font-size: 12px;
}

.join-copy-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 72px;
  padding: 10px 10px 10px 26px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: var(--bc-ink);
  font: inherit;
  cursor: pointer;
  box-shadow: 0 30px 60px -30px rgba(7, 8, 12, 0.6);
  transition: transform .3s var(--bc-ease);
}

.join-copy-btn:hover {
  transform: translateY(-2px);
}

.join-copy-btn:focus-visible {
  outline-color: #fff;
}

.join-ip {
  font-family: var(--bc-font-mono);
  font-size: clamp(16px, 1.5vw, 20px);
  font-weight: 500;
}

.join-act {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 22px;
  border-radius: 999px;
  background: var(--bc-ink);
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
}

.join-copy-btn.copied .join-act {
  background: var(--bc-live);
  color: var(--bc-ink);
}

.join-copy-btn.failed .join-act {
  background: var(--bc-alert);
  color: var(--bc-ink);
}

.join-feedback {
  min-height: 1.5em;
  margin: 12px 0 0 8px;
  font-size: 14px;
  color: #e3e8ff;
}

.join-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.bc-join .join-primary {
  background: var(--bc-ink);
  color: #fff;
}

.bc-join .join-primary:hover {
  transform: translateY(-2px);
  background: #000;
}

.bc-join .join-ghost {
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.bc-join .join-ghost:hover {
  border-color: #fff;
  transform: translateY(-2px);
}

.bc-join :deep(.bc-btn:focus-visible) {
  outline-color: #fff;
}

.join-discord {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

@media (max-width: 900px) {
  .join-inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .join-copy-btn {
    padding-left: 18px;
  }

  .join-buttons > * {
    width: 100%;
  }
}
</style>
