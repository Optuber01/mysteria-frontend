<template>
  <ArcCentered>
    <ArcGateCard>
      <h1 class="arc-h3">{{ t('loginPage.title') }}</h1>
      <p class="arc-lede">{{ t('loginPage.lede') }}</p>

      <p v-if="redirectMessage" class="login__note" role="status">{{ redirectMessage }}</p>

      <button :disabled="authStore.isLoading" class="arc-btn arc-btn--solid login__button" type="button" @click="handleDiscordLogin">
        <IconDiscord aria-hidden="true" class="arc-btn__icon"/>
        <span v-if="authStore.isLoading">{{ t('processing') }}</span>
        <span v-else>{{ t('loginWithDiscord') }}</span>
      </button>

      <p class="arc-muted login__help">
        {{ t('loginPage.helpLead') }}
        <RouterLink :to="`${$lp('/help')}#linking`" class="arc-link">{{ t('loginPage.helpLink') }}</RouterLink>
      </p>
    </ArcGateCard>
  </ArcCentered>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {useAuthStore} from "@/stores/auth";
import {useI18n} from "@/composables/useI18n";
import {isAllowedRedirectUrl} from "@/utils/redirectGuard";
import ArcCentered from "@/components/arcana/ArcCentered.vue";
import ArcGateCard from "@/components/arcana/ArcGateCard.vue";
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
.login__note {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--arc-r-md);
  background: color-mix(in oklab, var(--acc) 8%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  font-size: var(--arc-fs-small);
}

.login__button {
  width: 100%;
  margin-top: 10px;
}

.login__help {
  font-size: var(--arc-fs-small);
}
</style>
