<template>
  <section id="join" class="join" aria-labelledby="join-title">
    <div class="join-night" aria-hidden="true">
      <i class="join-fog join-fog--far" />
      <i class="join-fog join-fog--near" />
    </div>

    <div class="join-inner">
      <header class="join-intro">
        <p class="fog-label">{{ t('home.join.kicker') }}</p>
        <h2 id="join-title">{{ t('home.join.title') }}</h2>
        <p class="join-statement">{{ t('home.join.statement') }}</p>
      </header>

      <ol class="join-steps" :aria-label="t('home.join.stepsLabel')">
        <li v-for="(step, index) in STEPS" :key="step">
          <span class="join-steps__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ t(`home.join.steps.${step}.title`) }}</strong>
          <p>{{ t(`home.join.steps.${step}.copy`).replace('{address}', SERVER_IP) }}</p>
        </li>
      </ol>

      <div class="join-links">
        <RouterLink class="fog-button fog-button--ghost" :to="$lp('/guide')">
          {{ t('home.join.guide') }}<span aria-hidden="true">→</span>
        </RouterLink>
        <a class="fog-button fog-button--ghost" :href="DISCORD_INVITE" target="_blank" rel="noopener noreferrer">
          {{ t('home.join.discord') }}<span aria-hidden="true">↗</span>
          <span class="visually-hidden">{{ t('home.join.newTab') }}</span>
        </a>
      </div>

      <!-- The moon sets behind the invitation, so it follows the card in every layout. -->
      <div class="join-table">
        <i class="join-moon" aria-hidden="true" />
        <i class="join-reflection" aria-hidden="true" />
        <div class="invitation" role="group" :aria-label="t('home.join.invitationLabel')">
          <p class="invitation__kicker">{{ t('home.join.invitationKicker') }}</p>

          <Transition name="seat" mode="out-in">
            <div
              v-if="selectedPathway"
              :key="selectedPathway.id"
              class="seat"
              role="group"
              :aria-label="t('home.join.seatAria').replace('{name}', selectedName)"
            >
              <span class="seat__sigil">
                <img :src="selectedPathway.thumbnail" alt="" width="72" height="72" decoding="async">
              </span>
              <div class="seat__text">
                <small aria-hidden="true">{{ t('home.join.seatLabel') }}</small>
                <strong aria-hidden="true">{{ selectedName }}</strong>
                <RouterLink class="seat__link" :to="$lp(selectedPathway.route)">
                  {{ t('home.join.seatLink').replace('{name}', selectedName) }}<span aria-hidden="true">→</span>
                </RouterLink>
              </div>
            </div>
            <div v-else key="empty" class="seat seat--empty">
              <span class="seat__sigil" aria-hidden="true">
                <svg viewBox="0 0 48 48"><path d="M16 23V9.5C16 6 32 6 32 9.5V23" /><path d="M12 23h24v5H12z" /><path d="M14.5 28v13M33.5 28v13" /></svg>
              </span>
              <div class="seat__text">
                <small>{{ t('home.join.seatLabel') }}</small>
                <strong>{{ t('home.join.emptySeatTitle') }}</strong>
                <p>{{ t('home.join.emptySeatCopy') }}</p>
                <a class="seat__link" href="#pathways">{{ t('home.join.emptySeatLink') }}<span aria-hidden="true">↑</span></a>
              </div>
            </div>
          </Transition>

          <div class="invitation__address" :class="`is-${copyState}`">
            <span>
              <small>{{ t('home.join.addressLabel') }}</small>
              <strong ref="addressRef">{{ SERVER_IP }}</strong>
            </span>
            <button type="button" @click="copyAddress">
              <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15V6a1 1 0 0 1 1-1h9" /></svg>
              {{ t(COPY_LABEL_KEYS[copyState]) }}
            </button>
          </div>
          <!-- Always rendered with a reserved line, so feedback never moves the card. -->
          <p class="invitation__feedback" :class="`is-${copyState}`" role="status">{{ copyFeedback }}</p>

          <RouterLink class="fog-button invitation__cta" :to="$lp('/guide/connect')">
            {{ t('home.join.connectCta') }}<span aria-hidden="true">→</span>
          </RouterLink>
          <p class="invitation__note">{{ t('home.join.note') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { SERVER_IP } from '@/composables/useServer';
import { useI18n } from '@/composables/useI18n';
import { localize, type HomePathway } from '@/data/homePathways';

const DISCORD_INVITE = 'https://discord.com/invite/jc7GSxBWgb';
const STEPS = ['connect', 'choose', 'firstStep'] as const;
const COPIED_MS = 2400;

type CopyState = 'idle' | 'copied' | 'failed';
const COPY_LABEL_KEYS: Record<CopyState, string> = {
  idle: 'home.join.copy',
  copied: 'home.join.copied',
  failed: 'home.join.retry',
};

const props = defineProps<{ selectedPathway?: HomePathway | null }>();
const { t, currentLanguage } = useI18n();
const addressRef = ref<HTMLElement | null>(null);
const copyState = ref<CopyState>('idle');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

const selectedPathway = computed(() => props.selectedPathway ?? null);
const selectedName = computed(() => selectedPathway.value ? localize(selectedPathway.value.name, currentLanguage.value) : '');
const copyFeedback = computed(() => {
  if (copyState.value === 'copied') return t('home.join.copiedAnnouncement');
  if (copyState.value === 'failed') return t('home.join.copyFailed').replace('{address}', SERVER_IP);
  return '';
});

/** Leaves the address selected so a blocked clipboard is one keystroke from done. */
function selectAddress() {
  const node = addressRef.value;
  const selection = window.getSelection();
  if (!node || !selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
    selectAddress();
  }
  if (copyTimer) clearTimeout(copyTimer);
  // A failure stays up until the next attempt: the address has to be copied by hand.
  copyTimer = copyState.value === 'copied' ? setTimeout(() => (copyState.value = 'idle'), COPIED_MS) : null;
}

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<style scoped>
/* The end of the séance: the darkest fog, the moon sinking into it, one paper invitation. */
.join {
  position: relative;
  min-height: 100svh;
  display: grid;
  align-content: center;
  overflow: hidden;
  padding: clamp(104px, 13vh, 150px) 0 clamp(96px, 12vh, 140px);
  color: var(--bone);
  background: var(--fog-0);
  isolation: isolate;
}

/* ---- Night: a low crimson moon, its reflection, fog drifting across both ---- */
.join-night {
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
}

.join-night > *,
.join-table > i {
  position: absolute;
  pointer-events: none;
}

.join-moon {
  right: calc(100% - var(--moon) * .3);
  bottom: 22%;
  width: var(--moon);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 42%, rgba(50, 4, 10, .24), transparent 16%),
    radial-gradient(circle at 62% 64%, rgba(50, 4, 10, .18), transparent 21%),
    radial-gradient(circle at 70% 30%, rgba(50, 4, 10, .14), transparent 11%),
    radial-gradient(circle at 50% 50%, #a51d28 0%, #8e1720 60%, #6c1018 100%);
  box-shadow:
    inset -10px -14px 40px rgba(20, 2, 5, .45),
    0 0 50px 6px rgba(179, 32, 43, .26),
    0 0 180px 60px rgba(179, 32, 43, .1);
  opacity: .78;
  /* The horizon cuts the moon: its lower part sinks into the fog bank. */
  mask-image: linear-gradient(180deg, #000 52%, transparent 86%);
}

/* Broken horizontal strokes under the moon, like its light on still water. */
.join-reflection {
  right: calc(100% - var(--moon) * .1);
  top: 78%;
  width: calc(var(--moon) * .6);
  height: 36%;
  background: repeating-linear-gradient(180deg, rgba(179, 32, 43, .55) 0 1px, transparent 1px 8px);
  opacity: .45;
  mask-image: radial-gradient(ellipse 50% 100% at 50% 0%, #000 10%, transparent 75%);
}

.join-fog {
  left: -50%;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.join-fog--far {
  bottom: 22%;
  height: 34%;
  background-image:
    radial-gradient(ellipse 20% 30% at 14% 60%, rgba(176, 184, 196, .1), transparent 70%),
    radial-gradient(ellipse 24% 26% at 46% 50%, rgba(176, 184, 196, .08), transparent 70%),
    radial-gradient(ellipse 22% 30% at 78% 62%, rgba(176, 184, 196, .1), transparent 70%);
  animation: join-fog-drift 90s linear infinite;
}

.join-fog--near {
  bottom: -6%;
  height: 44%;
  background-image:
    radial-gradient(ellipse 28% 40% at 22% 72%, rgba(200, 206, 214, .13), transparent 72%),
    radial-gradient(ellipse 22% 34% at 56% 80%, rgba(200, 206, 214, .1), transparent 72%),
    radial-gradient(ellipse 28% 42% at 86% 70%, rgba(200, 206, 214, .13), transparent 72%);
  animation: join-fog-drift 60s linear infinite reverse;
}

.join-night::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--fog-0) 0%, transparent 18%, transparent 80%, var(--fog-0) 100%),
    radial-gradient(ellipse 90% 80% at 60% 55%, transparent 45%, rgba(7, 8, 11, .65) 100%);
}

@keyframes join-fog-drift {
  to { transform: translate3d(-25%, 0, 0); }
}

/* ---- Layout: the statement and steps on the left, the invitation on the right ---- */
.join-inner {
  display: grid;
  grid-template-columns: minmax(0, 600px) minmax(340px, 440px);
  grid-template-areas:
    "intro card"
    "steps card"
    "links card";
  grid-template-rows: auto auto 1fr;
  justify-content: space-between;
  column-gap: clamp(48px, 7vw, 120px);
  padding: 0 var(--home-rail-inset, clamp(20px, 4vw, 56px));
}

.join-intro { grid-area: intro; }
.join-steps { grid-area: steps; }
.join-links { grid-area: links; }

.join-table {
  --moon: clamp(160px, 18vw, 260px);
  position: relative;
  grid-area: card;
  align-self: center;
}

.join-intro h2 {
  margin: 20px 0 22px;
  color: var(--bone);
  font: 800 clamp(2.75rem, 5vw, 4.5rem)/0.94 var(--font-display);
  text-transform: uppercase;
  letter-spacing: .005em;
  text-wrap: balance;
}

.join-statement {
  max-width: 54ch;
  margin: 0;
  color: var(--ash);
  font-size: clamp(1rem, 1.15vw, 1.0625rem);
  line-height: 1.65;
}

/* ---- Steps: three short beats in a row of hairlines ---- */
.join-steps {
  display: grid;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: none;
}

.join-steps li {
  display: grid;
  grid-template-columns: 44px 1fr;
  column-gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
}

.join-steps li:last-child {
  border-bottom: 1px solid var(--line);
}

.join-steps__number {
  grid-row: span 2;
  padding-top: 3px;
  color: var(--crimson-text);
  font: 500 .78rem/1 var(--font-mono);
  letter-spacing: .12em;
}

.join-steps strong {
  color: var(--bone);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.join-steps p {
  margin: 3px 0 0;
  color: var(--ash);
  font-size: .9rem;
  line-height: 1.5;
}

.join-links {
  display: flex;
  flex-wrap: wrap;
  align-content: start;
  gap: 12px;
  margin-top: 32px;
}

.join-links .fog-button span[aria-hidden] {
  transition: transform .2s var(--ease-out);
}

.join-links .fog-button:hover span[aria-hidden] {
  transform: translateX(2px);
}

/* ---- The invitation: a calling card, the only paper in the chapter ---- */
.invitation {
  --card-focus: var(--paper-ink);
  position: relative;
  margin-top: 12px;
  padding: 30px 30px 26px;
  border-radius: 4px;
  color: var(--paper-ink);
  background:
    radial-gradient(ellipse 120% 90% at 30% 20%, rgba(255, 255, 255, .22), transparent 60%),
    radial-gradient(ellipse 140% 120% at 50% 50%, transparent 60%, rgba(90, 82, 70, .18) 100%),
    var(--paper);
  box-shadow: var(--shadow-deep), 0 2px 0 rgba(0, 0, 0, .2);
  transform: rotate(-1.2deg);
}

/* A printed double rule, inset like an engraved card. */
.invitation::before {
  content: "";
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(29, 27, 23, .22);
  outline: 1px solid rgba(29, 27, 23, .1);
  outline-offset: -4px;
  border-radius: 2px;
  pointer-events: none;
}

.invitation :where(a, button):focus-visible {
  outline-color: var(--card-focus);
}

.invitation__kicker {
  margin: 0;
  color: var(--paper-ink-muted);
  font: 500 .7rem/1.4 var(--font-mono);
  letter-spacing: .14em;
  text-align: center;
  text-transform: uppercase;
}

/* ---- The seat ---- */
.seat {
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  gap: 18px;
  margin: 22px 0 0;
  padding-bottom: 22px;
  border-bottom: 1px dashed rgba(29, 27, 23, .3);
}

.seat__sigil {
  position: relative;
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, var(--fog-3), var(--fog-0) 78%);
  box-shadow: 0 0 0 3px var(--paper), 0 0 0 4px var(--crimson), 0 10px 24px rgba(29, 27, 23, .3);
}

.seat__sigil::after {
  content: "";
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(229, 84, 93, .4);
  border-radius: 50%;
}

.seat__sigil img {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.seat--empty .seat__sigil {
  background: transparent;
  box-shadow: none;
  border: 1.5px dashed rgba(29, 27, 23, .38);
}

.seat--empty .seat__sigil::after {
  display: none;
}

.seat__sigil svg {
  width: 44px;
  height: 44px;
  fill: none;
  stroke: var(--paper-ink-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.seat__text {
  display: grid;
  justify-items: start;
  min-width: 0;
}

.seat__text small {
  color: var(--paper-ink-muted);
  font: 500 .7rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.seat__text strong {
  margin-top: 6px;
  color: var(--paper-ink);
  font: 800 2rem/0.94 var(--font-display);
  text-transform: uppercase;
  letter-spacing: .005em;
  overflow-wrap: anywhere;
}

.seat__text p {
  margin: 6px 0 0;
  color: var(--paper-ink-muted);
  font-size: .86rem;
  line-height: 1.45;
}

.seat__link {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: var(--crimson);
  font-size: .86rem;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: rgba(179, 32, 43, .35);
  text-underline-offset: 3px;
}

.seat__link:hover {
  text-decoration-color: currentColor;
}

/* ---- Address ---- */
.invitation__address {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}

.invitation__address > span {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.invitation__address small {
  color: var(--paper-ink-muted);
  font: 500 .7rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.invitation__address strong {
  color: var(--paper-ink);
  font: 500 1.08rem/1.2 var(--font-mono);
  overflow-wrap: anywhere;
  user-select: all;
}

.invitation__address button {
  flex: none;
  min-width: 8.5em;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid var(--paper-ink);
  border-radius: 999px;
  color: var(--paper);
  background: var(--paper-ink);
  font: 600 .85rem/1 var(--font-body);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease;
}

.invitation__address button:hover {
  background: #36322b;
}

.invitation__address.is-copied button {
  color: var(--paper-ink);
  background: transparent;
}

.invitation__address.is-failed button {
  border-color: var(--crimson);
  background: var(--crimson);
  color: var(--bone);
}

.invitation__address svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.invitation__feedback {
  min-height: calc(2 * 1.45em);
  margin: 8px 0 0;
  color: var(--paper-ink-muted);
  font-size: .8rem;
  font-weight: 600;
  line-height: 1.45;
}

.invitation__feedback.is-failed {
  color: var(--crimson);
}

.invitation__cta {
  width: 100%;
  margin-top: 6px;
}

.invitation__note {
  margin: 14px 0 0;
  color: var(--paper-ink-muted);
  font-size: .78rem;
  line-height: 1.5;
}

/* ---- The seat arriving ---- */
.seat-enter-active,
.seat-leave-active {
  transition: opacity .45s ease, transform .55s var(--ease-out);
}

.seat-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.seat-leave-to {
  opacity: 0;
}

/* Without a wide gap beside the card, the moon would sit under the steps:
   it rises from behind the card's top edge instead. */
@media (max-width: 1320px) {
  .join-moon {
    right: -6%;
    bottom: auto;
    top: -48px;
    mask-image: none;
  }

  .join-reflection {
    display: none;
  }
}

/* ---- One column: statement, steps, the invitation, then the links ---- */
@media (max-width: 960px) {
  .join-inner {
    grid-template-columns: minmax(0, 620px);
    grid-template-areas:
      "intro"
      "steps"
      "card"
      "links";
    grid-template-rows: none;
    justify-content: center;
  }

  .join-table {
    --moon: clamp(130px, 30vw, 200px);
    width: min(100%, 460px);
    justify-self: center;
    margin-top: 56px;
  }

  .invitation {
    margin-top: 0;
    transform: rotate(-.8deg);
  }

  .join-links {
    justify-content: center;
    margin-top: 36px;
  }
}

@media (max-width: 560px) {
  .join {
    min-height: 0;
    padding: 80px 0 64px;
  }

  .join-intro h2 {
    font-size: clamp(2.6rem, 12vw, 3.2rem);
  }

  .invitation {
    padding: 26px 22px 22px;
  }

  .seat {
    grid-template-columns: 72px 1fr;
    gap: 14px;
  }

  .seat__sigil {
    width: 72px;
    height: 72px;
  }

  .seat__text strong {
    font-size: 1.75rem;
  }

  .invitation__address {
    flex-wrap: wrap;
  }

  /* Two quiet links on one line; the invitation already carries the filled action. */
  .join-links {
    justify-content: space-between;
    gap: 4px 16px;
    margin-top: 24px;
  }

  .join-links .fog-button {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    font-size: .9rem;
    text-decoration: underline;
    text-decoration-color: var(--line-strong);
    text-underline-offset: 4px;
  }

  .join-links .fog-button:hover {
    background: none;
    text-decoration-color: currentColor;
  }
}

@media (prefers-reduced-motion: reduce) {
  .join-fog {
    animation: none;
  }

  .seat-enter-active,
  .seat-leave-active,
  .invitation__address button,
  .join-links .fog-button span[aria-hidden] {
    transition: none;
  }
}
</style>
