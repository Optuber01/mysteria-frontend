<template>
  <ArcPage :lede="t('staffOrder.lede')" :title="t('footer.linkStaff')">
    <ArcState v-if="loading" kind="loading" :text="t('loading')"/>

    <div v-else class="staff">
      <p v-if="snapshot" class="arc-muted snapshot">{{ t('staffPage.snapshotNote') }}</p>

      <section
          v-for="(group, groupIndex) in memberGroups"
          :key="group.position"
          :aria-labelledby="`rank-${groupIndex}`"
      >
        <header class="rank__head">
          <h2 :id="`rank-${groupIndex}`" class="arc-h3">{{ group.position }}</h2>
        </header>

        <ul class="arc-panel arc-grid members">
          <li v-for="member in group.members" :key="`${group.position}-${member.nickname}`" class="member">
            <img
                v-if="member.avatarUrl"
                :alt="member.nickname"
                :src="member.avatarUrl"
                class="member__avatar"
                height="48"
                loading="lazy"
                referrerpolicy="no-referrer"
                width="48"
            >
            <span v-else aria-hidden="true" class="member__avatar member__initial">
              {{ member.nickname.charAt(0).toUpperCase() }}
            </span>
            <span class="member__text">
              <span class="member__name">{{ member.nickname }}</span>
              <span v-if="member.also" class="arc-muted member__also">{{ member.also }}</span>
            </span>
          </li>
        </ul>
      </section>
    </div>

    <aside class="arc-panel help">
      <p>{{ t('staffOrder.helpQuestion') }}</p>
      <a
          class="arc-btn arc-btn--ghost arc-btn--sm"
          href="https://discord.com/invite/jc7GSxBWgb"
          rel="noopener noreferrer"
          target="_blank"
      >
        <IconDiscord aria-hidden="true" class="arc-btn__icon"/>
        {{ t('staffOrder.openTicket') }}
        <span class="arc-sr">{{ t('header.newTab') }}</span>
      </a>
    </aside>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "@/composables/useI18n";
import {breadcrumbLd, useSeo} from "@/composables/useSeo";
import {useAuthStore} from "@/stores/auth";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcState from "@/components/arcana/ArcState.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";
import type {StaffMember} from "@/types/staff";

type ListedMember = StaffMember & {also?: string};

const {t} = useI18n();
const authStore = useAuthStore();

/*
 * The live list needs a signed-in account (the API answers 403 to everyone else), so
 * visitors get this snapshot of the Discord staff roles, taken 2026-10-07, until the
 * endpoint is made public. Ranks run from the top down; names are Discord usernames.
 */
const SNAPSHOT: ListedMember[] = [
  {position: 'Owner', nickname: 'ikeepca1m'},
  {position: 'Leader', nickname: 'king_julien26'},
  {position: 'Developer', nickname: 'djecka1337'},
  {position: 'Developer', nickname: 'farmerjoe6262'},
  {position: 'Developer', nickname: 'optuber'},
  {position: 'Developer', nickname: 'ikeabird1', also: 'Eventer'},
  {position: 'Emissary', nickname: 'tythecanasian'},
  {position: 'Emissary', nickname: 'just_linaaa'},
  {position: 'Emissary', nickname: 'curativeflame70', also: 'Translator'},
  {position: 'Herald', nickname: 'canblisticchicn'},
  {position: 'Herald', nickname: 'thecoolaids'},
  {position: 'Herald', nickname: 'petrichormoths'},
  {position: 'Herald', nickname: 'sashimi0628'},
  {position: 'Designer', nickname: 'librarianoflotm'},
  {position: 'Translator', nickname: 'roidelle4250'},
  {position: 'Translator', nickname: 'ahealex', also: 'Tester'},
  ...['_a_ce', 'chamonile', 'sombie.', '.moistjesus', 'phillip3235', 'delicousriceeater', '.taygan.', 'einlumian',
    'penguins5997', 'lesouth03', 'fish713', 'sick_weeb'].map(nickname => ({position: 'Tester', nickname})),
].map(member => ({avatarUrl: null, ...member}));

const members = ref<ListedMember[]>([]);
const loading = ref(true);
const snapshot = ref(false);

useSeo(() => ({
  title: t("footer.linkStaff"),
  description: t("staffOrder.lede"),
  path: "/staff",
  jsonLd: [breadcrumbLd([{name: "Home", path: "/"}, {name: "Staff", path: "/staff"}])],
}));

interface MemberGroup {
  position: string;
  members: ListedMember[];
}

const memberGroups = computed<MemberGroup[]>(() => {
  const groups: MemberGroup[] = [];
  for (const member of members.value) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.position === member.position) {
      lastGroup.members.push(member);
    } else {
      groups.push({position: member.position, members: [member]});
    }
  }
  return groups;
});

/*
 * The shared API client would raise an error toast on the 403 on top of the page,
 * so this asks for the list directly and falls back to the snapshot on any failure.
 */
const load = async () => {
  loading.value = true;
  try {
    const token = authStore.currentToken;
    const response = await fetch('/api/members?minPriority=4', {
      headers: {Accept: 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
    });
    if (!response.ok) throw new Error(`members ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error('members: empty');
    members.value = data as StaffMember[];
    snapshot.value = false;
  } catch {
    members.value = SNAPSHOT;
    snapshot.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.staff {
  display: grid;
  gap: var(--arc-block-gap);
}

.rank__head {
  margin-bottom: var(--arc-group-gap);
}

.members {
  --arc-grid-min: 250px;
  margin: 0;
  list-style: none;
}

.member {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.member__avatar {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: var(--arc-r-md);
  object-fit: cover;
  background: var(--arc-glass);
}

.member__initial {
  display: grid;
  place-items: center;
  color: var(--acc-ink);
  font-size: var(--arc-fs-h4);
  font-weight: 600;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.member__text {
  display: grid;
  min-width: 0;
}

.member__name {
  overflow-wrap: anywhere;
  font-weight: 600;
}

.member__also {
  font-size: var(--arc-fs-caption);
}

.snapshot {
  margin: 0 0 var(--arc-group-gap);
  font-size: var(--arc-fs-small);
}

.help {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.help p {
  margin: 0;
}
</style>
