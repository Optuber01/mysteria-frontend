<template>
  <div class="login-view">
    <header class="login-nav">
      <RouterLink aria-label="Mysterria home" class="login-brand" to="/">
        <IconLogo/>
        <span><strong>Mysterria</strong><small>{{ copy.brandLine }}</small></span>
      </RouterLink>
      <LanguageSelector/>
    </header>

    <main id="main-content" class="login-shell" tabindex="-1">
      <section class="world-panel" aria-labelledby="world-title">
        <img alt="A Mysterria settlement illuminated beneath the night sky" height="1080" src="@/assets/images/optimized/Server.webp" width="1920">
        <div class="world-shade" aria-hidden="true"></div>
        <div class="world-copy">
          <span>{{ copy.worldEyebrow }}</span>
          <h2 id="world-title">{{ copy.worldTitle }}</h2>
          <p>{{ copy.worldBody }}</p>
          <dl>
            <div><dt>32</dt><dd>{{ copy.pathways }}</dd></div>
            <div><dt>26.1.2+</dt><dd>Minecraft</dd></div>
            <div><dt>0</dt><dd>{{ copy.mods }}</dd></div>
          </dl>
        </div>
      </section>

      <section class="login-content" aria-labelledby="login-title">
        <RouterLink class="back-link" to="/">← {{ copy.back }}</RouterLink>
        <div class="login-header">
          <span>{{ copy.memberAccess }}</span>
          <h1 id="login-title">{{ loginTitle }}</h1>
          <p>{{ copy.intro }}</p>
          <p v-if="redirectMessage" class="redirect-message">{{ redirectMessage }}</p>
        </div>

        <div class="login-options">
          <div class="discord-login">
            <button :aria-busy="authStore.isLoading" :disabled="authStore.isLoading" class="discord-button" type="button" @click="handleDiscordLogin">
              <svg aria-hidden="true" class="discord-icon" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 2.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-2.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
                      fill="currentColor"/>
              </svg>
              <span v-if="authStore.isLoading">{{ t('processing') }}</span>
              <span v-else>{{ copy.continueDiscord }}</span>
            </button>
          </div>
        </div>

        <div class="login-info">
          <span aria-hidden="true">✓</span>
          <p>{{ copy.disclaimer }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {isAllowedRedirectUrl} from "@/utils/redirectGuard";
import IconLogo from '@/assets/icons/IconLogo.vue';
import LanguageSelector from '@/components/ui/LanguageSelector.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const {t, currentLanguage} = useI18n();
const redirectMessage = ref("");
const loginTitle = computed(() => currentLanguage.value === "uk" ? "Увійти до Mysterria" : "Log in to Mysterria");
const copy = computed(() => currentLanguage.value === 'uk' ? {
  brandLine: 'За сірим туманом', worldEyebrow: 'СВІТ ЧЕКАЄ', worldTitle: 'Поверніться за сірий туман.', worldBody: 'Продовжуйте свій Шлях, керуйте покупками та залишайтеся на зв’язку зі спільнотою.', pathways: 'Шляхи', mods: 'Обов’язкових модів', back: 'На головну', memberAccess: 'ДОСТУП ГРАВЦЯ', intro: 'Discord підтверджує вашу особу та безпечно повертає вас до Mysterria.', continueDiscord: 'Продовжити через Discord', disclaimer: 'Discord обробляє вхід. Mysterria ніколи не бачить ваш пароль.'
} : {
  brandLine: 'Beyond the gray fog', worldEyebrow: 'THE WORLD AWAITS', worldTitle: 'Return beyond the gray fog.', worldBody: 'Continue your Pathway, manage purchases, and stay connected to the community.', pathways: 'Pathways', mods: 'Required mods', back: 'Back to Mysterria', memberAccess: 'PLAYER ACCESS', intro: 'Discord confirms your identity and returns you safely to Mysterria.', continueDiscord: 'Continue with Discord', disclaimer: 'Discord handles sign-in. Mysterria never sees your password.'
});

const completeRedirect = async () => {
  const redirect = route.query.redirect as string;
  if (!redirect || !isAllowedRedirectUrl(redirect) || !authStore.isAuthenticated) return;

  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    await router.replace(redirect);
    return;
  }

  if (window.opener && authStore.currentToken) {
    window.opener.postMessage(
        {type: 'AUTH_SUCCESS', token: authStore.currentToken},
        new URL(redirect).origin,
    );
    window.close();
  }
};

onMounted(() => {
  const redirect = route.query.redirect as string;

  if (redirect) {
    if (isAllowedRedirectUrl(redirect)) {
      try {
        const redirectUrl = new URL(redirect, window.location.origin);
        redirectMessage.value = currentLanguage.value === "uk"
            ? `Після входу ви повернетеся на ${redirect.startsWith('/') ? 'попередню сторінку' : redirectUrl.hostname}`
            : `After login, you will return to ${redirect.startsWith('/') ? 'the previous page' : redirectUrl.hostname}`;
      } catch {
        redirectMessage.value = currentLanguage.value === "uk" ? "Після входу вас буде перенаправлено" : "You will be redirected after login";
      }
    } else {
      redirectMessage.value = currentLanguage.value === "uk" ? "Після входу вас буде перенаправлено" : "You will be redirected after login";
    }
  }

  // If user is already authenticated, redirect immediately
  void completeRedirect();
});

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) void completeRedirect();
});

const handleDiscordLogin = async () => {
  const redirect = route.query.redirect as string;

  try {
    await authStore.openDiscordAuth(redirect);
  } catch (error) {
    console.error("Login error:", error);
  }
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: #090b12;
  color: var(--myst-ink);
  font-family: var(--font-body);
}

.login-nav {
  position: absolute;
  z-index: 3;
  top: 0;
  right: 0;
  left: 0;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 56px);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  background: rgba(7, 8, 13, .72);
  backdrop-filter: blur(14px);
}

.login-brand { display: inline-flex; align-items: center; gap: 10px; color: #f2ecdf; }
.login-brand :deep(.icon-logo) { width: 44px; height: 44px; }
.login-brand span { display: flex; flex-direction: column; }
.login-brand strong { font: 750 20px/1 var(--font-display); }
.login-brand small { margin-top: 4px; color: #aaa59d; font: 500 10px var(--font-ui); }

.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(440px, .8fr);
}

.world-panel { position: relative; min-height: 100vh; overflow: hidden; }
.world-panel > img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.72) contrast(1.08); }
.world-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(5, 6, 10, .05), rgba(5, 6, 10, .35)), linear-gradient(0deg, rgba(5, 6, 10, .92), transparent 65%); }
.world-copy { position: absolute; z-index: 1; right: clamp(28px, 6vw, 90px); bottom: clamp(42px, 8vh, 90px); left: clamp(28px, 6vw, 90px); max-width: 680px; }
.world-copy > span, .login-header > span { color: var(--myst-gold); font: 750 11px var(--font-ui); letter-spacing: .13em; }
.world-copy h2 { max-width: 620px; margin: 12px 0 18px; font: 780 clamp(46px, 6vw, 82px)/.94 var(--font-display); letter-spacing: -.045em; }
.world-copy > p { max-width: 55ch; margin: 0; color: #d0cbc3; font-size: 17px; }
.world-copy dl { display: flex; gap: 1px; margin: 34px 0 0; }
.world-copy dl div { min-width: 120px; padding: 14px 18px; border: 1px solid rgba(255, 255, 255, .12); background: rgba(7, 8, 13, .55); backdrop-filter: blur(12px); }
.world-copy dt { color: #f3ede1; font: 750 19px var(--font-mono); }
.world-copy dd { margin: 3px 0 0; color: #aaa59d; font: 600 11px var(--font-ui); }

.login-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px clamp(42px, 6vw, 88px) 64px;
  border-left: 1px solid rgba(255, 255, 255, .08);
  background: radial-gradient(circle at 50% 25%, rgba(200, 178, 115, .09), transparent 32%), #0b0d16;
}

.back-link { min-height: 44px; display: inline-flex; align-items: center; align-self: flex-start; margin-bottom: 64px; color: #b8b3aa; font: 650 13px var(--font-ui); }
.back-link:hover { color: var(--myst-gold); }

.login-header { max-width: 500px; margin-bottom: 32px; }
.login-header h1 { margin: 10px 0 14px; color: var(--myst-offwhite); font: 760 clamp(38px, 5vw, 58px)/1 var(--font-display); letter-spacing: -.04em; }
.login-header > p:not(.redirect-message) { margin: 0; color: var(--myst-ink-muted); font-size: 16px; line-height: 1.65; }

.redirect-message {
  color: #dfd5b8;
  font-size: 13px;
  margin: 18px 0 0;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--myst-gold) 9%, transparent);
  border-left: 2px solid var(--myst-gold);
}

.login-options { max-width: 500px; margin-bottom: 20px; }

.discord-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--myst-gold);
  color: #0c0e1a;
  border: 1px solid var(--myst-gold);
  border-radius: var(--radius-md);
  min-height: 56px;
  padding: 15px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
  text-decoration: none;
  font-family: var(--font-ui);
}

.discord-button:hover:not(:disabled) {
  background: var(--myst-gold-soft);
  border-color: var(--myst-gold-soft);
  transform: translateY(-1px);
}

.discord-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.discord-icon {
  width: 20px;
  height: 20px;
}

.login-info {
  max-width: 500px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--myst-ink-muted);
  font-size: 13px;
  line-height: 1.55;
}
.login-info > span { color: #68d391; }

.login-info p {
  margin: 0;
}

@media (max-width: 900px) {
  .login-shell { grid-template-columns: 1fr; }
  .login-content { order: -1; min-height: 68svh; padding: 112px clamp(22px, 7vw, 64px) 54px; border-left: 0; }
  .world-panel { min-height: 32svh; }
  .world-copy { bottom: 28px; }
  .world-copy h2 { font-size: clamp(38px, 8vw, 58px); }
  .world-copy > p, .world-copy dl { display: none; }
  .back-link { margin-bottom: 36px; }
}

@media (max-width: 560px) {
  .login-nav { height: 68px; padding-inline: 16px; }
  .login-brand small { display: none; }
  .world-panel { min-height: 30svh; }
  .world-copy { right: 20px; bottom: 24px; left: 20px; }
  .world-copy h2 { margin-bottom: 0; font-size: 36px; }
  .login-content { min-height: 70svh; padding: 98px 20px 46px; }
  .back-link { margin-bottom: 30px; }
  .login-header h1 { font-size: 38px; }
}
</style>
