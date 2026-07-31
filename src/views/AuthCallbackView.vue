<template>
  <main id="main-content" class="auth-callback" tabindex="-1">
    <div class="callback-content">
      <div v-if="isProcessing" aria-live="polite" class="processing" role="status">
        <div aria-hidden="true" class="spinner"></div>
        <h1>{{ t('authCallback.processing') }}</h1>
      </div>
      <div v-else-if="error" class="error" role="alert">
        <h1 ref="resultHeading" tabindex="-1">{{ t('authCallback.authError') }}</h1>
        <p>{{ error }}</p>
        <button type="button" @click="retryLogin">{{ t('login') }}</button>
        <button type="button" @click="closeWindow">{{ t('close') }}</button>
      </div>
      <div v-else aria-live="polite" class="success" role="status">
        <h1 ref="resultHeading" tabindex="-1">{{ t('authCallback.authSuccess') }}</h1>
        <p>{{ t('authCallback.closeWindow') }}</p>
        <button type="button" @click="closeWindow">{{ t('close') }}</button>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {nextTick, onMounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {isAllowedRedirectUrl} from "@/utils/redirectGuard";

const route = useRoute();
const authStore = useAuthStore();
const {t} = useI18n();
const isProcessing = ref(true);
const error = ref("");
const resultHeading = ref<HTMLElement | null>(null);
const retryRedirect = ref('');

watch(isProcessing, async (processing) => {
  if (processing) return;
  await nextTick();
  resultHeading.value?.focus();
});

onMounted(async () => {
  console.log("AuthCallback mounted, query params:", route.query);

  try {
    const code = route.query.code as string;
    const state = route.query.state as string;

    console.log("Auth code:", code);
    console.log("State:", state);

    // Parse redirect URL from state parameter
    let redirectUrl = "";
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        redirectUrl = stateData.redirect;
        retryRedirect.value = redirectUrl;
        console.log("Redirect URL from state:", redirectUrl);
      } catch (e) {
        console.warn("Failed to parse state parameter:", e);
      }
    }

    if (!code) {
      throw new Error(t('authCallback.authorizationCodeNotReceived'));
    }

    console.log("Processing auth code with new JWT system...");

    // Process the Discord callback directly without calling checkAuthCode
    // which would cause a duplicate call
    await authStore.processDiscordCallback(code);

    if (authStore.isAuthenticated) {
      isProcessing.value = false;

      // Cross-domain auth: token is in localStorage, just close the popup.
      // The login page (Popup 1) polls authWindow.closed and will forward the token to the archive.
      // window.opener is unreliable here – browsers clear it when the popup navigates to Discord.
      if (redirectUrl) {
        if (!isAllowedRedirectUrl(redirectUrl)) {
          throw new Error(t('authCallback.invalidRedirectUrl') || 'Invalid redirect URL');
        }
        setTimeout(() => {
          window.close();
        }, 300);
        return;
      }

      // Normal same-origin popup flow
      if (window.opener) {
        window.opener.postMessage(
            {type: "AUTH_SUCCESS"},
            window.location.origin,
        );
      } else if (window.name === 'Discord Login') {
        // Discord may clear window.opener during OAuth, but the named popup can still close itself.
        setTimeout(() => {
          window.close();
        }, 300);
        return;
      } else {
        // Direct mobile callback: tokens are stored in this browsing context.
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
        return;
      }

      setTimeout(() => {
        console.log("Closing window...");
        closeWindow();
      }, 2000);
    } else {
      throw new Error(t('authCallback.authenticationFailed'));
    }
  } catch (err) {
    console.error("Auth callback error:", err);
    error.value = err instanceof Error ? err.message : t('unknownError');
    isProcessing.value = false;
  }
});

const closeWindow = () => {
  if (window.opener) {
    window.close();
  } else {
    window.location.href = "/";
  }
};

const retryLogin = () => {
  if (window.opener) {
    window.close();
    return;
  }
  const query = retryRedirect.value ? `?redirect=${encodeURIComponent(retryRedirect.value)}` : '';
  window.location.href = `/login${query}`;
};
</script>

<style scoped>
.auth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background:
      radial-gradient(circle at 50% 20%, rgba(200, 178, 115, 0.13), transparent 35%),
      linear-gradient(145deg, var(--myst-bg-2), var(--myst-bg) 58%);
  color: var(--myst-ink);
  font-family: var(--font-body);
}

.callback-content {
  text-align: center;
  padding: 40px;
  width: min(100%, 460px);
  background: color-mix(in srgb, var(--myst-bg-2) 88%, transparent);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--myst-gold) 28%, transparent);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid color-mix(in srgb, var(--myst-gold) 20%, transparent);
  border-top-color: var(--myst-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.processing h1,
.error h1,
.success h1 {
  margin: 0 0 16px 0;
  color: var(--myst-offwhite);
  font-family: var(--font-display);
  font-size: clamp(2rem, 7vw, 2.75rem);
  line-height: 1.1;
}

.processing p,
.error p,
.success p {
  margin: 0 0 24px 0;
  color: var(--myst-ink-muted);
}

button {
  background: var(--myst-gold);
  color: #0c0e1a;
  border: 1px solid var(--myst-gold);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 16px;
  transition: background-color var(--motion-base) var(--ease-standard);
  font-family: var(--font-ui);
  font-weight: 700;
}

button:hover {
  background: var(--myst-gold-soft);
}

.error h1 {
  color: #fca5a5;
}

.success h1 {
  color: var(--myst-gold);
}
</style>
