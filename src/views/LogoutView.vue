<template>
  <main id="main-content" class="logout-container" tabindex="-1">
    <div class="logout-card">
      <h1>{{ t("logout") }}</h1>
      <button class="logout-button" type="button" @click="handleLogout">
        {{ t("logout") }}
      </button>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {useAuthStore} from "@/stores/auth";
import {useRouter} from "vue-router";
import {useI18n} from "@/composables/useI18n";

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
.logout-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background:
      radial-gradient(circle at 50% 20%, rgba(200, 178, 115, 0.13), transparent 35%),
      linear-gradient(145deg, var(--myst-bg-2), var(--myst-bg) 58%);
  font-family: var(--font-body);
}

.logout-card {
  width: min(100%, 420px);
  padding: 48px;
  text-align: center;
  background: color-mix(in srgb, var(--myst-bg-2) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--myst-gold) 28%, transparent);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

.logout-card h1 {
  margin: 0 0 28px;
  color: var(--myst-offwhite);
  font-family: var(--font-display);
  font-size: clamp(2rem, 7vw, 2.75rem);
  line-height: 1.1;
}

.logout-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-family: var(--font-ui);
  font-weight: 700;
  color: #0c0e1a;
  background: var(--myst-gold);
  border: 1px solid var(--myst-gold);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
}

.logout-button:hover {
  background: var(--myst-gold-soft);
  transform: translateY(-1px);
}
</style>
