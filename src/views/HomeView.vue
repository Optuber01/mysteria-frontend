<template>
  <div class="home-page">
    <HeaderItem/>

    <main id="main-content" tabindex="-1">
      <section class="hero" aria-labelledby="home-title">
        <img class="hero-art" :src="kleinWebp" alt="" fetchpriority="high" height="1080" width="1920">
        <div class="hero-vignette" aria-hidden="true"></div>
        <div class="ritual-ring" aria-hidden="true"></div>
        <div class="fog fog-one" aria-hidden="true"></div>
        <div class="fog fog-two" aria-hidden="true"></div>

        <div class="hero-inner">
          <div class="hero-copy">
            <p class="eyebrow">{{ copy.heroEyebrow }}</p>
            <h1 id="home-title">{{ copy.heroTitle }}</h1>
            <p class="hero-subtitle">{{ copy.heroSubtitle }}</p>

            <div class="hero-actions">
              <button class="primary-action" type="button" @click="showJoinModal = true">
                {{ copy.enter }}
                <IconArrowRight/>
              </button>
              <RouterLink class="secondary-action" to="/guide">{{ copy.quickStart }}</RouterLink>
            </div>
          </div>

          <aside class="server-card" aria-label="Server connection information">
            <div class="server-address-row">
              <span class="online-dot" aria-hidden="true"></span>
              <code>mc.mysterria.net</code>
              <button class="copy-button" type="button" :aria-label="copied ? copy.copied : copy.copyAddress" @click="copyAddress">
                <IconCheck v-if="copied"/>
                <IconCopy v-else/>
              </button>
            </div>
            <p v-if="copyMessage" class="copy-status" aria-live="polite">{{ copyMessage }}</p>

            <div class="sequence-row" :aria-label="copy.sequenceLabel">
              <span
                  v-for="sequence in sequences"
                  :key="sequence"
                  :class="{ active: sequence === 9 }"
              >{{ sequence }}</span>
            </div>

            <div class="server-facts">
              <div><strong>32</strong><span>{{ copy.pathways }}</span></div>
              <div><strong>26.1.2+</strong><span>{{ copy.version }}</span></div>
              <div><strong>0</strong><span>{{ copy.mods }}</span></div>
            </div>
          </aside>
        </div>

        <div class="hero-scroll" aria-hidden="true">
          <span>{{ copy.discover }}</span>
          <i></i>
        </div>
      </section>

      <section class="power-section section-shell" aria-labelledby="power-title">
        <header class="section-heading">
          <div>
            <p class="eyebrow">{{ copy.powerEyebrow }}</p>
            <h2 id="power-title">{{ copy.powerTitle }}</h2>
          </div>
          <p>{{ copy.powerSummary }}</p>
        </header>

        <div class="power-grid">
          <RouterLink v-for="(step, index) in copy.powerSteps" :key="step.title" :to="powerLinks[index]" class="power-card">
            <div class="power-media">
              <img :src="powerImages[index]" alt="" width="800" height="520" loading="lazy" decoding="async">
              <div class="power-media-shade"></div>
              <span class="power-number">0{{ index + 1 }}</span>
            </div>
            <div class="power-card-copy">
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
              <span class="entry-link">{{ step.link }} <i aria-hidden="true">↗</i></span>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="pathway-section" aria-labelledby="pathway-title">
        <div class="section-shell">
          <header class="pathway-heading">
            <div>
              <p class="eyebrow">{{ copy.pathwayEyebrow }}</p>
              <h2 id="pathway-title">{{ copy.pathwayTitle }}</h2>
            </div>
            <RouterLink class="text-link" to="/pathways">
              {{ copy.archive }}
              <IconArrowRight/>
            </RouterLink>
          </header>

          <div class="pathway-grid">
            <RouterLink
                v-for="pathway in pathways"
                :key="pathway.slug"
                class="pathway-card"
                :to="`/pathways/${pathway.slug}`"
            >
              <img :src="pathway.image" :alt="`${pathway.name} Pathway`" width="512" height="512" loading="lazy" decoding="async">
              <div class="pathway-overlay"></div>
              <div class="pathway-copy">
                <span>{{ pathway.role }}</span>
                <h3>{{ pathway.name }}</h3>
                <p>{{ pathway.power }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="world-section" aria-labelledby="world-title">
        <img class="world-art" :src="serverWebp" alt="Mysterria Minecraft world" width="1920" height="1080" loading="lazy" decoding="async">
        <div class="world-overlay" aria-hidden="true"></div>
        <div class="fog world-fog" aria-hidden="true"></div>

        <div class="section-shell world-inner">
          <header class="world-heading">
            <p class="eyebrow">{{ copy.worldEyebrow }}</p>
            <h2 id="world-title">{{ copy.worldTitle }}</h2>
          </header>

          <div class="world-grid">
            <RouterLink v-for="(system, index) in copy.worldSystems" :key="system.title" :to="worldLinks[index]" class="world-card">
              <img :src="worldImages[index]" alt="" width="700" height="520" loading="lazy" decoding="async">
              <div class="world-card-shade"></div>
              <div class="world-card-copy">
                <span>{{ system.index }}</span>
                <h3>{{ system.title }}</h3>
                <p>{{ system.text }}</p>
                <i class="entry-arrow" aria-hidden="true">↗</i>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="choice-section section-shell" aria-labelledby="choice-title">
        <div class="choice-intro">
          <p class="eyebrow">{{ copy.choiceEyebrow }}</p>
          <h2 id="choice-title">{{ copy.choiceTitle }}</h2>
          <RouterLink class="text-link" to="/guide">
            {{ copy.compare }}
            <IconArrowRight/>
          </RouterLink>
        </div>

        <div class="choice-cards">
          <RouterLink class="choice-card shortcut" to="/guide/starter-choice">
            <div class="choice-topline"><span>01</span><strong>{{ copy.shortcutBadge }}</strong></div>
            <h3>{{ copy.shortcut }}</h3>
            <p>{{ copy.shortcutText }}</p>
            <small>{{ copy.shortcutCost }}</small>
          </RouterLink>
          <RouterLink class="choice-card resolve" to="/guide/starter-choice">
            <div class="choice-topline"><span>02</span><strong>{{ copy.resolveBadge }}</strong></div>
            <h3>{{ copy.resolve }}</h3>
            <p>{{ copy.resolveText }}</p>
            <small>{{ copy.resolveCost }}</small>
          </RouterLink>
        </div>
      </section>

      <section v-if="homeNews.length || newsLoading || newsError" class="news-section section-shell" aria-labelledby="news-title">
        <header class="news-heading">
          <div>
            <p class="eyebrow">{{ copy.newsEyebrow }}</p>
            <h2 id="news-title">{{ copy.newsTitle }}</h2>
          </div>
        </header>

        <p v-if="newsLoading" aria-live="polite" role="status">{{ copy.newsLoading }}</p>
        <div v-else-if="newsError" class="news-error" role="alert">
          <p>{{ copy.newsError }}</p>
          <button ref="newsRetryButton" type="button" @click="fetchNews(true)">{{ copy.retry }}</button>
        </div>
        <div v-else class="news-grid">
          <RouterLink
              v-for="article in homeNews"
              :key="article.id"
              class="news-card"
              :to="`/news/${article.slug}`"
          >
            <div class="news-image">
              <img :src="article.preview || bannerWebp" alt="" width="800" height="450" loading="lazy" decoding="async">
            </div>
            <div class="news-copy">
              <time>{{ formatDate(getArticleDate(article)) }}</time>
              <h3>{{ article.title }}</h3>
              <IconArrowRight/>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="final-cta">
        <div class="final-fog" aria-hidden="true"></div>
        <img :src="logoWebp" alt="" class="final-logo" height="512" width="512">
        <p class="eyebrow">{{ copy.finalEyebrow }}</p>
        <h2>{{ copy.finalTitle }}</h2>
        <button class="primary-action" type="button" @click="showJoinModal = true">
          {{ copy.enter }}
          <IconArrowRight/>
        </button>
      </section>
    </main>

    <FooterItem/>
    <JoinServerModal :show="showJoinModal" @close="showJoinModal = false"/>
    <DailyBonusCat page="home"/>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, ref, watch} from "vue";
import HeaderItem from "@/components/layout/HeaderItem.vue";
import FooterItem from "@/components/layout/FooterItem.vue";
import JoinServerModal from "@/components/ui/JoinServerModal.vue";
import DailyBonusCat from "@/components/ui/DailyBonusCat.vue";
import IconArrowRight from "@/assets/icons/IconArrowRight.vue";
import IconCheck from "@/assets/icons/IconCheck.vue";
import IconCopy from "@/assets/icons/IconCopy.vue";
import {useI18n} from "@/composables/useI18n";
import {newsAPI} from "@/utils/api/news";
import type {NewsArticle, NewsPreview} from "@/types/news";
import bannerWebp from "@/assets/images/optimized/banner.webp";
import serverWebp from "@/assets/images/optimized/Server.webp";
import kleinWebp from "@/assets/images/optimized/Klein.webp";
import logoWebp from "@/assets/icons/sources/IconLogo.webp";
import doorWebp from "@/assets/images/pathways/door.webp";
import foolWebp from "@/assets/images/pathways/fool.webp";
import sunWebp from "@/assets/images/pathways/sun.webp";
import tyrantWebp from "@/assets/images/pathways/tyrant.webp";
import cauldronPng from "@/assets/images/home/magic-cauldron.png";
import pathwaySelectionPng from "@/assets/images/home/pathway-selection.png";
import dungeonsPng from "@/assets/images/home/dungeons.png";
import townsJpg from "@/assets/images/home/towns.jpg";
import guardiansJpg from "@/assets/images/home/guardians.jpg";

const {currentLanguage} = useI18n();

const showJoinModal = ref(false);
const copied = ref(false);
const copyMessage = ref("");
const news = ref<NewsArticle[]>([]);
const pinnedNews = ref<NewsPreview[]>([]);
const newsLoading = ref(true);
const newsError = ref(false);
const newsRetryButton = ref<HTMLButtonElement | null>(null);
const sequences = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const powerImages = [cauldronPng, dungeonsPng, pathwaySelectionPng];
const worldImages = [dungeonsPng, townsJpg, guardiansJpg, serverWebp];
const powerLinks = ["/guide/first-potion", "/guide/progression", "/guide/progression"];
const worldLinks = ["/guide/activities", "/guide/towns", "/guide/activities", "/guide/activities"];

const translations = {
  en: {
    skipToContent: "Skip to content",
    heroEyebrow: "The LOTM power system, rebuilt for Minecraft",
    heroTitle: "Drink. Digest. Ascend.",
    heroSubtitle: "Brew potions. Master a Pathway. Survive the cost.",
    enter: "Play on Mysterria",
    quickStart: "New player guide",
    copyAddress: "Copy server address",
    copied: "Server address copied",
    copyFailed: "Copy unavailable. Select mc.mysterria.net",
    sequenceLabel: "Sequence progression from 9 to 0",
    pathways: "Pathways",
    version: "Minecraft",
    mods: "Required mods",
    discover: "Discover the system",
    powerEyebrow: "Power has a price",
    powerTitle: "Brew your way to power.",
    powerSummary: "Every advancement follows a readable, repeatable loop.",
    powerSteps: [
      {title: "Brew", text: "Find a recipe, gather its ingredients, and use the Magic Cauldron.", link: "Read the brewing guide"},
      {title: "Digest", text: "Act according to your Sequence while hunting, exploring, and clearing dungeons.", link: "Learn how digestion works"},
      {title: "Ascend", text: "Complete the ritual, survive the risk, and drink the next potion.", link: "See the ascension ritual"},
    ],
    pathwayEyebrow: "32 ways to power",
    pathwayTitle: "Compare all 32 Pathways.",
    archive: "Browse the archive",
    worldEyebrow: "Beyond the potion",
    worldTitle: "Power changes the map.",
    worldSystems: [
      {index: "01", title: "Dungeons", text: "Form a party, close Rifts, and face bosses."},
      {index: "02", title: "Towns", text: "Protect land, share resources, and govern together."},
      {index: "03", title: "Guardians", text: "Challenge world bosses built around Beyonder abilities."},
      {index: "04", title: "Crimson Moon", text: "When night changes the rules."},
    ],
    choiceEyebrow: "Your first decision",
    choiceTitle: "How will you reach Sequence 9?",
    compare: "Compare starter choices",
    shortcutBadge: "Instant",
    shortcut: "Shortcut",
    shortcutText: "Begin at Sequence 9.",
    shortcutCost: "Permanent -10% max Spirituality",
    resolveBadge: "Unscarred",
    resolve: "Resolve",
    resolveText: "Brew your first potion.",
    resolveCost: "Next loot chest guarantees a recipe",
    newsEyebrow: "From behind the fog",
    newsTitle: "Latest dispatches.",
    newsLoading: "Loading the latest dispatches...",
    newsError: "The latest dispatches could not be reached.",
    retry: "Try again",
    finalEyebrow: "The gray fog awaits",
    finalTitle: "Begin at Sequence 9.",
  },
  uk: {
    skipToContent: "Перейти до вмісту",
    heroEyebrow: "Система сил LOTM, відтворена у Minecraft",
    heroTitle: "Випий. Засвой. Піднесись.",
    heroSubtitle: "Вари зілля. Опануй Шлях. Переживи ціну.",
    enter: "Грати на Mysterria",
    quickStart: "Гайд для новачків",
    copyAddress: "Копіювати адресу сервера",
    copied: "Адресу сервера скопійовано",
    copyFailed: "Не вдалося скопіювати. Оберіть mc.mysterria.net",
    sequenceLabel: "Прогрес Послідовностей від 9 до 0",
    pathways: "Шляхи",
    version: "Minecraft",
    mods: "Потрібні моди",
    discover: "Відкрити систему",
    powerEyebrow: "Сила має ціну",
    powerTitle: "Звари свій шлях до сили.",
    powerSummary: "Кожне піднесення має зрозумілий і повторюваний цикл.",
    powerSteps: [
      {title: "Звари", text: "Знайди рецепт, збери інгредієнти та скористайся Магічним казаном.", link: "Прочитати гайд із варіння"},
      {title: "Засвой", text: "Відігравай свою Послідовність під час полювання, досліджень і підземель.", link: "Дізнатися про засвоєння"},
      {title: "Піднесись", text: "Заверши ритуал, переживи ризик і випий наступне зілля.", link: "Переглянути ритуал піднесення"},
    ],
    pathwayEyebrow: "32 шляхи до сили",
    pathwayTitle: "Порівняй усі 32 Шляхи.",
    archive: "Переглянути архів",
    worldEyebrow: "За межами зілля",
    worldTitle: "Сила змінює мапу.",
    worldSystems: [
      {index: "01", title: "Підземелля", text: "Збери групу, закрий Розломи та здолай босів."},
      {index: "02", title: "Міста", text: "Захищай землю, ділися ресурсами та керуй разом."},
      {index: "03", title: "Вартові", text: "Кинь виклик світовим босам, створеним для здібностей Потойбічних."},
      {index: "04", title: "Багряний Місяць", text: "Коли ніч змінює правила."},
    ],
    choiceEyebrow: "Твоє перше рішення",
    choiceTitle: "Як ти досягнеш Послідовності 9?",
    compare: "Порівняти стартові варіанти",
    shortcutBadge: "Миттєво",
    shortcut: "Скорочення",
    shortcutText: "Почни з Послідовності 9.",
    shortcutCost: "Назавжди -10% максимуму Духовності",
    resolveBadge: "Без шраму",
    resolve: "Рішучість",
    resolveText: "Звари своє перше зілля.",
    resolveCost: "Наступна скриня гарантує рецепт",
    newsEyebrow: "З-за сірого туману",
    newsTitle: "Останні звістки.",
    newsLoading: "Завантажуємо останні звістки...",
    newsError: "Не вдалося отримати останні звістки.",
    retry: "Спробувати ще раз",
    finalEyebrow: "Сірий туман чекає",
    finalTitle: "Почни з Послідовності 9.",
  },
};

const pathwayTranslations = {
  en: [
    {slug: "door", name: "Door", role: "Mobility", power: "Space bends.", image: doorWebp},
    {slug: "sun", name: "Sun", role: "Purification", power: "Light answers.", image: sunWebp},
    {slug: "tyrant", name: "Tyrant", role: "Pressure", power: "Storms obey.", image: tyrantWebp},
    {slug: "fool", name: "Fool", role: "Deception", power: "Truth slips.", image: foolWebp},
  ],
  uk: [
    {slug: "door", name: "Двері", role: "Мобільність", power: "Простір згинається.", image: doorWebp},
    {slug: "sun", name: "Сонце", role: "Очищення", power: "Світло відповідає.", image: sunWebp},
    {slug: "tyrant", name: "Тиран", role: "Тиск", power: "Бурі коряться.", image: tyrantWebp},
    {slug: "fool", name: "Дурень", role: "Обман", power: "Істина вислизає.", image: foolWebp},
  ],
};

const copy = computed(() => translations[currentLanguage.value]);
const pathways = computed(() => pathwayTranslations[currentLanguage.value]);
const homeNews = computed(() => {
  const seen = new Set<number>();
  return [...pinnedNews.value, ...news.value]
      .filter(article => {
        if (seen.has(article.id)) return false;
        seen.add(article.id);
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .slice(0, 3);
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(currentLanguage.value === "uk" ? "uk-UA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getArticleDate = (article: NewsArticle | NewsPreview) => {
  return article.publishedAt || ("createdAt" in article ? article.createdAt : "");
};

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText("mc.mysterria.net");
    copied.value = true;
    copyMessage.value = copy.value.copied;
  } catch {
    copyMessage.value = copy.value.copyFailed;
  }
  window.setTimeout(() => {
    copied.value = false;
    copyMessage.value = "";
  }, 2800);
};

const fetchNews = async (restoreFocus = false) => {
  newsLoading.value = true;
  newsError.value = false;
  try {
    const [latestResponse, pinnedResponse] = await Promise.all([
      newsAPI.getLatest(currentLanguage.value),
      newsAPI.getPinned(currentLanguage.value),
    ]);
    news.value = latestResponse.data;
    pinnedNews.value = pinnedResponse.data;
  } catch (error) {
    newsError.value = true;
    console.error("Failed to load homepage news:", error);
  } finally {
    newsLoading.value = false;
    if (restoreFocus && newsError.value) {
      await nextTick();
      newsRetryButton.value?.focus();
    }
  }
};

watch(currentLanguage, () => fetchNews(), {immediate: true});
</script>

<style scoped>
.home-page {
  --home-bg: #06070a;
  --home-panel: #101116;
  --home-ivory: #f2ead9;
  --home-muted: #aaa397;
  --home-gold: #d8b65f;
  --home-crimson: #a72036;
  min-height: 100vh;
  overflow: hidden;
  background: var(--home-bg);
  color: var(--home-ivory);
  font-family: var(--font-body);
}

.section-shell {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.hero {
  position: relative;
  min-height: max(760px, 100svh);
  display: grid;
  align-items: end;
  isolation: isolate;
  overflow: hidden;
  padding: 128px 0 84px;
  background: #07080b;
}

.hero::after,
.pathway-section::after,
.world-section::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .035;
  z-index: 4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E");
}

.hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 26%;
  z-index: -5;
  filter: saturate(.78) contrast(1.08) brightness(.72);
}

.hero-vignette {
  position: absolute;
  inset: 0;
  z-index: -4;
  background:
      linear-gradient(90deg, rgba(5, 6, 9, .97) 0%, rgba(5, 6, 9, .86) 38%, rgba(5, 6, 9, .28) 68%, rgba(5, 6, 9, .68) 100%),
      linear-gradient(180deg, rgba(5, 6, 9, .58) 0%, transparent 30%, rgba(5, 6, 9, .98) 100%);
}

.ritual-ring {
  position: absolute;
  top: 4%;
  left: -12%;
  width: min(54vw, 760px);
  aspect-ratio: 1;
  border: 1px solid rgba(216, 182, 95, .14);
  border-radius: 50%;
  z-index: -1;
}

.ritual-ring::before,
.ritual-ring::after {
  content: "";
  position: absolute;
  inset: 12%;
  border: 1px dashed rgba(216, 182, 95, .14);
  border-radius: inherit;
}

.ritual-ring::after {
  inset: 27%;
  border-style: solid;
  border-color: rgba(167, 32, 54, .22);
}

.fog {
  position: absolute;
  height: 260px;
  pointer-events: none;
  filter: blur(34px);
  background:
      radial-gradient(ellipse at 18% 55%, rgba(174, 183, 191, .24), transparent 42%),
      radial-gradient(ellipse at 52% 62%, rgba(174, 183, 191, .18), transparent 40%),
      radial-gradient(ellipse at 84% 52%, rgba(174, 183, 191, .20), transparent 43%);
}

.fog-one { inset: auto -8% -7% -8%; }
.fog-two { inset: 35% -18% auto 34%; opacity: .5; }

.hero-inner {
  position: relative;
  z-index: 5;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(330px, .65fr);
  align-items: end;
  gap: clamp(48px, 8vw, 110px);
}

.hero-copy { position: relative; min-width: 0; width: 100%; }

.eyebrow {
  margin: 0 0 16px;
  color: var(--home-gold);
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  line-height: 1.5;
  text-transform: uppercase;
}

.hero h1 {
  max-width: 680px;
  margin: 0;
  color: var(--home-ivory);
  font-family: var(--font-display);
  font-size: clamp(58px, 7vw, 104px);
  font-weight: 700;
  letter-spacing: -.025em;
  line-height: .92;
  text-wrap: balance;
}

.hero-subtitle {
  margin: 30px 0 0;
  color: rgba(242, 234, 217, .78);
  font-size: clamp(17px, 1.5vw, 21px);
  line-height: 1.55;
}

.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; }

.primary-action,
.secondary-action {
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  padding: 0 22px;
  border-radius: var(--radius-md);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .015em;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), transform var(--motion-fast) var(--ease-standard);
}

.primary-action {
  border: 0;
  color: #160f08;
  background: linear-gradient(135deg, #f0d184, #c88d38);
  box-shadow: 0 16px 44px rgba(194, 133, 45, .2);
}

.primary-action svg { width: 16px; }
.primary-action:hover { color: #160f08; transform: translateY(var(--hover-control)); }

.secondary-action {
  border: 1px solid rgba(242, 234, 217, .18);
  color: var(--home-ivory);
  background: rgba(7, 8, 11, .48);
  backdrop-filter: blur(12px);
}

.secondary-action:hover { color: var(--home-ivory); border-color: rgba(216, 182, 95, .5); transform: translateY(var(--hover-control)); }

.server-card {
  padding: 25px;
  border: 1px solid rgba(242, 234, 217, .14);
  border-radius: var(--radius-xl);
  background: linear-gradient(145deg, rgba(19, 16, 19, .86), rgba(7, 8, 11, .88));
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-panel-raised);
}

.server-address-row { display: flex; align-items: center; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid rgba(242, 234, 217, .1); }
.server-address-row code { flex: 1; color: var(--home-gold); font-family: var(--font-mono); font-size: 14px; }
.online-dot { width: 8px; height: 8px; border-radius: 50%; background: #60d394; box-shadow: 0 0 0 5px rgba(96, 211, 148, .1), 0 0 16px rgba(96, 211, 148, .35); }

.copy-button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(242, 234, 217, .13);
  border-radius: var(--radius-sm);
  color: var(--home-ivory);
  background: rgba(255, 255, 255, .04);
  cursor: pointer;
}

.copy-button svg { width: 15px; }
.copy-button:hover { border-color: var(--home-gold); color: var(--home-gold); }
.copy-status { margin: 11px 0 -4px; color: #d8caa9; font: 500 11px/1.4 var(--font-ui); }

.sequence-row { display: flex; justify-content: space-between; gap: 6px; padding: 24px 0; }
.sequence-row span { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid rgba(216, 182, 95, .22); border-radius: 50%; color: #8f887d; font-family: var(--font-mono); font-size: 13px; }
.sequence-row span.active { border-color: transparent; color: #160f08; background: linear-gradient(135deg, #f0d184, #c88d38); box-shadow: 0 0 24px rgba(216, 182, 95, .24); }

.server-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.server-facts div { padding: 13px 8px; border-radius: var(--radius-lg); background: rgba(255, 255, 255, .035); text-align: center; }
.server-facts strong { display: block; color: var(--home-ivory); font-family: var(--font-mono); font-size: 17px; }
.server-facts span { display: block; margin-top: 3px; color: #aaa398; font-size: 11px; }

.hero-scroll { position: absolute; z-index: 5; bottom: 23px; left: 50%; display: flex; align-items: center; gap: 12px; transform: translateX(-50%); color: #aaa398; font: 600 11px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; }
.hero-scroll i { width: 52px; height: 1px; background: linear-gradient(90deg, var(--home-gold), transparent); }

.power-section { padding: 112px 0 126px; }

.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 36px; margin-bottom: 46px; }
.section-heading h2,
.pathway-heading h2,
.world-heading h2,
.choice-intro h2,
.news-heading h2,
.final-cta h2 { margin: 0; color: var(--home-ivory); font-family: var(--font-display); font-size: clamp(40px, 5.4vw, 68px); font-weight: 700; line-height: .98; letter-spacing: -.025em; }
.section-heading > p { max-width: 310px; margin: 0 0 5px; color: var(--home-muted); font-size: 16px; }

.power-grid { display: flex; flex-direction: column; border-top: 1px solid rgba(242, 234, 217, .14); }
.power-card { position: relative; min-height: 320px; display: grid; grid-template-columns: minmax(0, 1.18fr) minmax(320px, .82fr); overflow: hidden; border: 0; border-bottom: 1px solid rgba(242, 234, 217, .14); border-radius: 0; color: inherit; background: transparent; box-shadow: none; text-decoration: none; transition: background-color var(--motion-base) var(--ease-standard); }
.power-card:nth-child(even) { grid-template-columns: minmax(320px, .82fr) minmax(0, 1.18fr); }
.power-card:nth-child(even) .power-media { order: 2; }
.power-card::after { content: ""; position: absolute; top: 18px; right: 18px; width: 18px; height: 18px; border-top: 1px solid rgba(216, 182, 95, .7); border-right: 1px solid rgba(216, 182, 95, .7); }
.power-card:hover { color: inherit; background: rgba(255, 255, 255, .022); }
.power-media { position: relative; height: 320px; overflow: hidden; background: #15161b; }
.power-media img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.72) contrast(1.08) brightness(.78); transition: filter var(--motion-base) var(--ease-standard), transform var(--motion-slow) var(--ease-standard); }
.power-card:first-child .power-media img { object-position: center; }
.power-card:last-child .power-media img { object-position: center 42%; }
.power-card:hover .power-media img { transform: scale(var(--hover-image-scale)); filter: saturate(.9) contrast(1.05) brightness(.9); }
.power-media-shade { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 38%, #101116 100%); }
.power-number { position: absolute; top: 18px; left: 18px; display: grid; place-items: center; width: 38px; height: 30px; border: 1px solid rgba(242, 234, 217, .22); border-radius: var(--radius-sm); color: var(--home-gold); background: rgba(7, 8, 11, .76); backdrop-filter: blur(8px); font: 600 11px var(--font-ui); font-variant-numeric: tabular-nums; }
.power-card-copy { display: flex; flex-direction: column; justify-content: center; padding: 46px; }
.power-card h3 { margin: 0 0 12px; font-family: var(--font-display); font-size: clamp(34px, 4vw, 52px); font-weight: 750; letter-spacing: -.03em; }
.power-card p { max-width: 42ch; margin: 0; color: var(--home-muted); font-size: 15px; line-height: 1.65; }
.entry-link { display: block; margin-top: 18px; color: var(--home-gold); font: 600 12px var(--font-ui); letter-spacing: .025em; }
.entry-link i { font-style: normal; }

.pathway-section { position: relative; padding: 110px 0 126px; background: #0b0c10; overflow: hidden; }
.pathway-section::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(167, 32, 54, .12), transparent 36rem); }
.pathway-heading { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 44px; }

.text-link { display: inline-flex; align-items: center; gap: 11px; color: var(--home-gold); font: 600 12px var(--font-ui); letter-spacing: .025em; }
.text-link svg { width: 16px; transition: transform var(--motion-fast) var(--ease-standard); }
.text-link:hover { color: #f0cf7a; }
.text-link:hover svg { transform: translateX(2px); }

.pathway-grid { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; align-items: start; }
.pathway-card { position: relative; min-height: 380px; overflow: hidden; border: 1px solid rgba(242, 234, 217, .14); border-radius: var(--radius-lg); background: #101116; box-shadow: var(--shadow-panel); transition: border-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard); }
.pathway-card:nth-child(even) { margin-top: 26px; }
.pathway-card img { width: 100%; height: 100%; object-fit: cover; opacity: .72; filter: saturate(.78) contrast(1.05) brightness(.78); transition: filter var(--motion-base) var(--ease-standard), transform var(--motion-slow) var(--ease-standard); }
.pathway-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(6, 7, 10, .95) 90%); }
.pathway-copy { position: absolute; inset: auto 0 0; padding: 23px; }
.pathway-copy span { color: var(--home-gold); font: 600 11px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; }
.pathway-copy h3 { margin: 8px 0 4px; font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: .98; letter-spacing: -.03em; }
.pathway-copy p { margin: 0; color: rgba(242, 234, 217, .62); font-size: 13px; }
.pathway-card:hover { color: inherit; transform: translateY(var(--hover-card)); border-color: rgba(216, 182, 95, .46); }
.pathway-card:hover img { transform: scale(var(--hover-image-scale)); filter: saturate(.95) contrast(1.05) brightness(.9); }

.world-section { position: relative; min-height: 740px; display: grid; align-items: end; overflow: hidden; padding: 120px 0 100px; }
.world-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(.7) contrast(1.08) brightness(.63); }
.world-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, #06070a 0%, rgba(6, 7, 10, .42) 30%, rgba(6, 7, 10, .88) 100%), linear-gradient(90deg, rgba(6, 7, 10, .92), transparent 65%); }
.world-fog { inset: auto -10% -6%; opacity: .7; }
.world-inner { position: relative; z-index: 5; }
.world-heading { max-width: 660px; margin-bottom: 52px; }
.world-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.world-card { position: relative; min-height: 260px; overflow: hidden; border: 1px solid rgba(242, 234, 217, .16); border-radius: var(--radius-lg); color: inherit; background: #0b0c10; box-shadow: var(--shadow-panel); text-decoration: none; transition: border-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard); }
.world-card img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.76) contrast(1.05) brightness(.8); transition: filter var(--motion-base) var(--ease-standard), transform var(--motion-slow) var(--ease-standard); }
.world-card:nth-child(2) img { object-position: 60% center; filter: saturate(.82) contrast(1.02) brightness(.88); }
.world-card:nth-child(3) img { object-position: 54% center; filter: saturate(.72) contrast(1.08) brightness(.84); }
.world-card:nth-child(4) img { filter: sepia(.18) saturate(.92) contrast(1.04) brightness(.9); }
.world-card-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5, 6, 9, .08), rgba(5, 6, 9, .94) 84%); }
.world-card-copy { position: absolute; inset: auto 0 0; padding: 21px; }
.world-card-copy > span { color: var(--home-gold); font: 600 11px var(--font-ui); font-variant-numeric: tabular-nums; }
.world-card h3 { margin: 8px 0 3px; font-family: var(--font-display); font-size: 25px; font-weight: 700; letter-spacing: -.03em; }
.world-card p { margin: 0; color: rgba(242, 234, 217, .62); font-size: 12px; }
.entry-arrow { position: absolute; right: 20px; bottom: 20px; color: var(--home-gold); font-style: normal; }
.world-card:hover { transform: translateY(var(--hover-card)); border-color: rgba(216, 182, 95, .4); }
.world-card:hover img { transform: scale(var(--hover-image-scale)); filter: saturate(.88) contrast(1.05) brightness(.8); }

.choice-section { display: grid; grid-template-columns: .7fr 1.3fr; gap: clamp(45px, 8vw, 100px); padding: 120px 0; align-items: center; }
.choice-intro .text-link { margin-top: 26px; }
.choice-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.choice-card { min-height: 330px; display: flex; flex-direction: column; padding: 28px; border: 1px solid rgba(242, 234, 217, .13); border-radius: var(--radius-lg); color: inherit; background: linear-gradient(160deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .012)); box-shadow: var(--shadow-panel); text-decoration: none; transition: border-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard); }
.choice-card:hover { color: inherit; border-color: rgba(216, 182, 95, .42); transform: translateY(var(--hover-card)); }
.choice-card.resolve { border-color: rgba(216, 182, 95, .25); background: radial-gradient(circle at 80% 10%, rgba(216, 182, 95, .1), transparent 15rem), rgba(255, 255, 255, .025); }
.choice-topline { display: flex; justify-content: space-between; color: #aaa398; font: 600 11px var(--font-ui); letter-spacing: .04em; }
.choice-topline strong { color: var(--home-gold); }
.choice-card h3 { margin: auto 0 8px; font-family: var(--font-display); font-size: 39px; font-weight: 700; letter-spacing: -.03em; }
.choice-card p { margin: 0; color: var(--home-muted); font-size: 16px; }
.choice-card small { margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(242, 234, 217, .09); color: #aaa398; font-size: 12px; line-height: 1.45; }
.choice-card.shortcut small { color: #b86c76; }

.news-section { padding: 40px 0 120px; }
.news-heading { margin-bottom: 40px; }
.news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.news-card { overflow: hidden; border: 1px solid rgba(242, 234, 217, .1); border-radius: var(--radius-lg); background: rgba(255, 255, 255, .025); box-shadow: var(--shadow-panel); transition: border-color var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard); }
.news-image { height: 180px; overflow: hidden; background: #111217; }
.news-image img { width: 100%; height: 100%; object-fit: cover; opacity: .7; filter: saturate(.7); transition: opacity var(--motion-base) var(--ease-standard), transform var(--motion-slow) var(--ease-standard); }
.news-copy { position: relative; min-height: 150px; padding: 22px; }
.news-copy time { color: var(--home-gold); font: 600 11px var(--font-ui); letter-spacing: .025em; }
.news-copy h3 { margin: 12px 38px 0 0; font-family: var(--font-display); font-size: 23px; font-weight: 700; line-height: 1.15; letter-spacing: -.03em; }
.news-copy svg { position: absolute; right: 22px; bottom: 24px; width: 18px; color: var(--home-gold); }
.news-card:hover { color: inherit; border-color: rgba(216, 182, 95, .35); transform: translateY(var(--hover-card)); }
.news-card:hover img { transform: scale(var(--hover-image-scale)); opacity: .9; }

.final-cta { position: relative; min-height: 540px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: 90px 20px; text-align: center; background: radial-gradient(circle at 50% 42%, rgba(167, 32, 54, .16), transparent 20rem), #09090c; border-top: 1px solid rgba(242, 234, 217, .08); }
.final-cta::before { content: ""; position: absolute; width: 460px; aspect-ratio: 1; border: 1px solid rgba(216, 182, 95, .12); border-radius: 50%; box-shadow: inset 0 0 0 80px rgba(216, 182, 95, .012); }
.final-logo { position: relative; width: 72px; height: 72px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 12px 30px rgba(0, 0, 0, .5)); }
.final-cta h2 { position: relative; margin-bottom: 30px; font-size: clamp(56px, 8vw, 102px); }
.final-cta .eyebrow,
.final-cta .primary-action { position: relative; }
.final-fog { position: absolute; inset: auto -10% -18%; height: 280px; filter: blur(34px); opacity: .52; background: radial-gradient(ellipse at 30% 50%, rgba(174, 183, 191, .25), transparent 44%), radial-gradient(ellipse at 70% 45%, rgba(174, 183, 191, .2), transparent 44%); }

.primary-action:focus-visible,
.secondary-action:focus-visible,
.copy-button:focus-visible,
.text-link:focus-visible,
.power-card:focus-visible,
.pathway-card:focus-visible,
.world-card:focus-visible,
.choice-card:focus-visible,
.news-card:focus-visible {
  outline: 2px solid #e5c46e;
  outline-offset: 4px;
}

@media (max-width: 1000px) {
  .hero-inner { grid-template-columns: 1fr; align-items: start; }
  .server-card { max-width: 520px; }
  .pathway-grid { grid-template-columns: repeat(2, 1fr); }
  .world-grid { grid-template-columns: repeat(2, 1fr); }
  .choice-section { grid-template-columns: 1fr; }
  .choice-intro { max-width: 640px; }
}

@media (max-width: 760px) {
  .hero { min-height: auto; padding: 118px 0 74px; }
  .hero-art { object-position: 64% center; filter: saturate(.84) contrast(1.06) brightness(.8); }
  .hero-vignette { background: linear-gradient(90deg, rgba(5, 6, 9, .7), rgba(5, 6, 9, .22)), linear-gradient(180deg, rgba(5, 6, 9, .5), rgba(5, 6, 9, .7) 42%, rgba(5, 6, 9, .98) 88%); }
  .hero h1 { max-width: 100%; font-size: clamp(46px, 13vw, 58px); }
  .hero-subtitle { max-width: 500px; }
  .hero-scroll { display: none; }
  .server-card { width: 100%; }
  .section-heading,
  .pathway-heading { display: block; }
  .section-heading > p { margin-top: 16px; }
  .pathway-heading .text-link { margin-top: 22px; }
  .power-grid { grid-template-columns: 1fr; }
  .power-card, .power-card:nth-child(even) { min-height: 0; grid-template-columns: 1fr; }
  .power-card:nth-child(even) .power-media { order: 0; }
  .power-media { height: 260px; }
  .power-card-copy { padding: 30px 24px 36px; }
  .world-section { min-height: 880px; }
  .news-grid { grid-template-columns: 1fr; }
}

@media (max-width: 540px) {
  .section-shell,
  .hero-inner { width: min(100% - 28px, 1180px); }
  .hero-actions { display: grid; }
  .primary-action,
  .secondary-action { width: 100%; }
  .sequence-row { gap: 4px; }
  .sequence-row span { width: 25px; height: 25px; font-size: 10px; }
  .server-card { padding: 18px; border-radius: var(--radius-xl); }
  .server-facts { gap: 6px; }
  .server-facts div { padding-inline: 4px; }
  .power-section,
  .pathway-section,
  .choice-section { padding-top: 86px; padding-bottom: 94px; }
  .pathway-grid,
  .world-grid,
  .choice-cards { grid-template-columns: 1fr; }
  .pathway-card { min-height: 148px; margin-top: 0 !important; }
  .pathway-card img { width: 46%; opacity: .76; object-position: center; }
  .pathway-overlay { background: linear-gradient(90deg, rgba(6, 7, 10, .05) 20%, #090a0e 47%, #090a0e 100%); }
  .pathway-copy { inset: 0 0 0 42%; display: flex; flex-direction: column; justify-content: center; padding: 18px 16px; }
  .pathway-copy h3 { font-size: 27px; }
  .world-section { min-height: 1050px; padding-block: 88px; }
  .world-card { min-height: 145px; }
  .world-card-copy { padding: 17px; }
  .world-card h3 { font-size: 23px; }
  .choice-card { min-height: 280px; }
  .final-cta { min-height: 500px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-art,
  .hero-copy,
  .server-card,
  .fog { animation: none; }
}
</style>
