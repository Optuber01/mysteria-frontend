<template>
  <header :class="`variant-${variant}`" class="myst-page-header">
    <div class="myst-header-decoration" aria-hidden="true"></div>
    <div class="myst-header-content">
      <p v-if="eyebrow" class="myst-header-eyebrow">{{ eyebrow }}</p>
      <h1 class="myst-header-label">
        <slot>{{ title }}</slot>
      </h1>
      <p v-if="subtitle" class="myst-header-subtitle">{{ subtitle }}</p>
    </div>
    <div class="myst-header-decoration" aria-hidden="true"></div>
  </header>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  variant?: 'editorial' | 'legal' | 'covenant' | 'tool';
}>(), {variant: 'editorial'});
</script>

<style scoped>
.myst-page-header {
  margin-top: 20px;
  margin-bottom: 60px;
}

.myst-header-content {
  min-width: 0;
  text-align: center;
}

.myst-header-decoration {
  height: 1px;
  flex: 1;
  max-width: 80px;
  background: linear-gradient(90deg, transparent, var(--myst-gold), transparent);
}

.myst-header-eyebrow {
  margin: 0 0 8px;
  color: var(--myst-gold);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.myst-header-label {
  margin: 0;
  color: #f7f5ef;
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.12;
  text-transform: none;
  white-space: normal;
}

.myst-header-subtitle {
  max-width: 680px;
  margin: 12px auto 0;
  color: var(--myst-ink-muted);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.65;
}

.variant-legal { justify-content: flex-start; margin-bottom: 42px; }
.variant-legal .myst-header-decoration { display: none; }
.variant-legal .myst-header-content { width: 100%; text-align: left; }
.variant-legal .myst-header-eyebrow { text-transform: uppercase; letter-spacing: .12em; }
.variant-legal .myst-header-label { max-width: 820px; font-size: clamp(38px, 6vw, 64px); font-weight: 750; letter-spacing: -.04em; text-align: left; }
.variant-legal .myst-header-subtitle { max-width: 62ch; margin: 14px 0 0; font-size: 16px; }

.variant-covenant .myst-header-eyebrow::before { content: '§ '; color: #82734a; }

@media (max-width: 768px) {
  .myst-header-decoration {
    max-width: 40px;
  }
}
</style>
