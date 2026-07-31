<template>
  <div class="catalog-selector">
    <div v-if="categories.length === 0" class="catalog-empty" role="status">
      <span class="empty-dot" aria-hidden="true"></span>
      <div>
        <h2 class="empty-title">
          {{ currentLanguage === 'uk' ? 'Товари в крамниці тимчасово недоступні' : 'Shop items are temporarily unavailable' }}
        </h2>
         <p class="empty-copy">
           {{ currentLanguage === 'uk' ? 'Будь ласка, спробуйте ще раз за мить.' : 'Please try again in a moment.' }}
         </p>
         <button class="empty-retry" type="button" @click="emit('retry')">{{ t('tryAgain') }}</button>
      </div>
    </div>

    <!-- Category Grid -->
    <div v-else class="catalog-grid">
      <button
          v-for="category in categories"
          :key="category.id"
          class="catalog-card"
          type="button"
          @click="handleCategoryClick(category.id)"
      >
        <!-- Card Background Elements -->
        <div class="card-border-frame"></div>

        <!-- Thumbnail Image Section -->
        <div class="card-visual">
          <div class="image-container">
            <img :alt="category.name" :src="category.thumbnailUrl" class="category-img" height="360" width="640"/>
            <div class="image-noise"></div>
          </div>
        </div>

        <!-- Category Info Section -->
        <div class="card-content">
          <div class="content-top">
            <h3 class="category-title">{{ category.name }}</h3>
            <div class="category-tag">{{ t('itemsCount').split(' ')[0] }}</div>
          </div>
          <p class="category-desc">{{ category.description }}</p>
          
          <div class="content-footer">
            <div class="item-stat">
              <span class="stat-value">{{ category.itemCount }}</span>
              <span class="stat-label">{{ currentLanguage === 'uk' ? 'Товари' : 'Items' }}</span>
            </div>
            <div class="footer-decoration"></div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useBalanceStore} from '@/stores/balance';
import type {CategoryInfo} from '@/types/services';

const emit = defineEmits<{
  (e: 'select-category', categoryId: string): void;
  (e: 'retry'): void;
}>();

const {t, currentLanguage} = useI18n();
const shopStore = useBalanceStore();
const items = computed(() => shopStore.items);

const categories = computed<CategoryInfo[]>(() => {
  const categoryMap = new Map<string, CategoryInfo>();
  items.value.forEach(item => {
    if (!item.category || !item.is_active) return;
    const categoryId = item.category;
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: getCategoryName(categoryId),
        description: getCategoryDescription(categoryId),
        thumbnailUrl: item.categoryThumbnail || item.image || '',
        itemCount: 0
      });
    }
    const category = categoryMap.get(categoryId)!;
    category.itemCount++;
  });
  return Array.from(categoryMap.values())
      .filter(cat => cat.itemCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
});

const getCategoryName = (categoryId: string): string => {
  const normalizedId = categoryId.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
  const key = `shopCategory${normalizedId}`;
  const translated = t(key);
  return translated === key ? categoryId : translated;
};

const getCategoryDescription = (categoryId: string): string => {
  const normalizedId = categoryId.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
  const key = `shopCategory${normalizedId}Desc`;
  const translated = t(key);
  return translated === key ? '' : translated;
};

const handleCategoryClick = (categoryId: string) => {
  emit('select-category', categoryId);
};
</script>

<style scoped>
/* CARTOGRAPHER'S CATALOG THEME */

.catalog-selector {
  padding: 40px 0;
  position: relative;
}

.catalog-empty {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 32px;
  border: 1px solid rgba(200, 178, 115, 0.2);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at 0 50%, rgba(200, 178, 115, 0.1), transparent 42%),
    rgba(13, 16, 30, 0.68);
}

.empty-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--myst-gold);
  box-shadow: 0 0 20px rgba(200, 178, 115, 0.45);
}

.empty-title {
  margin: 0 0 6px;
  color: var(--myst-offwhite);
  font-family: var(--font-display);
  font-size: clamp(20px, 3vw, 26px);
  font-weight: 600;
}

.empty-copy {
  margin: 0;
  color: var(--myst-ink-muted);
  font-family: var(--font-ui);
  font-size: 14px;
}

.empty-retry { min-height: 44px; margin-top: 16px; padding: 0 18px; border: 1px solid var(--myst-gold); border-radius: var(--radius-md); background: transparent; color: var(--myst-gold); font: 700 14px var(--font-ui); cursor: pointer; }
.empty-retry:hover { background: rgba(200, 178, 115, .1); }

/* Catalog Grid */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Catalog Card - Floating Island Style */
.catalog-card {
  position: relative;
  background: rgba(13, 16, 30, 0.6);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  transition:
    background-color var(--motion-base) var(--ease-standard);
}

.catalog-card:hover {
  background: rgba(20, 24, 45, 0.8);
}

/* Visual Framing */
.card-border-frame {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
  pointer-events: none;
  z-index: 5;
  transition: border-color var(--motion-base) var(--ease-standard);
  border-radius: inherit;
}

.catalog-card:hover .card-border-frame {
  border-color: rgba(200, 178, 115, 0.3);
}

/* Visual Area */
.card-visual {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.category-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.8) contrast(1.1) brightness(0.8);
}

.image-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.15;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* Content Area */
.card-content {
  padding: 32px;
  position: relative;
  z-index: 2;
  background: linear-gradient(180deg, transparent 0%, rgba(8, 10, 20, 0.4) 100%);
}

.content-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.category-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--myst-offwhite);
  margin: 0;
  font-weight: 700;
}

.category-tag {
  font-family: var(--font-ui);
  font-size: 10px;
  padding: 4px 8px;
  border: 1px solid rgba(200, 178, 115, 0.3);
  color: var(--myst-gold);
  border-radius: var(--radius-pill);
  text-transform: uppercase;
}

.category-desc {
  font-size: 14px;
  color: #888;
  line-height: 1.6;
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-ui);
  font-size: 20px;
  font-weight: 700;
  color: var(--myst-gold);
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #555;
}

.footer-decoration {
  height: 1px;
  flex: 1;
  margin-left: 20px;
  background: linear-gradient(90deg, rgba(200, 178, 115, 0.2) 0%, transparent 100%);
}

/* Responsive Overrides */
@media (max-width: 768px) {
  .catalog-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .catalog-empty {
    align-items: flex-start;
    margin: 0 16px;
    padding: 24px;
  }
}
</style>
