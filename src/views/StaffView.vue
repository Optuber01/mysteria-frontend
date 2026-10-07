<template>
  <ArcPage :lede="t('staffPage.lede')" :title="t('footer.linkStaff')">
    <section aria-labelledby="staff-reach" class="arc-panel reach">
      <div class="reach__text">
        <h2 id="staff-reach" class="arc-h4">{{ t('staffPage.reach.title') }}</h2>
        <p class="arc-muted">{{ t('staffPage.reach.text') }}</p>
      </div>
      <div class="reach__actions">
        <a
            class="arc-btn arc-btn--solid arc-btn--sm"
            href="https://discord.com/invite/jc7GSxBWgb"
            rel="noopener noreferrer"
            target="_blank"
        >
          <IconDiscord aria-hidden="true" class="arc-btn__icon"/>
          {{ t('staffOrder.openTicket') }}
          <span class="arc-sr">{{ t('header.newTab') }}</span>
        </a>
        <router-link :to="$lp('/help#support')" class="arc-btn arc-btn--ghost arc-btn--sm">
          {{ t('staffPage.reach.howTo') }}
        </router-link>
      </div>
    </section>

    <ArcState v-if="loading" :text="t('loading')" kind="loading"/>

    <div v-else class="roster">
      <p v-if="snapshot" class="arc-muted roster__note">{{ t('staffPage.snapshotNote') }}</p>
      <StaffRankRow v-for="rank in ranks" :key="rank.key" :rank="rank"/>
    </div>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, provide, ref} from "vue";
import {useI18n} from "@/composables/useI18n";
import {breadcrumbLd, useSeo} from "@/composables/useSeo";
import {useAuthStore} from "@/stores/auth";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcState from "@/components/arcana/ArcState.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";
import StaffRankRow from "@/components/staff/StaffRankRow.vue";
import {STAFF_CARD} from "@/components/staff/staffCard";
import {groupByRank, type StaffEntry} from "@/components/staff/staffRoster";
import {STAFF_SNAPSHOT} from "@/components/staff/staffSnapshot";
import {fetchStaff} from "@/utils/api/staff";
import type {StaffMember} from "@/types/staff";

const {t} = useI18n();
const authStore = useAuthStore();

const members = ref<StaffMember[] | StaffEntry[]>([]);
const loading = ref(true);
const snapshot = ref(false);

const ranks = computed(() => groupByRank(members.value));

useSeo(() => ({
  title: t("footer.linkStaff"),
  description: t("staffPage.lede"),
  path: "/staff",
  jsonLd: [breadcrumbLd([{name: "Home", path: "/"}, {name: "Staff", path: "/staff"}])],
}));

/* One member card open at a time, shared by every chip (see staffCard.ts). */
const openId = ref<string | null>(null);
const pinned = ref(false);
provide(STAFF_CARD, {
  openId,
  pinned,
  open: (id, pin) => {
    openId.value = id;
    pinned.value = pin;
  },
  close: id => {
    if (id && openId.value !== id) return;
    openId.value = null;
    pinned.value = false;
  },
});

// Escape closes the open card wherever focus or the pointer is; a tap outside it does too.
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && openId.value) openId.value = null;
};
const onPointerDown = (event: PointerEvent) => {
  if (openId.value && !(event.target as Element | null)?.closest?.('.staff-chip.is-open')) openId.value = null;
};

/*
 * The live roster comes from the backend, so staff changes show up on their own. Until
 * the endpoint is public, visitors who aren't signed in get a 403; then (and on any other
 * failure) the page shows the snapshot with a quiet note.
 */
const controller = new AbortController();
const load = async () => {
  loading.value = true;
  try {
    const list = await fetchStaff(authStore.currentToken, controller.signal);
    if (!list.some(member => member.nickname)) throw new Error('members: empty');
    members.value = list;
    snapshot.value = false;
  } catch {
    if (controller.signal.aborted) return;
    members.value = STAFF_SNAPSHOT;
    snapshot.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onPointerDown);
  void load();
});

onBeforeUnmount(() => {
  controller.abort();
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('pointerdown', onPointerDown);
});
</script>

<style scoped>
.reach {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 32px;
}

.reach__text {
  display: grid;
  gap: 6px;
  max-width: 62ch;
}

.reach__text p {
  margin: 0;
}

.reach__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* the panel above sits close to the roster; the page's block gap is for whole sections */
.arc-page > .arc-shell > .reach + * {
  margin-top: var(--arc-head-gap);
}

.roster__note {
  margin: 0 0 var(--arc-group-gap);
  font-size: var(--arc-fs-small);
}

.roster > :last-child {
  border-bottom: var(--arc-bw) solid var(--arc-line);
}
</style>
