<template>
  <Teleport to="body">
    <Transition name="ritual-fade">
       <div v-if="show" class="modal-ritual-overlay" @click="emit('close')">
         <div
            ref="dialogRef"
            aria-labelledby="join-server-title"
            aria-modal="true"
            class="modal-ritual-content"
            role="dialog"
            tabindex="-1"
            @click.stop
        >
          <div class="modal-ritual-header">
            <h2 id="join-server-title" class="ritual-title">{{ t('home.joinServerTitle') }}</h2>
             <button :aria-label="t('close')" class="modal-ritual-close" type="button" @click="emit('close')">×</button>
          </div>

          <div class="modal-ritual-body">
            <div class="join-ritual-steps">
              <!-- Step 1 -->
              <div class="join-ritual-step">
                <div class="step-num">1</div>
                <div class="step-info">
                  <h4 class="step-title">{{ t('home.step1Title') }}</h4>
                  <p class="step-desc">{{ t('home.step1Description') }}</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="join-ritual-step">
                <div class="step-num">2</div>
                <div class="step-info">
                  <h4 class="step-title">{{ t('home.step2Title') }}</h4>
                  <p class="step-desc">{{ t('home.step2Description') }}</p>
                   <div class="ip-ritual-box">
                     <code class="ip-sigil">{{ t('serverAddress') }}</code>
                     <button :aria-label="joinCopy.copy" class="ip-copy" type="button" @click="copyServerAddress">{{ copied ? '✓' : '⧉' }}</button>
                   </div>
                   <span class="copy-feedback" aria-live="polite">{{ copyFeedback }}</span>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="join-ritual-step">
                <div class="step-num">3</div>
                <div class="step-info">
                  <h4 class="step-title">{{ t('home.step3Title') }}</h4>
                  <p class="step-desc">{{ t('home.step3Description') }}</p>
                </div>
              </div>
            </div>

            <div class="modal-ritual-actions">
               <router-link class="btn-ritual-primary" to="/guide" @click="emit('close')">
                {{ t('home.fullGuide') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
 import {computed, ref} from 'vue';
 import {useI18n} from '@/composables/useI18n';
 import {useModalA11y} from '@/composables/useModalA11y';

 const props = defineProps<{
   show: boolean;
 }>();

 const emit = defineEmits<{close: []}>();

 const {t, currentLanguage} = useI18n();
 const dialogRef = ref<HTMLElement | null>(null);
 const copied = ref(false);
 const copyFeedback = ref('');
 const joinCopy = computed(() => currentLanguage.value === 'uk' ? {copy: 'Копіювати адресу сервера', copied: 'Адресу скопійовано', failed: 'Не вдалося скопіювати адресу'} : {copy: 'Copy server address', copied: 'Server address copied', failed: 'Could not copy server address'});
 const isOpen = computed(() => props.show);
 useModalA11y(isOpen, dialogRef, () => emit('close'));
 const copyServerAddress = async () => {
   try {
     await navigator.clipboard.writeText(t('serverAddress'));
     copied.value = true;
     copyFeedback.value = joinCopy.value.copied;
   } catch {
     copyFeedback.value = joinCopy.value.failed;
   }
   window.setTimeout(() => { copied.value = false; copyFeedback.value = ''; }, 2200);
 };
</script>

<style scoped>
.modal-ritual-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.modal-ritual-content {
  background: #080a14;
  border: 1px solid rgba(200, 178, 115, 0.2);
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-height: min(760px, calc(100dvh - 40px));
  overscroll-behavior: contain;
}

.modal-ritual-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ritual-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--myst-gold);
  margin: 0;
}

.modal-ritual-close {
  background: none; border: none;
  color: #aaa; font-size: 24px;
  cursor: pointer; transition: color var(--motion-base) var(--ease-standard);
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
}
.modal-ritual-close:hover { color: var(--myst-gold); }

.modal-ritual-body {
  padding: 32px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.join-ritual-steps {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 40px;
}

.join-ritual-step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-num {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--myst-gold);
  color: var(--myst-gold);
  border-radius: 50%;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: #fff;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 15px;
  color: #b0adb0;
  line-height: 1.5;
}

.ip-ritual-box {
  margin-top: 12px;
  padding: 12px 16px;
  background: #05070a;
  border: 1px solid rgba(200, 178, 115, 0.15);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  border-radius: var(--radius-md);
}

.ip-sigil {
  font-family: var(--font-mono);
  color: var(--myst-gold);
  font-size: 16px;
}

.modal-ritual-actions {
  display: flex;
  justify-content: center;
}

.btn-ritual-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--myst-gold);
  color: #05070a;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 700;
  transition: background-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);
}

.btn-ritual-primary:hover {
  background: #fff;
  transform: translateY(-1px);
}

/* Transitions */
.ritual-fade-enter-active, .ritual-fade-leave-active { transition: opacity var(--motion-base) var(--ease-enter), transform var(--motion-base) var(--ease-enter); }
.ritual-fade-enter-from, .ritual-fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width: 560px) {
  .modal-ritual-overlay { align-items: flex-end; padding: 0; }
  .modal-ritual-content { max-height: 92dvh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  .modal-ritual-header, .modal-ritual-body { padding: 20px; }
  .join-ritual-steps { gap: 22px; margin-bottom: 28px; }
}
.ip-copy { width: 44px; height: 44px; border: 1px solid rgba(200, 178, 115, .25); border-radius: var(--radius-sm); background: transparent; color: var(--myst-gold); cursor: pointer; }
.copy-feedback { display: block; min-height: 18px; margin-top: 5px; color: #b8b3aa; font-size: 12px; }
</style>
