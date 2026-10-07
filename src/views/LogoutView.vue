<template>
  <ArcCentered>
    <ArcGateCard>
      <h1 class="arc-h3">{{ t('logout') }}</h1>
      <p class="arc-lede">{{ t('logoutPage.lede') }}</p>
      <div class="logout__actions">
        <button class="arc-btn arc-btn--solid" type="button" @click="handleLogout">{{ t('logout') }}</button>
        <RouterLink :to="$lp('/')" class="arc-btn arc-btn--ghost">{{ t('navHome') }}</RouterLink>
      </div>
    </ArcGateCard>
  </ArcCentered>
</template>

<script lang="ts" setup>
import {useAuthStore} from "@/stores/auth";
import {useRouter} from "vue-router";
import {useI18n} from "@/composables/useI18n";
import ArcCentered from "@/components/arcana/ArcCentered.vue";
import ArcGateCard from "@/components/arcana/ArcGateCard.vue";

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

<style scoped>
.logout__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
</style>
