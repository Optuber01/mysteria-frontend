<template>
  <ArcPage narrow :title="t('loginPage.title')">
    <div class="arc-panel login">
      <p v-if="redirectMessage" class="login__note" role="status">{{ redirectMessage }}</p>

      <button :disabled="authStore.isLoading" class="arc-btn arc-btn--solid login__button" type="button" @click="handleDiscordLogin">
        <IconDiscord aria-hidden="true" class="arc-btn__icon"/>
        <span v-if="authStore.isLoading">{{ t('processing') }}</span>
        <span v-else>{{ t('loginWithDiscord') }}</span>
      </button>

      <p class="login__info arc-muted">{{ t('secureLoginDisclaimer') }}</p>
    </div>
  </ArcPage>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {isAllowedRedirectUrl} from "@/utils/redirectGuard";
import ArcPage from "@/components/arcana/ArcPage.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";

const route = useRoute();
const authStore = useAuthStore();
const {t} = useI18n();
const redirectMessage = ref("");

onMounted(() => {
  const redirect = route.query.redirect as string;

  if (redirect) {
    if (isAllowedRedirectUrl(redirect)) {
      try {
        const redirectUrl = new URL(redirect);
        redirectMessage.value = t("loginPage.redirectHost").replace("{host}", redirectUrl.hostname);
      } catch {
        redirectMessage.value = t("loginPage.redirectGeneric");
      }
    } else {
      redirectMessage.value = t("loginPage.redirectGeneric");
    }
  }

  // If user is already authenticated, redirect immediately
  if (authStore.isAuthenticated && redirect && isAllowedRedirectUrl(redirect)) {
    const token = authStore.currentToken;
    if (token) {
      window.location.href = `${redirect}&token=${encodeURIComponent(token)}`;
    }
  }
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
.login {
  display: grid;
  gap: var(--arc-group-gap);
  max-width: 460px;
}

.login__note {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--arc-r-md);
  background: color-mix(in oklab, var(--acc) 8%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  font-size: var(--arc-fs-small);
}

.login__button {
  width: 100%;
}

.login__info {
  margin: 0;
  font-size: var(--arc-fs-small);
}
</style>
