<template>
  <!--
    The reader's balance and the way to add to it, with the plain answer to the question
    players ask most: how a top-up works, and who to ask when one doesn't arrive.
  -->
  <section class="arc-panel shop-balance" aria-labelledby="shop-balance-title">
    <div class="shop-balance__own">
      <h2 id="shop-balance-title" class="arc-h4">{{ t('shopPage.balance.heading') }}</h2>

      <template v-if="signedIn">
        <p class="shop-balance__amount">
          <IconMark class="shop-balance__mark" aria-hidden="true"/>
          <span>{{ amountLabel }}</span>
        </p>
        <p v-if="needsSetup" class="shop-balance__note">
          {{ setupText[0] }}<RouterLink :to="$lp('/profile')" class="arc-link">{{ t('shopPage.balance.setupLink') }}</RouterLink>{{ setupText[1] }}
        </p>
        <div class="shop-balance__actions">
          <a :href="topUpUrl" class="arc-btn arc-btn--solid arc-btn--sm" target="_blank" rel="noopener noreferrer">
            {{ t('shopPage.balance.topUp') }}
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span class="arc-sr">({{ t('shopPage.newTab') }})</span>
          </a>
        </div>
      </template>

      <template v-else>
        <p class="shop-balance__note">{{ t('shopPage.balance.signedOut') }}</p>
        <div class="shop-balance__actions">
          <button type="button" class="arc-btn arc-btn--solid arc-btn--sm" @click="signIn">
            {{ t('shopPage.balance.signIn') }}
          </button>
        </div>
      </template>
    </div>

    <!-- beside the balance on wide screens; a closed disclosure on phones -->
    <component :is="wide ? 'div' : 'details'" class="shop-balance__how">
      <component :is="wide ? 'div' : 'summary'" class="shop-balance__summary">
        <h3 class="shop-balance__how-title">{{ t('shopPage.balance.howTitle') }}</h3>
        <i v-if="!wide" class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </component>
      <ol class="arc-rows shop-balance__steps">
        <template v-if="provider === 'bmc'">
          <li class="arc-row">{{ bmcStep }}</li>
          <li class="arc-row">{{ nameStep }}</li>
        </template>
        <li v-else class="arc-row">{{ t('shopPage.balance.stepDonatello') }}</li>
        <li class="arc-row">{{ t('shopPage.balance.stepCredited') }}</li>
        <li class="arc-row">
          <span>
            {{ missingText[0] }}<a :href="STORE_DISCORD" class="arc-link" target="_blank" rel="noopener noreferrer">{{ t('shopPage.balance.missingLink') }}<span class="arc-sr"> ({{ t('shopPage.newTab') }})</span></a>{{ missingText[1] }}
          </span>
        </li>
      </ol>
      <RouterLink :to="$lp('/help') + '#top-ups'" class="arc-link shop-balance__more">
        {{ t('shopPage.balance.more') }}
      </RouterLink>
    </component>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import IconMark from '@/assets/icons/IconMark.vue';
import {useI18n} from '@/composables/useI18n';
import {useAuthStore} from '@/stores/auth';
import {useBalanceStore} from '@/stores/balance';
import {useUserStore} from '@/stores/user';
import {splitAround, STORE_DISCORD, useStorePrice} from './useStorePrice';

const {t} = useI18n();
const authStore = useAuthStore();
const balanceStore = useBalanceStore();
const userStore = useUserStore();
const {marks, provider, topUpUrl, rates} = useStorePrice();

const signedIn = computed(() => authStore.isAuthenticated);
const amountLabel = computed(() => {
  const amount = balanceStore.currentBalance?.amount;
  return amount === undefined ? '…' : marks(amount);
});
const needsSetup = computed(() => {
  const profile = userStore.currentUser ?? authStore.currentUser;
  return !!profile && (!profile.verified || !profile.nickname);
});

const setupText = computed(() => splitAround(t('shopPage.balance.setup')));
const missingText = computed(() => splitAround(t('shopPage.balance.missing')));
const bmcStep = computed(() => t('shopPage.balance.stepBmc')
    .replace('{usd}', String(rates.value.usd))
    .replace('{eur}', String(rates.value.eur)));

const nickname = computed(() => (userStore.currentUser ?? authStore.currentUser)?.nickname ?? '');
const nameStep = computed(() => nickname.value
    ? t('shopPage.balance.stepBmcNameNick').replace('{nick}', nickname.value)
    : t('shopPage.balance.stepBmcName'));

const signIn = () => authStore.openDiscordAuth();

/* the steps sit open beside the balance on wide screens; on phones they fold away */
const wide = ref(true);
let query: MediaQueryList | null = null;
const sync = () => (wide.value = !!query?.matches);
onMounted(() => {
  query = window.matchMedia('(min-width: 761px)');
  sync();
  query.addEventListener('change', sync);
});
onUnmounted(() => query?.removeEventListener('change', sync));
</script>

<style scoped>
.shop-balance {
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  gap: clamp(20px, 3vw, 48px);
  align-items: start;
}

.shop-balance__own {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.shop-balance__amount {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: clamp(24px, 2.2vw, 30px);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.shop-balance__mark {
  width: 1em;
  height: 1em;
  color: var(--acc-ink);
}

.shop-balance__note {
  margin: 0;
  max-width: 40ch;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}

.shop-balance__actions {
  margin-top: 4px;
}

.shop-balance__summary {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  list-style: none;
}

summary.shop-balance__summary {
  cursor: pointer;
}

.shop-balance__summary::-webkit-details-marker {
  display: none;
}

.shop-balance__how-title {
  margin: 0;
  font-size: var(--arc-fs-body);
  font-weight: 600;
}

.shop-balance__summary i {
  color: var(--arc-muted);
  font-size: 13px;
  transition: transform .25s ease;
}

details.shop-balance__how[open] .shop-balance__summary i {
  transform: rotate(180deg);
}

.shop-balance__steps {
  margin-top: 6px;
  counter-reset: step;
}

.shop-balance__steps .arc-row {
  align-items: baseline;
  min-height: 0;
  padding: 10px 0;
  color: color-mix(in oklab, var(--arc-ink) 86%, var(--arc-muted));
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  counter-increment: step;
}

.shop-balance__steps .arc-row::before {
  flex: none;
  min-width: 1.4em;
  color: var(--acc-ink);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  content: counter(step);
}

.shop-balance__more {
  display: inline-block;
  margin-top: 8px;
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

@media (max-width: 760px) {
  .shop-balance {
    grid-template-columns: minmax(0, 1fr);
  }

  .shop-balance__how {
    padding-top: 14px;
    border-top: var(--arc-bw) solid var(--arc-line);
  }

  .shop-balance__summary {
    justify-content: space-between;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shop-balance__summary i {
    transition: none;
  }
}
</style>
