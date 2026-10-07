<template>
  <ArcPage :lede="t('rulesPage.lede')" :title="t('navRules')">
    <ArcTabs
        v-if="isPrivilegedUser"
        v-model="activeTab"
        :label="t('navRules')"
        :tabs="tabs"
        controls="rules-panel"
    />

    <div class="arc-split">
      <ArcToc :current="activeId" :groups="tocGroups" :label="t('tableOfContents')"/>

      <div
          id="rules-panel"
          :aria-label="isPrivilegedUser ? tabs.find(tab => tab.id === activeTab)?.label : undefined"
          :role="isPrivilegedUser ? 'tabpanel' : undefined"
          class="rules"
      >
        <!-- Player rules -->
        <template v-if="activeTab === 'player'">
          <section
              v-for="chapter in chapters"
              :id="`law-${chapter.id}`"
              :key="chapter.id"
              :aria-labelledby="`law-${chapter.id}-title`"
              class="chapter"
              data-spy
          >
            <header class="chapter__head">
              <h2 :id="`law-${chapter.id}-title`" class="arc-h3">
                <span class="chapter__mark">{{ chapter.id }}</span>
                {{ chapter.title }}
              </h2>
              <p v-if="chapter.content" class="chapter__intro">{{ chapter.content }}</p>
            </header>

            <ul class="arc-rows">
              <li
                  v-for="rule in chapter.rules"
                  :id="`rule-${rule.id}`"
                  :key="rule.id"
                  class="arc-row rule"
              >
                <a :href="`#rule-${rule.id}`" class="rule__id">{{ rule.id }}</a>

                <div class="rule__body">
                  <h3 class="rule__title">{{ rule.title }}</h3>
                  <p>{{ rule.content }}</p>

                  <div v-if="rule.ladder && openLadder.has(rule.id)" :id="`ladder-${rule.id}`" class="arc-table-wrap ladder">
                    <table class="arc-table">
                      <caption class="arc-sr">{{ t('rulesPage.ladderHeading') }}</caption>
                      <thead>
                      <tr>
                        <th scope="col">{{ t('rulesPage.ladderCase') }}</th>
                        <th scope="col">{{ t('rulesPage.ladderCost') }}</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="(step, index) in rule.ladder" :key="index">
                        <td>{{ step.case }}</td>
                        <td :class="['ladder__cost', `tone-${toneFor(step.warns)}`]">{{ warnLabel(step.warns) }}</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div v-if="hasCost(rule)" class="rule__cost">
                  <button
                      v-if="rule.ladder"
                      :aria-controls="`ladder-${rule.id}`"
                      :aria-expanded="openLadder.has(rule.id)"
                      :class="['arc-tag', 'cost', 'cost--button', `tone-${toneFor(headlineWarns(rule))}`]"
                      type="button"
                      @click="toggleLadder(rule.id)"
                  >
                    {{ costLabel(rule) }}
                    <span class="arc-sr">{{ t('rulesPage.ladderHeading') }}</span>
                    <i aria-hidden="true" class="fa-solid fa-chevron-down cost__chevron"></i>
                  </button>
                  <span v-else :class="['arc-tag', 'cost', `tone-${toneFor(headlineWarns(rule))}`]">
                    {{ costLabel(rule) }}
                  </span>
                </div>
              </li>
            </ul>
          </section>

          <aside class="arc-panel appeal">
            <p>{{ t('rulesPage.appeals') }}</p>
            <a
                :href="DISCORD_INVITE"
                class="arc-btn arc-btn--ghost arc-btn--sm"
                rel="noopener noreferrer"
                target="_blank"
            >
              <IconDiscord aria-hidden="true" class="arc-btn__icon"/>
              {{ t('staffOrder.openTicket') }}
              <span class="arc-sr">{{ t('header.newTab') }}</span>
            </a>
          </aside>
        </template>

        <!-- Staff code -->
        <template v-else>
          <section
              v-for="(group, index) in staffRules"
              :id="`law-staff-${index}`"
              :key="group.group"
              :aria-labelledby="`law-staff-${index}-title`"
              class="chapter"
              data-spy
          >
            <header class="chapter__head">
              <h2 :id="`law-staff-${index}-title`" class="arc-h3">
                <span class="chapter__mark">{{ index + 1 }}</span>
                {{ group.group }}
              </h2>
            </header>

            <ul class="arc-rows">
              <li
                  v-for="rule in group.rules"
                  :id="`staff-rule-${rule.id}`"
                  :key="rule.id"
                  class="arc-row rule rule--plain"
              >
                <a :href="`#staff-rule-${rule.id}`" class="rule__id">{{ rule.id }}</a>
                <div class="rule__body">
                  <h3 class="rule__title">{{ rule.title }}</h3>
                  <p>{{ rule.content }}</p>
                  <p v-if="rule.examples" class="rule__examples">
                    <strong>{{ t('examples') }}</strong>
                    {{ rule.examples }}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>

    <DailyBonusCat page="rules"/>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from "@/composables/useI18n";
import {breadcrumbLd, useSeo} from "@/composables/useSeo";
import {useAuthStore} from "@/stores/auth";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcTabs from "@/components/arcana/ArcTabs.vue";
import ArcToc, {type TocGroup} from "@/components/arcana/ArcToc.vue";
import DailyBonusCat from "@/components/ui/DailyBonusCat.vue";
import IconDiscord from "@/assets/icons/IconDiscord.vue";

const {t, tree, plural, currentLanguage} = useI18n();
const authStore = useAuthStore();
const route = useRoute();

const DISCORD_INVITE = 'https://discord.com/invite/jc7GSxBWgb';

/*
 * A rule costs warnings, and warnings are the only scale on the page: they run
 * 1 to 8, and 8 is a permanent ban from both platforms. That is why nothing here
 * carries a separate "instant ban" category - an offence that ends it on the
 * spot is simply worth 8.
 *
 * A rule that has to cover both a careless mistake and a deliberate campaign
 * carries a `ladder` instead of a flat cost, and the tag then shows the range
 * rather than one number. The ladder is the source of truth for those: deriving
 * the tag from it means the headline can never drift from the breakdown.
 */
interface LadderStep {
  case: string
  warns: number
}

interface Rule {
  id: string
  title: string
  content: string
  examples?: string
  warns?: number
  ladder?: LadderStep[]
}

interface StaffRuleGroup {
  group: string
  rules: Rule[]
}

interface Chapter {
  id: string
  title: string
  content: string
  rules: Rule[]
}

const rules = ref<Rule[]>([]);
const staffRules = ref<StaffRuleGroup[]>([]);
const activeId = ref<string>('');

const isPrivilegedUser = computed(() => {
  const role = authStore.userRole?.toUpperCase();
  return Boolean(role) && role !== 'MEMBER' && role !== 'PLAYER' && role !== 'USER';
});

const activeTab = ref<string>('player');
const tabs = computed(() => [
  {id: 'player', label: t('playerRules')},
  {id: 'staff', label: t('staffRules')},
]);

useSeo(() => ({
  title: t('navRules'),
  description: t('rulesPage.lede'),
  path: '/rules',
  // The staff code is gated content and must never be the indexed version.
  noindex: activeTab.value === 'staff',
  jsonLd: [breadcrumbLd([{name: 'Home', path: '/'}, {name: 'Rules', path: '/rules'}])],
}));

const chapters = computed<Chapter[]>(() => {
  const grouped: Chapter[] = [];
  for (const rule of rules.value) {
    if (!rule.id.includes('.')) {
      grouped.push({id: rule.id, title: rule.title, content: rule.content, rules: []});
    } else {
      grouped[grouped.length - 1]?.rules.push(rule);
    }
  }
  return grouped;
});

/* Chapters only: the rules inside them are reached by their own #rule-x.y links. */
const tocGroups = computed<TocGroup[]>(() => [{
  items: activeTab.value === 'staff'
      ? staffRules.value.map((group, index) => ({id: `law-staff-${index}`, label: group.group, mark: String(index + 1)}))
      : chapters.value.map(chapter => ({id: `law-${chapter.id}`, label: chapter.title, mark: chapter.id})),
}]);

const PERMANENT = 8;

const hasCost = (rule: Rule) => rule.warns !== undefined || Boolean(rule.ladder);

const warnsIn = (rule: Rule) => rule.ladder?.map(step => step.warns) ?? [];

/** The number the tag is coloured by: the worst outcome the rule allows. */
const headlineWarns = (rule: Rule) =>
    rule.ladder ? Math.max(...warnsIn(rule)) : rule.warns ?? 0;

const warnWord = (count: number) =>
    plural(count, tree<{ one: string; few: string; many: string }>('rulesPage.warnForms'));

const countLabel = (count: number) =>
    count === 0 ? t('rulesPage.noWarning') : `${count} ${warnWord(count)}`;

/** The full outcome, permanence spelled out. */
const warnLabel = (count: number) =>
    count >= PERMANENT ? `${countLabel(count)} · ${t('rulesPage.permanent')}` : countLabel(count);

const costLabel = (rule: Rule) => {
  if (!rule.ladder) return warnLabel(rule.warns ?? 0);

  const counts = warnsIn(rule);
  const low = Math.min(...counts);
  const high = Math.max(...counts);
  if (low === high) return warnLabel(high);

  // An en dash, not "to": the range has to survive translation without a word.
  return `${low}–${high} ${warnWord(high)}`;
};

const toneFor = (count: number) => {
  if (count === 0) return 'none';
  if (count >= PERMANENT) return 'permanent';
  if (count >= 5) return 'severe';
  if (count >= 3) return 'major';
  return 'minor';
};

const openLadder = ref<Set<string>>(new Set());
const toggleLadder = (id: string) => {
  const next = new Set(openLadder.value);
  if (!next.delete(id)) next.add(id);
  openLadder.value = next;
};

/*
 * Which chapter the reader is in. An observer on a band near the top of the
 * viewport replaces a scroll listener: it reports changes only, never per frame.
 */
let observer: IntersectionObserver | null = null;
const inBand = new Set<string>();

const watchChapters = async () => {
  observer?.disconnect();
  inBand.clear();
  activeId.value = '';
  await nextTick();
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) inBand.add(entry.target.id);
      else inBand.delete(entry.target.id);
    }
    const first = tocGroups.value[0].items.find(item => inBand.has(item.id));
    if (first) activeId.value = first.id;
  }, {rootMargin: '-140px 0px -55% 0px'});
  document.querySelectorAll('[data-spy]').forEach(el => observer?.observe(el));
};

/* Rules arrive asynchronously: a #rule-x.y link waits for them, then scrolls. */
let hashDone = false;
const scrollToHash = async () => {
  if (hashDone || !route.hash) return;
  await nextTick();
  const target = document.getElementById(decodeURIComponent(route.hash.slice(1)));
  if (!target) return;
  hashDone = true;
  target.scrollIntoView({block: 'start'});
};

const loadRulesForLanguage = async (lang: string) => {
  try {
    const module = await import(`@/assets/sources/rules_${lang}.json`);
    rules.value = module.default as Rule[];
  } catch {
    try {
      const module = await import('@/assets/sources/rules_en.json');
      rules.value = module.default as Rule[];
    } catch {
      rules.value = [];
    }
  }
};

const loadStaffRulesForLanguage = async (lang: string) => {
  if (!isPrivilegedUser.value) {
    staffRules.value = [];
    return;
  }
  try {
    const module = await import(`@/assets/sources/staff_rules_${lang}.json`);
    staffRules.value = module.default as StaffRuleGroup[];
  } catch {
    try {
      const module = await import('@/assets/sources/staff_rules_en.json');
      staffRules.value = module.default as StaffRuleGroup[];
    } catch {
      staffRules.value = [];
    }
  }
};

onMounted(() => {
  const tabQuery = route.query.tab as string | undefined;
  if (tabQuery === 'staff' || tabQuery === 'player') activeTab.value = tabQuery;
  void loadStaffRulesForLanguage(currentLanguage.value);
  void loadRulesForLanguage(currentLanguage.value).then(scrollToHash);
});

onUnmounted(() => observer?.disconnect());

watch([() => tocGroups.value[0].items.length, activeTab], () => {
  void watchChapters().then(scrollToHash);
});

watch(activeTab, () => (activeId.value = ''));

watch(currentLanguage, lang => {
  void loadRulesForLanguage(lang);
  void loadStaffRulesForLanguage(lang);
});

watch(isPrivilegedUser, privileged => {
  void loadStaffRulesForLanguage(currentLanguage.value);
  if (!privileged) activeTab.value = 'player';
});
</script>

<style scoped>
.rules {
  display: grid;
  gap: clamp(40px, 4vw, 64px);
  min-width: 0;
}

.chapter {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 16px);
}

.chapter__head {
  display: grid;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 16px;
  border-bottom: var(--arc-bw-accent) solid var(--arc-line-acc);
}

.chapter__head h2 {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.chapter__mark {
  min-width: 1.1em;
  color: var(--acc-ink);
  font-variant-numeric: tabular-nums;
}

.chapter__intro {
  margin: 0;
  max-width: var(--arc-measure);
  color: var(--arc-muted);
  line-height: 1.6;
}

.rule {
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) auto;
  gap: 8px 18px;
  align-items: start;
  padding: 20px 0;
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 16px);
}

.rule--plain {
  grid-template-columns: 3.4rem minmax(0, 1fr);
}

.rule:target .rule__title {
  color: var(--acc-ink);
}

.rule__id {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  color: var(--acc-ink);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  text-decoration: none;
}

.rule__id:hover {
  text-decoration: underline;
  text-underline-offset: .2em;
}

.rule__title {
  margin: 0 0 6px;
  font-size: var(--arc-fs-body);
  font-weight: 650;
  line-height: 1.35;
}

.rule__body p {
  margin: 0;
  max-width: var(--arc-measure);
  color: var(--arc-muted);
  line-height: 1.65;
}

.rule__body p + p {
  margin-top: 12px;
}

.rule__examples {
  padding-left: 14px;
  border-left: var(--arc-bw-accent) solid var(--arc-line-acc);
}

.rule__examples strong {
  display: block;
  margin-bottom: 2px;
  color: var(--arc-ink);
  font-size: var(--arc-fs-caption);
}

.rule__cost {
  display: flex;
  justify-content: flex-end;
}

/* a cost tag: the colour says how heavy, the words say it again */
.cost {
  min-height: 28px;
}

.cost--button {
  border: 0;
  cursor: pointer;
  font-family: inherit;
}

.cost--button:hover {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.cost__chevron {
  font-size: 11px;
  transition: transform .2s ease;
}

.cost--button[aria-expanded="true"] .cost__chevron {
  transform: rotate(180deg);
}

.tone-minor,
.tone-major {
  color: var(--arc-warn);
}

.tone-severe,
.tone-permanent {
  color: var(--arc-bad);
}

/* a tinted ground needs a deeper ink than the plain red to hold 4.5:1 on paper */
.tone-permanent {
  color: color-mix(in oklab, var(--arc-bad) 70%, var(--arc-ink));
  background: color-mix(in oklab, var(--arc-bad) 12%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--arc-bad) 55%, transparent);
}

.ladder {
  max-width: 520px;
  margin-top: 14px;
}

.ladder__cost {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.appeal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.appeal p {
  margin: 0;
}

@media (max-width: 640px) {
  .rule {
    grid-template-columns: 2.8rem minmax(0, 1fr);
    gap: 8px 12px;
  }

  .rule__cost {
    grid-column: 2;
    justify-content: flex-start;
  }

  .chapter__head h2 {
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cost__chevron {
    transition: none;
  }
}
</style>
