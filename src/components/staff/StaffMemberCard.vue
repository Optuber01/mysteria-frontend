<template>
  <!-- The details behind a name. Opened by its chip; it holds nothing focusable. -->
  <div class="staff-card">
    <div class="staff-card__head">
      <StaffAvatar :url="member.avatarUrl" :name="member.nickname" :size="48" class="staff-card__avatar"/>
      <div class="staff-card__who">
        <p class="staff-card__name">{{ member.nickname }}</p>
        <p class="staff-card__tags">
          <span class="arc-tag arc-tag--acc">{{ member.position }}</span>
          <span v-if="member.also" class="arc-tag">{{ member.also }}</span>
        </p>
      </div>
    </div>

    <p v-if="about" class="staff-card__about">{{ about }}</p>

    <dl v-if="facts.length" class="staff-card__facts">
      <div v-for="fact in facts" :key="fact.label" class="staff-card__fact">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "@/composables/useI18n";
import StaffAvatar from "./StaffAvatar.vue";
import type {StaffEntry} from "./staffRoster";
import {formatDay, formatMonth, formatTenure} from "./staffTime";

const props = defineProps<{member: StaffEntry; about: string | null}>();

const {t, intlLocale} = useI18n();

const facts = computed(() => {
  const locale = intlLocale.value;
  const rows: {label: string; value: string}[] = [];
  const tenure = formatTenure(props.member.staffSince, locale);
  const since = formatMonth(props.member.staffSince, locale);
  const joined = formatDay(props.member.joinedAt, locale);
  if (tenure) rows.push({label: t('staffPage.card.staffFor'), value: tenure});
  if (since) rows.push({label: t('staffPage.card.staffSince'), value: since});
  if (joined) rows.push({label: t('staffPage.card.joined'), value: joined});
  return rows;
});
</script>

<style scoped>
.staff-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: var(--arc-r-md);
  background: var(--arc-surface);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 18px 44px -12px var(--arc-shadow-strong);
  color: var(--arc-ink);
  text-align: start;
}

.staff-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.staff-card__who {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.staff-card__name {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
  line-height: 1.2;
}

.staff-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.staff-card__about {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
}

.staff-card__facts {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-top: 12px;
  border-top: var(--arc-bw) solid var(--arc-line);
  font-size: var(--arc-fs-small);
}

.staff-card__fact {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 12px;
}

.staff-card__fact dt {
  color: var(--arc-muted);
}

.staff-card__fact dd {
  margin: 0 0 0 auto;
  font-weight: 600;
}
</style>
