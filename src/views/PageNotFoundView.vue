<template>
  <ArcCentered>
    <div class="nf">
      <!-- A large, quiet number; the heading below says what happened. -->
      <p class="nf__code" aria-hidden="true">4<span class="nf__zero">0</span>4</p>
      <h1 class="arc-h3">{{ t('notFound.title') }}</h1>
      <p class="arc-lede">{{ t('notFound.message') }}</p>
      <div class="nf__actions">
        <RouterLink :to="$lp('/')" class="arc-btn arc-btn--solid">{{ t('navHome') }}</RouterLink>
        <RouterLink :to="$lp('/guide')" class="arc-btn arc-btn--ghost">{{ t('navGame') }}</RouterLink>
        <RouterLink :to="$lp('/help')" class="arc-btn arc-btn--ghost">{{ t('footer.linkHelp') }}</RouterLink>
      </div>
    </div>
  </ArcCentered>
</template>

<script lang="ts" setup>
import {useI18n} from "@/composables/useI18n";
import {useSeo} from "@/composables/useSeo";
import ArcCentered from "@/components/arcana/ArcCentered.vue";

const {t} = useI18n();

// A soft 404: the SPA answers 200, so the noindex tag is what keeps these
// out of the index instead of the status code.
useSeo(() => ({
  title: t("notFound.title"),
  description: t("notFound.message"),
  noindex: true,
}));
</script>

<style scoped>
.nf {
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

.nf > * {
  margin: 0;
}

/* The number fades out downwards, so it reads as a backdrop and not as a heading. */
.nf__code {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: clamp(120px, 24vw, 240px);
  font-weight: 700;
  line-height: .85;
  letter-spacing: -0.04em;
  color: var(--arc-muted);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, .5) 10%, transparent 100%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, .5) 10%, transparent 100%);
  user-select: none;
}

.nf__zero {
  color: var(--acc-ink);
}

.nf__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 480px) {
  .nf__actions {
    flex-direction: column;
    align-items: stretch;
    width: min(100%, 280px);
  }
}
</style>
