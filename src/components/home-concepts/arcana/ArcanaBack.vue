<template>
  <!-- Card back: one design for the whole deck, drawn in the page accent. -->
  <div class="arc-back" aria-hidden="true">
    <svg viewBox="0 0 100 162" preserveAspectRatio="none">
      <defs>
        <pattern :id="patternId" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 4h8" stroke="currentColor" stroke-width=".5" opacity=".22"/>
        </pattern>
      </defs>
      <rect x="5" y="5" width="90" height="152" rx="3" :fill="`url(#${patternId})`"/>
      <rect x="5" y="5" width="90" height="152" rx="3" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".7"/>
      <rect x="9" y="9" width="82" height="144" rx="2" fill="none" stroke="currentColor" stroke-width=".6" opacity=".45"/>
      <g fill="#111116" stroke="currentColor">
        <circle cx="50" cy="81" r="30" stroke-width="1.2"/>
        <circle cx="50" cy="81" r="24" stroke-width=".6" stroke-dasharray="1.5 2.5" fill="none"/>
      </g>
      <g stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round">
        <path d="M50 41v-14M50 121v14M18 81H10M82 81h8"/>
        <path d="M30 81c6-10 14-14 20-14s14 4 20 14c-6 10-14 14-20 14s-14-4-20-14z" stroke-width="1.3"/>
      </g>
      <circle cx="50" cy="81" r="6.5" fill="currentColor"/>
      <circle cx="50" cy="81" r="2.4" fill="#111116"/>
      <g fill="currentColor">
        <path d="M50 18l3 5-3 5-3-5zM50 134l3 5-3 5-3-5z"/>
        <path d="M16 16l2.5 2.5L16 21l-2.5-2.5zM84 16l2.5 2.5L84 21l-2.5-2.5zM16 141l2.5 2.5L16 146l-2.5-2.5zM84 141l2.5 2.5L84 146l-2.5-2.5z"/>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
let instances = 0;
</script>

<script setup lang="ts">
const patternId = `arc-lattice-${++instances}`;
</script>

<style scoped>
.arc-back {
  position: absolute;
  inset: 0;
  border-radius: 5cqw;
  overflow: hidden;
  color: var(--acc);
  background:
    radial-gradient(90% 60% at 50% 50%, color-mix(in oklab, var(--acc) 16%, transparent), transparent 70%),
    linear-gradient(165deg, #1a1a21, #0d0d11);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 40%, transparent);
}

svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
