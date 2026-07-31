<template>
  <section class="living" aria-labelledby="living-title">
    <div class="living-shell">
      <header class="living-header">
        <div>
          <p class="home-eyebrow">Living world</p>
          <h2 id="living-title">What is happening right now.</h2>
        </div>
        <p>
          Live values come from server sources. Missing integrations are shown
          as unavailable—never filled with invented activity.
        </p>
      </header>

      <div class="live-ledger">
        <article class="live-primary">
          <span class="live-label">Players online</span>
          <strong v-if="status.state === 'online' && status.playersOnline !== null">
            {{ status.playersOnline }}
          </strong>
          <strong v-else class="unavailable">{{ stateText }}</strong>
          <div class="server-line">
            <i :class="`state-${status.state}`" />
            {{ MYSTERRIA_ADDRESS }}
          </div>
        </article>

        <article>
          <span class="live-label">Active towns / organizations</span>
          <strong v-if="living.towns !== null || living.organizations !== null">
            {{ living.towns ?? '—' }} / {{ living.organizations ?? '—' }}
          </strong>
          <strong v-else class="unavailable">Unavailable</strong>
          <p>{{ living.towns !== null || living.organizations !== null ? 'Towns / organizations' : 'Awaiting a verified world-data API.' }}</p>
        </article>

        <article>
          <span class="live-label">Current world event</span>
          <strong v-if="living.currentEvent">{{ living.currentEvent }}</strong>
          <strong v-else class="unavailable">Unavailable</strong>
          <p>{{ living.currentEvent ? 'Reported by the live world feed.' : 'No event feed is connected.' }}</p>
        </article>

        <article>
          <span class="live-label">Recent discovery</span>
          <strong v-if="living.recentDiscovery">{{ living.recentDiscovery }}</strong>
          <strong v-else class="unavailable">Unavailable</strong>
          <p>{{ living.recentDiscovery ? 'Reported by the live world feed.' : 'No discovery feed is connected.' }}</p>
        </article>

        <article class="latest-update">
          <span class="live-label">Latest update</span>
          <template v-if="latestUpdate">
            <strong>{{ latestUpdate.title }}</strong>
            <RouterLink :to="`/news/${latestUpdate.slug}`">
              Read update <span aria-hidden="true">↗</span>
            </RouterLink>
          </template>
          <template v-else>
            <strong class="unavailable">Unavailable</strong>
            <p>The news service did not return an update.</p>
          </template>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  getLivingWorldSnapshot,
  MYSTERRIA_ADDRESS,
  type LivingWorldSnapshot,
  type ServerStatus,
} from '@/services/serverStatus';

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string } | null;
}>();
const living = ref<LivingWorldSnapshot>({
  towns: null,
  organizations: null,
  currentEvent: null,
  recentDiscovery: null,
});

const stateText = computed(() => {
  if (props.status.state === 'loading') return 'Checking…';
  if (props.status.state === 'offline') return 'Server offline';
  return 'Unavailable';
});

onMounted(async () => {
  try {
    living.value = await getLivingWorldSnapshot();
  } catch {
    // Keep explicit unavailable states.
  }
});
</script>

<style scoped>
.living {
  padding: clamp(90px, 12vw, 170px) clamp(18px, 5vw, 74px);
  color: #f5f0e6;
  background: #132c2a;
}
.living-shell { width: min(1380px, 100%); margin: auto; }
.living-header {
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  align-items: end;
  gap: 60px;
  margin-bottom: clamp(48px, 7vw, 90px);
}
.home-eyebrow { margin: 0 0 18px; color: #d7b978; font: 600 10px/1 "IBM Plex Mono", monospace; letter-spacing: .18em; text-transform: uppercase; }
.living h2 { margin: 0; font: 650 clamp(3.4rem, 7vw, 7rem)/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.055em; }
.living-header > p { margin: 0 0 8px; color: rgba(245, 240, 230, .58); line-height: 1.7; }
.live-ledger {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  border-top: 1px solid rgba(245, 240, 230, .14);
  border-left: 1px solid rgba(245, 240, 230, .14);
}
.live-ledger article {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(22px, 3vw, 38px);
  border-right: 1px solid rgba(245, 240, 230, .14);
  border-bottom: 1px solid rgba(245, 240, 230, .14);
}
.live-primary { grid-row: span 2; min-height: 420px !important; }
.latest-update { grid-column: span 2; }
.live-label { color: rgba(245, 240, 230, .44); font: 500 9px/1.2 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.live-ledger strong { display: block; margin: auto 0; font: 650 clamp(1.7rem, 3vw, 3.3rem)/1 "IBM Plex Sans Condensed", sans-serif; }
.live-primary > strong { font-size: clamp(5rem, 12vw, 10rem); color: #d7b978; }
.live-ledger strong.unavailable { color: rgba(245, 240, 230, .32); font-size: clamp(1.4rem, 2.3vw, 2.4rem); }
.live-ledger p { margin: 12px 0 0; color: rgba(245, 240, 230, .4); font-size: .78rem; }
.server-line { display: flex; align-items: center; gap: 9px; color: rgba(245, 240, 230, .6); font: 500 10px/1 "IBM Plex Mono", monospace; }
.server-line i { width: 8px; height: 8px; border-radius: 50%; background: #71817e; }
.server-line i.state-online { background: #68c19c; }
.server-line i.state-offline { background: #c98267; }
.latest-update a { align-self: flex-start; margin-top: 18px; color: #d7b978; font-size: .8rem; font-weight: 700; }
@media (max-width: 900px) {
  .living-header { grid-template-columns: 1fr; gap: 22px; }
  .live-ledger { grid-template-columns: 1fr 1fr; }
  .live-primary { grid-row: auto; min-height: 270px !important; }
  .latest-update { grid-column: span 2; }
}
@media (max-width: 560px) {
  .live-ledger { grid-template-columns: 1fr; }
  .latest-update { grid-column: auto; }
  .live-ledger article { min-height: 180px; }
}
</style>
