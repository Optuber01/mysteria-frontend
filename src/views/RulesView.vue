<template>
  <HeaderItem/>
  <main id="main-content" class="covenant-page" tabindex="-1">
    <!-- Atmospheric Overlay -->
    <div class="ink-mist" aria-hidden="true"></div>

    <div class="covenant-container">
      <SectionTitle
          :eyebrow="currentLanguage === 'uk' ? 'Правила спільноти' : 'Community covenant'"
          :subtitle="currentLanguage === 'uk'
            ? 'Основні правила чесної та доброзичливої гри на Mysterria.'
            : 'The essential rules for fair and respectful play on Mysterria.'"
          :title="currentLanguage === 'uk' ? 'Правила Mysterria' : 'Mysterria Rules'"
          variant="covenant"
      />

      <div v-if="isPrivilegedUser" class="covenant-header">
        <!-- Tab Ritual -->
        <div :aria-label="rulesLabels.ruleSet" class="tab-ritual" role="group">
          <button
              :class="{ active: activeTab === 'player' }"
              :aria-pressed="activeTab === 'player'"
              class="ritual-tab"
              type="button"
              @click="setActiveTab('player')"
          >
            <span class="ritual-label">{{ t('playerRules') }}</span>
          </button>
          <button
              v-if="isPrivilegedUser"
              :class="{ active: activeTab === 'staff' }"
              :aria-pressed="activeTab === 'staff'"
              class="ritual-tab"
              type="button"
              @click="setActiveTab('staff')"
          >
            <span class="ritual-label">{{ t('staffRules') }}</span>
          </button>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="covenant-content">
        <!-- Rules table of contents -->
        <aside class="covenant-sidebar no-scrollbar">
          <div class="sidebar-frame">
            <div class="sidebar-heading">
              <div>
                <span class="sidebar-kicker">{{ rulesLabels.jumpLabel }}</span>
                <h2 id="rules-jump-heading" class="sidebar-title">{{ t('tableOfContents') }}</h2>
              </div>
              <button
                  :aria-expanded="isJumpNavOpen"
                  aria-controls="rules-jump-nav"
                  class="jump-nav-toggle"
                  type="button"
                  @click="isJumpNavOpen = !isJumpNavOpen"
              >
                {{ isJumpNavOpen ? rulesLabels.hideContents : activeRuleCount }} {{ isJumpNavOpen ? '' : rulesLabels.sections }}
                <span aria-hidden="true" :class="{ open: isJumpNavOpen }">⌄</span>
              </button>
            </div>
            <div class="sidebar-divider"></div>
            
            <nav id="rules-jump-nav" :class="{ 'is-open': isJumpNavOpen }" aria-labelledby="rules-jump-heading" class="covenant-nav">
              <ol v-if="activeTab === 'player'" class="nav-list">
                <li v-for="rule in rules" :key="rule.id">
                  <a
                    :href="`#${ruleTargetId(rule.id)}`"
                    class="covenant-nav-item"
                    @click="jumpToRule($event, rule.id)"
                >
                  <span class="nav-id">{{ rule.id }}</span>
                  <span class="nav-text">{{ rule.title }}</span>
                  </a>
                </li>
              </ol>

              <div v-else-if="activeTab === 'staff'" class="nav-groups">
                <div
                    v-for="group in staffRules"
                    :key="group.group"
                    class="nav-group"
                >
                  <h3 class="nav-group-header">{{ group.group }}</h3>
                  <a
                      v-for="rule in group.rules"
                      :key="rule.id"
                      :href="`#${ruleTargetId(rule.id, true)}`"
                      class="covenant-nav-item staff-item"
                      @click="jumpToRule($event, rule.id, true)"
                  >
                    <span class="nav-id">{{ rule.id }}</span>
                    <span class="nav-text">{{ rule.title }}</span>
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        <!-- Main Scroll Area -->
        <div class="covenant-main">
          <!-- Player Rules -->
          <div v-if="activeTab === 'player'" class="rule-ledger">
            <div
                v-for="rule in rules"
                :key="rule.id"
                class="ledger-card"
            >
              <div class="card-num-area">
                <div class="card-num">{{ rule.id }}</div>
                <div class="card-num-line"></div>
              </div>
              <div class="card-body">
                <h3 :id="ruleTargetId(rule.id)" class="card-title" tabindex="-1">{{ rule.title }}</h3>
                <p class="card-text">{{ rule.content }}</p>
              </div>
            </div>
          </div>

          <!-- Staff Rules -->
          <div v-else-if="activeTab === 'staff'" class="staff-ledger">
            <div
                v-for="(group, groupIndex) in staffRules"
                :key="groupIndex"
                class="group-section"
            >
              <div class="group-banner">
                <h3 class="banner-title">{{ group.group }}</h3>
                <div class="banner-line"></div>
              </div>
              
              <div class="group-entries">
                <div
                    v-for="rule in group.rules"
                    :key="rule.id"
                    class="ledger-card staff-card"
                >
                  <div class="card-num-area">
                    <div class="card-num">{{ rule.id }}</div>
                  </div>
                  <div class="card-body">
                    <h4 :id="ruleTargetId(rule.id, true)" class="card-title" tabindex="-1">{{ rule.title }}</h4>
                    <p class="card-text">{{ rule.content }}</p>
                    <div v-if="rule.examples" class="card-examples">
                      <span class="ex-label">{{ t('examples') }}:</span>
                      <p class="ex-text">{{ rule.examples }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <FooterItem/>
  <DailyBonusCat page="rules"/>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from "@/composables/useI18n";
import {useAuthStore} from "@/stores/auth";
import HeaderItem from "@/components/layout/HeaderItem.vue";
import FooterItem from "@/components/layout/FooterItem.vue";
import DailyBonusCat from "@/components/ui/DailyBonusCat.vue";
import SectionTitle from "@/components/ui/SectionTitle.vue";
import {preferredScrollBehavior} from '@/utils/motion';

const {t, currentLanguage} = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

interface Rule {
  id: string
  title: string
  content: string
  examples?: string
}

interface StaffRuleGroup {
  group: string
  rules: Rule[]
}

const rules = ref<Rule[]>([])
const staffRules = ref<StaffRuleGroup[]>([])

const isPrivilegedUser = computed(() => {
  const role = authStore.userRole?.toUpperCase()
  return role && role !== 'MEMBER' && role !== 'PLAYER' && role !== 'USER'
})

const activeTab = ref<'player' | 'staff'>('player')
const wantsStaffTab = computed(() => route.query.tab === 'staff' || route.hash.startsWith('#staff-rule-'))
const isJumpNavOpen = ref(false)
const rulesLabels = computed(() => currentLanguage.value === 'uk' ? {
  ruleSet: 'Набір правил', jumpLabel: 'На цій сторінці', showContents: 'Розділи', hideContents: 'Сховати', sections: 'розділів'
} : {
  ruleSet: 'Rule set', jumpLabel: 'On this page', showContents: 'Sections', hideContents: 'Hide', sections: 'sections'
})
const activeRuleCount = computed(() => activeTab.value === 'player' ? rules.value.length : staffRules.value.reduce((total, group) => total + group.rules.length, 0))

const setActiveTab = (tab: 'player' | 'staff') => {
  if (tab === 'staff' && !isPrivilegedUser.value) return
  activeTab.value = tab
  isJumpNavOpen.value = false
  void router.replace({query: {...route.query, tab}})
}

const ruleTargetId = (ruleId: string, staff = false) => `${staff ? 'staff-rule' : 'rule'}-${ruleId.replace(/\./g, '-')}`

const jumpToRule = async (event: MouseEvent, ruleId: string, staff = false) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  isJumpNavOpen.value = false
  await nextTick()
  const targetId = ruleTargetId(ruleId, staff)
  window.history.pushState(null, '', `#${targetId}`)
  const element = document.getElementById(targetId)
  if (element) {
    element.scrollIntoView({behavior: preferredScrollBehavior(), block: 'start'})
    element.focus({preventScroll: true})
  }
}

const focusRouteHash = () => {
  if (!route.hash) return
  const target = document.getElementById(decodeURIComponent(route.hash.slice(1)))
  if (!target) return
  target.scrollIntoView({behavior: preferredScrollBehavior(), block: 'start'})
  target.focus({preventScroll: true})
}

const loadRulesForLanguage = async (lang: string) => {
  try {
    const rulesModule = await import(`@/assets/sources/rules_${lang}.json`)
    rules.value = rulesModule.default as Rule[]
  } catch {
    try {
      const rulesModule = await import('@/assets/sources/rules_en.json')
      rules.value = rulesModule.default as Rule[]
    } catch {
      rules.value = []
    }
  } finally {
    await nextTick()
    focusRouteHash()
  }
}

const loadStaffRulesForLanguage = async (lang: string) => {
  if (!isPrivilegedUser.value) {
    staffRules.value = []
    return
  }
  try {
    const staffRulesModule = await import(`@/assets/sources/staff_rules_${lang}.json`)
    staffRules.value = staffRulesModule.default as StaffRuleGroup[]
  } catch {
    try {
      const staffRulesModule = await import('@/assets/sources/staff_rules_en.json')
      staffRules.value = staffRulesModule.default as StaffRuleGroup[]
    } catch {
      staffRules.value = []
    }
  } finally {
    await nextTick()
    focusRouteHash()
  }
}

onMounted(() => {
  const tabQuery = route.query.tab as string | undefined
  if (tabQuery === 'player') activeTab.value = 'player'
  else if (wantsStaffTab.value && isPrivilegedUser.value) activeTab.value = 'staff'
  loadRulesForLanguage(currentLanguage.value)
  loadStaffRulesForLanguage(currentLanguage.value)
})

watch(currentLanguage, (newLang) => {
  loadRulesForLanguage(newLang)
  loadStaffRulesForLanguage(newLang)
})

watch(isPrivilegedUser, (hasAccess) => {
  if (hasAccess && wantsStaffTab.value) activeTab.value = 'staff'
  if (!hasAccess && activeTab.value === 'staff') activeTab.value = 'player'
  loadStaffRulesForLanguage(currentLanguage.value)
})
</script>

<style scoped>
/* COVENANT PAGE AESTHETIC */

.covenant-page {
  position: relative;
  background-color: #080a14;
  padding: 120px 0 80px;
  color: #e0e0e0;
}

.ink-mist {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(200, 178, 115, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.covenant-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  position: relative;
  z-index: 2;
}

/* Header & Tab Ritual */
.covenant-header {
  text-align: center;
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-ritual {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.ritual-tab {
  background: none;
  border: none;
  padding: 12px 32px;
  color: #b0adb0;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
  position: relative;
}

.ritual-tab:hover { color: #aaa; }
.ritual-tab.active {
  color: var(--myst-gold);
  background: rgba(200, 178, 115, 0.1);
}

.ritual-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; width: 100%; height: 2px;
  background: var(--myst-gold);
  box-shadow: 0 0 10px var(--myst-gold);
}

/* Two Column Content */
.covenant-content {
  display: flex;
  gap: 64px;
  align-items: flex-start;
}

/* Sidebar */
.covenant-sidebar {
  flex: 0 0 340px;
  position: sticky;
  top: 120px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  padding-right: 20px;
  z-index: 10;
}

.sidebar-frame {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 32px;
  border-radius: var(--radius-lg);
}

.sidebar-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.sidebar-kicker { display: block; margin-bottom: 4px; color: var(--myst-gold); font: 700 11px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; }
.jump-nav-toggle { display: none; min-height: 44px; padding: 0 12px; align-items: center; gap: 8px; border: 1px solid rgba(200, 178, 115, .25); border-radius: var(--radius-md); background: transparent; color: #e8e2d7; font: 700 13px var(--font-ui); cursor: pointer; }
.jump-nav-toggle span { transition: transform var(--motion-fast) var(--ease-standard); }
.jump-nav-toggle span.open { transform: rotate(180deg); }

.sidebar-title {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--myst-offwhite);
  margin: 0;
  text-align: left;
}

.sidebar-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--myst-gold), transparent);
  margin-bottom: 32px;
}

.covenant-nav { display: flex; flex-direction: column; gap: 8px; }
.nav-list { list-style: none; margin: 0; padding: 0; }

.covenant-nav-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-standard), border-left-color var(--motion-base) var(--ease-standard);
  border-left: 2px solid transparent;
  border-radius: var(--radius-md);
  min-height: 44px;
  width: 100%;
}

.covenant-nav-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-left-color: var(--myst-gold);
}

.nav-id {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--myst-gold);
  font-weight: 700;
  min-width: 24px;
}

.nav-text {
  font-size: 13px;
  color: #aaa7aa;
  transition: color var(--motion-base) var(--ease-standard);
}

.covenant-nav-item:hover .nav-text { color: var(--myst-offwhite); }

.nav-group-header {
  font-family: var(--font-ui);
  font-size: 11px;
  color: #8f8c90;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 32px 0 16px;
  padding-left: 12px;
}

/* Main Ledger */
.covenant-main { flex: 1; min-width: 0; }

.rule-ledger, .group-entries {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.ledger-card {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 32px;
}

.card-num-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-num {
  font-family: var(--font-ui);
  font-size: 24px;
  font-weight: 800;
  color: var(--myst-gold);
  background: rgba(0, 0, 0, 0.4);
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(200, 178, 115, 0.2);
  border-radius: var(--radius-md);
}

.card-num-line {
  flex: 1;
  width: 1px;
  background: linear-gradient(180deg, rgba(200, 178, 115, 0.3), transparent);
  margin-top: 16px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--myst-offwhite);
  margin: 0 0 16px;
  font-weight: 700;
  scroll-margin-top: 104px;
}

.card-text {
  font-size: 16px;
  line-height: 1.7;
  color: #aaa;
  max-width: 72ch;
}

/* Staff Specific */
.group-banner {
  margin-bottom: 48px;
  position: relative;
}

.banner-title {
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--myst-gold);
  text-transform: uppercase;
  letter-spacing: 8px;
  margin-bottom: 16px;
}

.banner-line {
  height: 1px;
  background: linear-gradient(90deg, var(--myst-gold), transparent);
}

.card-examples {
  margin-top: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 2px solid #444;
  border-radius: var(--radius-lg);
}

.ex-label {
  font-family: var(--font-ui);
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
}

.ex-text {
  font-size: 14px;
  font-style: italic;
  color: #888;
  margin: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .covenant-content { gap: 40px; }
  .covenant-sidebar { flex: 0 0 300px; }
}

@media (max-width: 1024px) {
  .covenant-content { flex-direction: column; }
  .covenant-sidebar { 
    position: static; 
    flex: none; 
    width: 100%; 
    max-height: none;
    order: -1;
    padding-right: 0;
    overflow: visible;
  }
  .covenant-nav {
    display: none;
    padding-top: 16px;
  }
  .covenant-nav.is-open { display: block; }
  .jump-nav-toggle { display: inline-flex; }
  .sidebar-divider { margin: 14px 0 0; }
  .sidebar-frame { padding: 16px 18px; }
}

@media (max-width: 768px) {
  .covenant-container { padding: 0 24px; }
  .ledger-card { grid-template-columns: 50px minmax(0, 1fr); gap: 16px; }
  .card-num-area { flex-direction: row; gap: 0; align-items: flex-start; }
  .card-num-line { display: none; }
  .main-title { font-size: 2.5rem; }
  .tab-ritual { width: 100%; }
  .ritual-tab { flex: 1; min-width: 0; padding-inline: 12px; }
  .covenant-page { padding-top: 92px; }
  .covenant-container { padding-inline: 18px; }
  .covenant-container :deep(.myst-page-header) { margin-bottom: 32px; }
  .card-num { width: 48px; height: 48px; font-size: 19px; }
  .card-title { font-size: 21px; margin-bottom: 10px; }
  .card-text { font-size: 15px; line-height: 1.65; }
  .rule-ledger, .group-entries { gap: 34px; }
}
</style>
