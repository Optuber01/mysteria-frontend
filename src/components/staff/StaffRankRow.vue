<template>
  <section class="staff-rank" :aria-labelledby="headingId">
    <div class="staff-rank__head">
      <h2 :id="headingId" class="arc-h4">{{ rank.label }}</h2>
      <p class="staff-rank__count">{{ count }}</p>
      <p v-if="about" class="staff-rank__about">{{ about }}</p>
    </div>
    <ul class="staff-rank__members">
      <StaffMemberChip
          v-for="(member, index) in rank.members"
          :id="`${rank.key}-${index}`"
          :key="`${rank.key}-${member.nickname}`"
          :about="about"
          :member="member"
      />
    </ul>
  </section>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "@/composables/useI18n";
import StaffMemberChip from "./StaffMemberChip.vue";
import type {StaffRank} from "./staffRoster";

const props = defineProps<{rank: StaffRank}>();

const {t, plural} = useI18n();

const headingId = computed(() => `rank-${props.rank.key.toLowerCase()}`);
const count = computed(() => {
  const n = props.rank.members.length;
  return plural(n, {
    one: t('staffPage.count.one'),
    few: t('staffPage.count.few'),
    many: t('staffPage.count.many'),
  }).replace('{n}', String(n));
});
// What the rank does: our own translated line when we have one, else the backend's text.
const about = computed(() => {
  const key = `staffPage.ranks.${props.rank.key}`;
  const own = t(key);
  return own !== key ? own : props.rank.description;
});
</script>

<style scoped>
.staff-rank {
  display: grid;
  grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
  gap: 16px clamp(24px, 4vw, 64px);
  align-items: start;
  padding: var(--arc-group-gap) 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.staff-rank__head {
  display: grid;
  gap: 4px;
}

.staff-rank__count {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

.staff-rank__about {
  margin: 6px 0 0;
  max-width: 38ch;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}

.staff-rank__members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 760px) {
  .staff-rank {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
