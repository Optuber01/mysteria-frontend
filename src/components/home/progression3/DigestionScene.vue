<template>
  <div class="digestion-scene" role="group" aria-label="Potion digestion through normal play">
    <div class="digestion-scene__map" aria-hidden="true"><i /><i /><i /></div>
    <div class="digestion-scene__player" :style="playerStyle">
      <MinecraftPlayer mode="walk" :active="active" :progress="p" />
    </div>
    <p class="digestion-scene__label">SEQUENCE 9 · IN PROGRESS</p>

    <div class="activity-trail" :style="trailStyle" aria-label="Ways to digest the current potion">
      <button v-for="(activity, index) in activities" :key="activity.id" type="button" class="activity-trail__node hotspot"
        :style="nodeStyle(index)" @mouseenter="inspect(activity.id, $event)" @mouseleave="emit('clear-inspect')"
        @focus="inspect(activity.id, $event)" @blur="emit('clear-inspect')" @click="inspect(activity.id, $event)">
        <img :src="activity.icon" alt="" width="32" height="32" decoding="async" draggable="false">
        <span>{{ activity.label }}</span>
      </button>
    </div>

    <section class="digest-ledger" :style="ledgerStyle" aria-label="Digestion progress">
      <div class="digest-ledger__top"><span>Digestion</span><strong>{{ digestion }}%</strong></div>
      <div class="digest-ledger__meter" aria-hidden="true"><i :style="{ width: `${digestion}%` }" /><b class="at-95">95</b></div>
      <p>Live your acting method through regular play. At 95%, you can attempt the next Sequence; at 100%, the current potion is fully digested.</p>
    </section>

    <button type="button" class="next-prep hotspot" :style="nextStyle" @mouseenter="inspect('prepare-next', $event)" @mouseleave="emit('clear-inspect')"
      @focus="inspect('prepare-next', $event)" @blur="emit('clear-inspect')" @click="inspect('prepare-next', $event)">
      <img :src="ritualBook" alt="" width="48" height="48" decoding="async" draggable="false">
      <span><small>WHILE YOU DIGEST</small><strong>Prepare the next formula & ritual</strong></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import MinecraftPlayer from '../MinecraftPlayer.vue';
import ritualBook from '@/assets/images/home/progression/real/ritual-book-tier2.png';
import actingBottle from '@/assets/images/home/progression/real/acting-bottle-medium.png';
import goldMint from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import potion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = defineProps<{ progress: number; active: boolean }>();
const emit = defineEmits<{ (e: 'inspect', id: string, anchor: HTMLElement): void; (e: 'clear-inspect'): void }>();
const p = computed(() => Math.min(1, Math.max(0, Number.isFinite(props.progress) ? props.progress : 0)));
const digestion = computed(() => Math.round(18 + p.value * 77));
const activities = [
  { id: 'act-sequence', label: 'Act', icon: potion },
  { id: 'take-bounty', label: 'Bounty', icon: actingBottle },
  { id: 'passive-play', label: 'Explore', icon: goldMint },
  { id: 'dungeons', label: 'Dungeon', icon: ritualBook },
  { id: 'incursions', label: 'Incursion', icon: actingBottle },
];
function inspect(id: string, event: Event) { if (event.currentTarget instanceof HTMLElement) emit('inspect', id, event.currentTarget); }
const playerStyle = computed<CSSProperties>(() => ({ transform: `translateX(${(-18 + p.value * 38).toFixed(1)}%)`, opacity: Math.min(1, p.value * 4).toFixed(3) }));
const trailStyle = computed<CSSProperties>(() => ({ opacity: Math.min(1, p.value * 3).toFixed(3) }));
function nodeStyle(index: number): CSSProperties { const show = Math.min(1, Math.max(0, (p.value - index * .12) / .22)); return { opacity: show.toFixed(3), transform: `translateY(${((1 - show) * 18).toFixed(1)}px)` }; }
const ledgerStyle = computed<CSSProperties>(() => ({ opacity: Math.min(1, Math.max(0, (p.value - .22) / .3)).toFixed(3) }));
const nextStyle = computed<CSSProperties>(() => ({ opacity: Math.min(1, Math.max(0, (p.value - .55) / .24)).toFixed(3), transform: `translateY(${Math.max(0, (.8 - p.value) * 34).toFixed(1)}px)` }));
</script>

<style scoped>
.digestion-scene{position:absolute;inset:0;overflow:hidden;color:#fcf9f2;font-family:"IBM Plex Mono",monospace}.digestion-scene__map{position:absolute;inset:8% 4%;border:1px solid rgba(223,185,104,.12);border-radius:50%;background:radial-gradient(ellipse at 56% 50%,rgba(74,142,118,.2),transparent 52%)}.digestion-scene__map i{position:absolute;width:8px;height:8px;border-radius:50%;background:#dfb968;box-shadow:0 0 14px #dfb968}.digestion-scene__map i:nth-child(1){top:22%;left:18%}.digestion-scene__map i:nth-child(2){right:19%;bottom:27%}.digestion-scene__map i:nth-child(3){top:38%;right:27%}.digestion-scene__player{position:absolute;z-index:2;bottom:2%;left:5%;width:min(170px,25vw);height:72%;transition:transform .12s linear}.digestion-scene__label{position:absolute;top:7%;left:7%;margin:0;color:#dfb968;font:700 .62rem/1 "IBM Plex Mono",monospace;letter-spacing:.15em}.activity-trail{position:absolute;z-index:3;top:24%;left:31%;right:4%;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.activity-trail::before{position:absolute;top:24px;right:8%;left:8%;height:1px;background:rgba(223,185,104,.34);content:""}.activity-trail__node{position:relative;z-index:1;display:grid;justify-items:center;gap:7px;padding:0;border:0;color:#fcf9f2;background:transparent;font:600 .54rem/1 "IBM Plex Mono",monospace;cursor:pointer}.activity-trail__node img{width:42px;height:42px;padding:5px;border:1px solid rgba(223,185,104,.32);border-radius:50%;background:#0a2020;image-rendering:pixelated}.activity-trail__node:hover img,.activity-trail__node:focus-visible img{border-color:#f0d38c;box-shadow:0 0 0 4px rgba(223,185,104,.13)}.activity-trail__node:focus-visible{outline:0}.digest-ledger{position:absolute;z-index:4;right:6%;bottom:17%;width:min(330px,48%);padding:17px;border:1px solid rgba(223,185,104,.22);border-radius:12px;background:rgba(5,20,21,.84);box-shadow:0 18px 40px rgba(0,0,0,.23)}.digest-ledger__top{display:flex;justify-content:space-between;color:#dfb968;font:650 .65rem/1 "IBM Plex Mono",monospace;text-transform:uppercase}.digest-ledger__meter{position:relative;height:7px;margin:13px 0 10px;background:rgba(252,249,242,.12)}.digest-ledger__meter i{display:block;height:100%;background:linear-gradient(90deg,#4d947b,#dfb968)}.digest-ledger__meter .at-95{position:absolute;top:12px;right:5%;color:rgba(252,249,242,.45);font-size:.46rem}.digest-ledger p{margin:0;color:rgba(252,249,242,.65);font:500 .58rem/1.5 "IBM Plex Mono",monospace}.next-prep{position:absolute;z-index:4;right:7%;bottom:3%;display:flex;align-items:center;gap:10px;padding:9px 13px;border:1px solid rgba(127,199,165,.26);border-radius:10px;color:#fcf9f2;background:rgba(7,27,27,.88);text-align:left;cursor:pointer}.next-prep img{width:38px;height:38px;image-rendering:pixelated}.next-prep small,.next-prep strong{display:block}.next-prep small{margin-bottom:4px;color:#9bcbb5;font:650 .48rem/1 "IBM Plex Mono",monospace;letter-spacing:.12em}.next-prep strong{font:600 .62rem/1.2 "IBM Plex Mono",monospace}.next-prep:hover,.next-prep:focus-visible{border-color:#dfb968;outline:none}@media(max-width:820px){.digestion-scene__player{left:0;width:130px;height:60%}.activity-trail{top:22%;left:26%;right:0;gap:1px}.activity-trail__node img{width:31px;height:31px}.activity-trail__node{font-size:.42rem}.digest-ledger{right:3%;bottom:18%;width:57%;padding:11px}.next-prep{right:3%;bottom:2%;max-width:62%;padding:7px}.next-prep strong{font-size:.5rem}} 
</style>
