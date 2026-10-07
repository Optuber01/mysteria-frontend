<template>
  <!--
    The one way to buy, shared by the store and an item's page. A signed-out reader is
    sent to sign in instead of meeting an error; a signed-in one confirms the order here.
  -->
  <ModalItem ref="modal" :title="t('shopPage.purchase.title')" size="md">
    <PurchaseModalContent
        v-if="item"
        v-model:amount="amount"
        v-model:is-gift="isGift"
        v-model:recipient-id="recipientId"
        :item="item"
    />

    <template #footer>
      <button class="arc-btn arc-btn--ghost" type="button" @click="modal?.closeModal()">{{ t('shopPage.purchase.cancel') }}</button>
      <button
          :disabled="processing || !canAfford || (isGift && !recipientId)"
          class="arc-btn arc-btn--solid"
          type="button"
          @click="confirm"
      >
        <i v-if="processing" class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
        {{ processing ? t('shopPage.purchase.processing') : t('shopPage.purchase.confirm') }}
      </button>
    </template>
  </ModalItem>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import Decimal from 'decimal.js';
import ModalItem from '@/components/ui/ModalItem.vue';
import {useI18n} from '@/composables/useI18n';
import {useNotification} from '@/services/useNotification';
import {useAuthStore} from '@/stores/auth';
import {useBalanceStore} from '@/stores/balance';
import {useUserStore} from '@/stores/user';
import type {ServiceMarkdownDto, ServiceResponse} from '@/types/services';
import PurchaseModalContent from './PurchaseModalContent.vue';

type StoreItem = ServiceResponse | ServiceMarkdownDto;

const {t} = useI18n();
const {show} = useNotification();
const authStore = useAuthStore();
const balanceStore = useBalanceStore();
const userStore = useUserStore();

const modal = ref<InstanceType<typeof ModalItem> | null>(null);
const item = ref<StoreItem | null>(null);
const amount = ref(1);
const isGift = ref(false);
const recipientId = ref('');
const processing = ref(false);

const canAfford = computed(() => {
  const balance = balanceStore.currentBalance?.amount;
  if (!item.value || !balance) return false;
  return !balance.lessThan(new Decimal(item.value.price.toString()).mul(amount.value));
});

/** Start buying an item: sign in first if needed, then confirm the order. */
async function open(next: StoreItem) {
  if (!authStore.isAuthenticated) {
    await authStore.openDiscordAuth();
    return;
  }
  const profile = userStore.currentUser ?? authStore.currentUser;
  if (!profile?.verified || !profile?.nickname) {
    show(t('profileSetupRequired'), {type: 'warn', duration: 6000});
    return;
  }
  item.value = next;
  amount.value = 1;
  isGift.value = false;
  recipientId.value = '';
  modal.value?.showModal({title: t('shopPage.purchase.title')});
  await balanceStore.fetchBalance();
}

async function confirm() {
  if (!item.value) return;
  processing.value = true;
  try {
    const done = await balanceStore.initiatePurchase(
        String(item.value.id),
        amount.value,
        isGift.value ? recipientId.value : undefined,
    );
    if (done) modal.value?.closeModal();
  } finally {
    processing.value = false;
  }
}

defineExpose({open});
</script>
