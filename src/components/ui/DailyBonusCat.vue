<template>
  <Teleport to="body">
    <Transition name="cat-fade">
      <div
          v-if="shouldShow"
          class="daily-cat-wrapper"
          :style="positionStyle"
          :title="t('dailyBonusCatTitle')"
          role="button"
          tabindex="0"
          @click="handleClick"
          @keydown.enter="handleClick"
      >
        <div class="daily-cat-glow" />
        <img
            :alt="t('dailyBonusCatAlt')"
            class="daily-cat-img"
            src="@/assets/images/daily/nicky.webp"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue';
import {useAuthStore} from '@/stores/auth';
import {useDailyBonusStore} from '@/stores/dailyBonus';
import {useNotification} from '@/services/useNotification';
import {useI18n} from '@/composables/useI18n';

const props = defineProps<{ page: string }>();

const authStore = useAuthStore();
const bonusStore = useDailyBonusStore();
const {show} = useNotification();
const {t} = useI18n();

interface PositionPreset {
  bottom?: string;
  top?: string;
  left?: string;
  right?: string;
}

const POSITION_PRESETS: PositionPreset[] = [
  {bottom: '80px', right: '24px'},
  {bottom: '120px', left: '24px'},
  {top: '140px', right: '20px'},
  {top: '200px', left: '20px'},
  {bottom: '200px', right: '48px'},
  {bottom: '160px', left: '48px'},
];

const positionStyle = ref<Record<string, string>>({});

onMounted(() => {
  const preset = POSITION_PRESETS[Math.floor(Math.random() * POSITION_PRESETS.length)];
  const style: Record<string, string> = {position: 'fixed', zIndex: '900'};
  if (preset.bottom) style.bottom = preset.bottom;
  if (preset.top) style.top = preset.top;
  if (preset.left) style.left = preset.left;
  if (preset.right) style.right = preset.right;
  positionStyle.value = style;
});

const shouldShow = computed(() =>
    authStore.isAuthenticated &&
    bonusStore.isAvailable &&
    bonusStore.randomPage === props.page,
);

const handleClick = async () => {
  if (!authStore.isAuthenticated) return;

  const result = await bonusStore.claim();

  if (result.success) {
    show(t('dailyBonusFound'), {type: 'success', duration: 6000});
  } else if (result.alreadyClaimed) {
    show(t('dailyBonusAlreadyClaimed'), {type: 'info', duration: 4000});
  } else {
    show(t('dailyBonusLinkMinecraft'), {type: 'warn', duration: 5000});
  }
};
</script>

<style scoped>
.daily-cat-wrapper {
  cursor: pointer;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: transform var(--motion-base) var(--ease-standard);
}

.daily-cat-wrapper:hover {
  transform: scale(1.025);
}

.daily-cat-wrapper:active {
  transform: scale(0.98);
}

.daily-cat-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  opacity: 0.75;
  transition: opacity var(--motion-base) var(--ease-standard);
  border-radius: var(--radius-md);
}

.daily-cat-wrapper:hover .daily-cat-img {
  opacity: 1;
}

.daily-cat-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 178, 115, 0.15) 0%, transparent 70%);
  opacity: 0.5;
  pointer-events: none;
}

.cat-fade-enter-active {
  transition: opacity var(--motion-base) var(--ease-enter), transform var(--motion-base) var(--ease-enter);
}

.cat-fade-leave-active {
  transition: opacity var(--motion-base) var(--ease-enter), transform var(--motion-base) var(--ease-enter);
}

.cat-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.cat-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
