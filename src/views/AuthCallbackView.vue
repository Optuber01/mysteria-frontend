<template>
  <!-- A popup of its own (Discord sends the reader back here), so no site header or footer. -->
  <main id="main-content" class="callback">
    <div class="arc-panel callback__panel" :aria-busy="isProcessing">
      <template v-if="isProcessing">
        <span aria-hidden="true" class="callback__spinner"></span>
        <h1 class="arc-h4" role="status">{{ t('authCallback.processing') }}</h1>
      </template>
      <template v-else-if="error">
        <h1 class="arc-h4 callback__bad" role="alert">{{ t('authCallback.authError') }}</h1>
        <p class="arc-muted">{{ error }}</p>
        <button class="arc-btn arc-btn--solid" type="button" @click="closeWindow">{{ t('close') }}</button>
      </template>
      <template v-else>
        <h1 class="arc-h4 callback__ok">{{ t('authCallback.authSuccess') }}</h1>
        <p class="arc-muted">{{ t('authCallback.closeWindow') }}</p>
        <button class="arc-btn arc-btn--solid" type="button" @click="closeWindow">{{ t('close') }}</button>
      </template>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {isAllowedRedirectUrl} from "@/utils/redirectGuard";

const route = useRoute();
const authStore = useAuthStore();
const {t} = useI18n();
const isProcessing = ref(true);
const error = ref("");

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
          // Fallback: if window.close() is blocked (non-popup context / mobile), redirect with token in URL
          setTimeout(() => {
            window.location.href = `${redirectUrl}&token=${encodeURIComponent(authStore.currentToken || '')}`;
          }, 500);
        }, 300);
        return;
      }

      // Normal same-origin popup flow
      if (window.opener) {
        window.opener.postMessage(
            {type: "AUTH_SUCCESS"},
            window.location.origin,
        );
      } else {
        // Not in a popup – go home
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
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
</script>

<style scoped>
.callback {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--arc-gutter);
  background: var(--arc-bg);
  color: var(--arc-ink);
  font-family: var(--arc-body);
}

.callback__panel {
  display: grid;
  justify-items: center;
  gap: 16px;
  width: min(100%, 420px);
  text-align: center;
}

.callback__panel p {
  margin: 0;
}

.callback__ok {
  color: var(--arc-ok);
}

.callback__bad {
  color: var(--arc-bad);
}

.callback__spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--arc-line);
  border-top-color: var(--acc-ink);
  border-radius: 50%;
  animation: callback-spin .9s linear infinite;
}

@keyframes callback-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .callback__spinner {
    animation-duration: 2.4s;
  }
}
</style>
