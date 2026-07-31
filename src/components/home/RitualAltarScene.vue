<template>
  <div
    class="altar"
    :style="{ '--build': String(progress) }"
    role="group"
    aria-label="Interactive Normal-tier Ritual Altar blueprint"
    @mouseleave="emit('inspect', null)"
  >
    <div class="altar__beam" />
    <div class="altar__grid">
      <button
        v-for="(block, index) in blocks"
        :key="index"
        class="altar-block"
        :class="[`is-${block.kind}`, { 'is-built': progress > .08 + index * .038 }]"
        :style="{ '--order': String(index), '--x': String(block.x + 1), '--z': String(block.z + 1), '--y': String(block.y) }"
        type="button"
        :aria-label="block.label"
        :aria-describedby="`progression-detail-altar-${block.detailId}`"
        :tabindex="firstDetailIndex.get(block.detailId) === index ? 0 : -1"
        @mouseenter="emit('inspect', block.detailId)"
        @focus="emit('inspect', block.detailId)"
        @blur="emit('inspect', null)"
        @click="emit('inspect', block.detailId)"
      >
        <i class="face face--top" />
        <i class="face face--left" />
        <i class="face face--right" />
      </button>
    </div>
    <div class="altar__scroll">
      <span>Ritual Altar</span>
      <strong>18-block Normal blueprint</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ progress?: number }>(), { progress: 0 });
const emit = defineEmits<{ inspect: [id: string | null] }>();

type AltarBlock = { x: number; y: number; z: number; kind: 'stone' | 'corner' | 'candle' | 'core'; label: string; detailId: string };
const blocks: AltarBlock[] = [];

for (let z = -1; z <= 1; z += 1) {
  for (let x = -1; x <= 1; x += 1) {
    blocks.push({ x, y: 0, z, kind: 'stone', label: 'Stone-brick base block', detailId: 'altar-materials' });
  }
}

for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
  blocks.push({ x, y: 1, z, kind: 'corner', label: 'Chiseled stone-brick corner', detailId: 'altar-materials' });
}
for (const [x, z] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
  blocks.push({ x, y: 1, z, kind: 'candle', label: 'Lit triple-candle cluster', detailId: 'altar-blueprint' });
}
blocks.push({ x: 0, y: 1, z: 0, kind: 'core', label: 'Functional enchanting-table core', detailId: 'altar-core' });
const firstDetailIndex = new Map<string, number>();
blocks.forEach((block, index) => {
  if (!firstDetailIndex.has(block.detailId)) firstDetailIndex.set(block.detailId, index);
});
</script>

<style scoped>
.altar {
  --build: 0;
  position: relative;
  width: min(500px, 100%);
  height: 400px;
  perspective: 900px;
  filter: drop-shadow(0 35px 28px rgba(0, 0, 0, .52));
}

.altar__grid {
  position: absolute;
  top: 49%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%) rotateX(58deg) rotateZ(45deg);
  transform-style: preserve-3d;
}

.altar-block {
  --texture: url('@/assets/images/home/progression/blocks/glass.png');
  position: absolute;
  top: calc(var(--z) * 97px);
  left: calc(var(--x) * 97px);
  width: 88px;
  height: 88px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: calc(.35 + clamp(0, (var(--build) - var(--order) * .045) * 2.4, .65));
  transform: translateZ(calc(var(--y) * 44px + 18px + clamp(0, (var(--build) - var(--order) * .045) * 1.5, 1) * 18px));
  transform-style: preserve-3d;
}

.altar-block:focus-visible { outline: 3px solid #f0d38c; outline-offset: 3px; }

.altar-block.is-built { --texture: url('@/assets/images/home/progression/blocks/stone_bricks.png'); }
.altar-block.is-corner.is-built { --texture: url('@/assets/images/home/progression/blocks/chiseled_stone_bricks.png'); }
.altar-block.is-core.is-built { --texture: url('@/assets/images/home/progression/blocks/enchanting_table_top.png'); }

.face { position: absolute; inset: 0; display: block; background: var(--texture) center / 100% 100%; image-rendering: pixelated; }
.face--top { transform: translateZ(40px); filter: brightness(1.12); }
.face--left { transform-origin: left; transform: rotateY(-90deg) translateX(-40px); filter: brightness(.62); }
.face--right { transform-origin: bottom; transform: rotateX(90deg) translateY(40px); filter: brightness(.78); }

.altar-block.is-core .face--left,
.altar-block.is-core .face--right { background-image: url('@/assets/images/home/progression/blocks/enchanting_table_side.png'); }
.altar-block.is-candle .face--top { background: url('@/assets/images/home/progression/blocks/candle.png') center / 42% 70% no-repeat; filter: drop-shadow(0 0 8px rgba(245, 201, 98, .75)); }
.altar-block.is-candle .face--left, .altar-block.is-candle .face--right { display: none; }

.altar__beam {
  position: absolute;
  z-index: -1;
  top: 3%;
  bottom: 9%;
  left: 50%;
  width: 44%;
  border-radius: 50%;
  opacity: calc(.16 + var(--build) * .36);
  background: linear-gradient(180deg, transparent, rgba(120, 174, 202, .24) 38%, rgba(137, 209, 183, .2) 69%, transparent);
  transform: translateX(-50%);
  filter: blur(20px);
}

.altar__scroll {
  position: absolute;
  right: 2%;
  bottom: 2%;
  display: grid;
  gap: 5px;
  padding: 13px 15px;
  border: 1px solid rgba(223, 185, 104, .32);
  border-radius: 10px;
  background: rgba(8, 25, 25, .85);
  transform: translateY(calc((1 - var(--build)) * 18px));
}
.altar__scroll span { color: #dfb968; font: 650 .54rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.altar__scroll strong { color: #fcf9f2; font-size: .72rem; }

@media (max-width: 680px) {
  .altar { width: 340px; height: 270px; }
  .altar__grid { width: 210px; height: 210px; }
  .altar-block { top: calc(var(--z) * 68px); left: calc(var(--x) * 68px); width: 61px; height: 61px; transform: translateZ(calc(var(--y) * 31px + 12px + clamp(0, (var(--build) - var(--order) * .045) * 1.5, 1) * 13px)); }
  .face--top { transform: translateZ(28px); }
  .face--left { transform: rotateY(-90deg) translateX(-28px); }
  .face--right { transform: rotateX(90deg) translateY(28px); }
  .altar__scroll { right: 0; bottom: 0; }
}
</style>
