<template>
  <ArcPage narrow :lede="t('logoutPage.lede')" :title="t('logout')">
    <template #actions>
      <button class="arc-btn arc-btn--solid" type="button" @click="handleLogout">
        {{ t("logout") }}
      </button>
    </template>
  </ArcPage>
</template>

<script lang="ts" setup>
import {useAuthStore} from "@/stores/auth";
import {useRouter} from "vue-router";
import {useI18n} from "@/composables/useI18n";
import ArcPage from "@/components/arcana/ArcPage.vue";

const authStore = useAuthStore();
const router = useRouter();
const {t} = useI18n();

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/");
  } catch (error) {
    console.error(t("errorLogoutConsole"), error);
  }
};
</script>
