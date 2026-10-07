<template>
  <!--
    One slim bar above the items: the reader's balance and the way to add to it. How a
    top-up works (and who to ask when one doesn't arrive) opens under it on demand.
  -->
  <section class="shop-balance" aria-labelledby="shop-balance-title">
    <div class="shop-balance__bar">
      <!-- signed out, the sentence beside it says what the bar is for -->
      <h2 id="shop-balance-title" class="shop-balance__label" :class="{'arc-sr': !signedIn}">{{ t('shopPage.balance.heading') }}</h2>

      <template v-if="signedIn">
        <p class="shop-balance__amount">
          <IconMark class="shop-balance__mark" aria-hidden="true"/>
          <span>{{ amountLabel }}</span>
        </p>
        <a :href="topUpUrl" class="arc-btn arc-btn--solid arc-btn--sm shop-balance__btn" target="_blank" rel="noopener noreferrer">
          {{ t('shopPage.balance.topUp') }}
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          <span class="arc-sr">({{ t('shopPage.newTab') }})</span>
        </a>
      </template>

      <template v-else>
        <p class="shop-balance__note">{{ t('shopPage.balance.signedOut') }}</p>
        <button type="button" class="arc-btn arc-btn--solid arc-btn--sm shop-balance__btn" @click="signIn">
          {{ t('shopPage.balance.signIn') }}
        </button>
      </template>

      <div class="shop-balance__help">
        <button
            type="button"
            class="shop-balance__toggle"
            :aria-expanded="open"
            aria-controls="shop-balance-steps"
            @click="open = !open"
        >
          {{ t('shopPage.balance.howTitle') }}
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>
        <RouterLink :to="$lp('/help') + '#top-ups'" class="arc-link shop-balance__more is-wide">{{ t('shopPage.balance.more') }}</RouterLink>
      </div>
    </div>

    <p v-if="signedIn && needsSetup" class="shop-balance__setup">
      {{ setupText[0] }}<RouterLink :to="$lp('/profile')" class="arc-link">{{ t('shopPage.balance.setupLink') }}</RouterLink>{{ setupText[1] }}
    </p>

    <div v-show="open" id="shop-balance-steps" class="shop-balance__how">
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
      <!-- on wide screens this link already sits in the bar -->
      <RouterLink :to="$lp('/help') + '#top-ups'" class="arc-link shop-balance__more is-narrow">{{ t('shopPage.balance.more') }}</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
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

const open = ref(false);

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
</script>

<style scoped>
.shop-balance {
  border-radius: var(--arc-r-md);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.shop-balance__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 8px 8px 16px;
}

.shop-balance__label {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.shop-balance__amount {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.shop-balance__mark {
  width: 1em;
  height: 1em;
  color: var(--acc-ink);
}

.shop-balance__note {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.45;
}

.shop-balance__btn {
  min-height: 36px;
  padding-inline: 14px;
  font-size: 14px;
  box-shadow: none;
}

/* the reading help sits at the bar's far end */
.shop-balance__help {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.shop-balance__toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: none;
  color: var(--arc-ink);
  font: inherit;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  cursor: pointer;
}

.shop-balance__toggle:hover {
  color: var(--acc-ink);
}

.shop-balance__toggle i {
  color: var(--arc-muted);
  font-size: 11px;
  transition: transform .25s ease;
}

.shop-balance__toggle[aria-expanded="true"] i {
  transform: rotate(180deg);
}

.shop-balance__more {
  font-size: var(--arc-fs-small);
  font-weight: 600;
  white-space: nowrap;
}

.shop-balance__more.is-wide {
  margin-right: 8px;
}

.shop-balance__more.is-narrow {
  display: none;
}

.shop-balance__setup {
  margin: 0;
  padding: 0 16px 10px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.5;
}

.shop-balance__how {
  padding: 4px 16px 14px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.shop-balance__steps {
  counter-reset: step;
}

.shop-balance__steps .arc-row {
  align-items: baseline;
  min-height: 0;
  padding: 9px 0;
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

/* phones: the bar wraps into two short lines; the help link moves into the steps */
@media (max-width: 760px) {
  .shop-balance__bar {
    padding: 8px 8px 8px 14px;
    gap: 6px 12px;
  }

  .shop-balance__help {
    margin-left: -10px;
    flex-basis: 100%;
  }

  .shop-balance__note {
    flex: 1 1 200px;
  }

  .shop-balance__more.is-wide {
    display: none;
  }

  .shop-balance__more.is-narrow {
    display: inline-block;
    margin-top: 4px;
  }

  .shop-balance__setup,
  .shop-balance__how {
    padding-inline: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shop-balance__toggle i {
    transition: none;
  }
}
</style>
