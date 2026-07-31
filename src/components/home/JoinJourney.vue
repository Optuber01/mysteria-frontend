<template>
  <section id="join" class="join" aria-labelledby="join-title">
    <div class="join-image" aria-hidden="true">
      <img src="@/assets/images/optimized/banner.webp" alt="" width="1920" height="1080" loading="lazy">
    </div>
    <div class="join-shell">
      <header class="join-header">
        <p class="home-eyebrow">Join Mysterria</p>
        <h2 id="join-title">Your first potion starts here.</h2>
        <p>
          Connect from Java or Bedrock, accept the server resource pack and
          follow the in-world progression.
        </p>
      </header>

      <div class="join-flow">
        <nav aria-label="Join steps">
          <button
            v-for="(step, index) in steps"
            :key="step.title"
            type="button"
            :class="{ active: activeStep === index }"
            :aria-current="activeStep === index ? 'step' : undefined"
            @click="activeStep = index"
          >
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ step.title }}</strong>
          </button>
        </nav>

        <article class="join-guide">
          <span>STEP {{ activeStep + 1 }} / {{ steps.length }}</span>
          <h3>{{ active.title }}</h3>
          <p>{{ active.copy }}</p>

          <div v-if="activeStep === 0" class="address-box">
            <code>{{ MYSTERRIA_ADDRESS }}</code>
            <button type="button" @click="copyAddress">{{ copied ? 'Copied' : 'Copy address' }}</button>
          </div>

          <fieldset v-else-if="activeStep === 1" class="platform-choice">
            <legend>Choose your edition</legend>
            <button
              v-for="option in ['Java', 'Bedrock']"
              :key="option"
              type="button"
              :class="{ active: platform === option }"
              :aria-pressed="platform === option"
              @click="platform = option"
            >
              <i aria-hidden="true">{{ option === 'Java' ? 'J' : 'B' }}</i>
              <span><strong>{{ option }}</strong>Minecraft edition</span>
              <b aria-hidden="true">{{ platform === option ? '✓' : '' }}</b>
            </button>
          </fieldset>

          <button
            v-if="activeStep < steps.length - 1"
            class="next-step"
            type="button"
            @click="activeStep++"
          >
            Next step <span aria-hidden="true">→</span>
          </button>
        </article>
      </div>

      <div class="join-actions">
        <button class="copy-primary" type="button" @click="copyAddress">
          <span>
            <small>Server address</small>
            <strong>{{ copied ? 'Copied to clipboard' : MYSTERRIA_ADDRESS }}</strong>
          </span>
          <i aria-hidden="true">{{ copied ? '✓' : '⧉' }}</i>
        </button>
        <RouterLink to="/guide">Beginner guide <span aria-hidden="true">↗</span></RouterLink>
        <a href="https://discord.com/invite/jc7GSxBWgb" target="_blank" rel="noreferrer">
          Community <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';

const steps = [
  { title: 'Copy server address', copy: 'Add Mysterria to your multiplayer server list.' },
  { title: 'Choose Java or Bedrock', copy: 'Mysterria supports both Minecraft editions.' },
  { title: 'Accept resource pack', copy: 'Allow the server resource pack when Minecraft prompts you.' },
  { title: 'Enter the world', copy: 'Connect to the server and follow the in-world onboarding.' },
  { title: 'Begin progression', copy: 'Choose a Pathway, find ingredients and work toward your first potion.' },
];

const activeStep = ref(0);
const platform = ref('Java');
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;
const active = computed(() => steps[activeStep.value]);

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.join {
  position: relative;
  min-height: 100svh;
  display: grid;
  align-items: center;
  padding: clamp(100px, 12vw, 170px) clamp(18px, 5vw, 74px);
  overflow: hidden;
  color: #f5f0e6;
  background: #08151a;
  isolation: isolate;
}
.join-image { position: absolute; inset: 0; z-index: -1; }
.join-image img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.45) contrast(1.08); }
.join-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8, 21, 26, .98), rgba(8, 21, 26, .77) 58%, rgba(8, 21, 26, .5)),
    linear-gradient(0deg, #08151a, transparent 35%, rgba(8, 21, 26, .68));
}
.join-shell { width: min(1380px, 100%); margin: auto; }
.join-header { max-width: 900px; }
.home-eyebrow { margin: 0 0 18px; color: #d7b978; font: 600 10px/1 "IBM Plex Mono", monospace; letter-spacing: .18em; text-transform: uppercase; }
.join-header h2 { margin: 0; font: 650 clamp(3.8rem, 8vw, 8rem)/.82 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.06em; }
.join-header > p { max-width: 620px; margin: 28px 0 0; color: rgba(245, 240, 230, .62); font-size: 1.05rem; line-height: 1.7; }

.join-flow {
  display: grid;
  grid-template-columns: .7fr 1.3fr;
  gap: clamp(34px, 7vw, 100px);
  margin-top: clamp(50px, 7vw, 90px);
}
.join-flow nav { display: grid; align-content: start; }
.join-flow nav button {
  min-height: 54px;
  display: grid;
  grid-template-columns: 38px 1fr;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border: 0;
  border-bottom: 1px solid rgba(245, 240, 230, .1);
  color: rgba(245, 240, 230, .4);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.join-flow nav button:hover,
.join-flow nav button.active { color: #f5f0e6; background: rgba(245, 240, 230, .035); }
.join-flow nav span { color: #d7b978; font: 600 9px/1 "IBM Plex Mono", monospace; }
.join-flow nav strong { font-size: .78rem; }

.join-guide {
  min-height: 350px;
  padding: clamp(24px, 4vw, 48px);
  border: 1px solid rgba(245, 240, 230, .14);
  border-radius: 26px;
  background: rgba(8, 21, 26, .75);
  backdrop-filter: blur(18px);
}
.join-guide > span { color: #d7b978; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .14em; }
.join-guide h3 { margin: 18px 0 12px; font: 650 clamp(2.4rem, 5vw, 4.6rem)/.9 "IBM Plex Sans Condensed", sans-serif; }
.join-guide > p { max-width: 580px; margin: 0; color: rgba(245, 240, 230, .62); line-height: 1.6; }

.address-box {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-top: 34px;
  padding: 8px;
  border: 1px solid rgba(245, 240, 230, .14);
  border-radius: 14px;
}
.address-box code { align-self: center; padding: 0 14px; color: #f5f0e6; font: 600 12px/1 "IBM Plex Mono", monospace; overflow-wrap: anywhere; }
.address-box button,
.next-step {
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  color: #102924;
  background: #d7b978;
  cursor: pointer;
  font-weight: 800;
}

.platform-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 30px 0 0; padding: 0; border: 0; }
.platform-choice legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.platform-choice button {
  min-height: 72px;
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(245, 240, 230, .14);
  border-radius: 13px;
  color: #f5f0e6;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.platform-choice button.active { border-color: #d7b978; background: rgba(215, 185, 120, .08); }
.platform-choice i { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 9px; color: #102924; background: #f5f0e6; font: 700 14px/1 "IBM Plex Mono", monospace; font-style: normal; }
.platform-choice span { display: grid; gap: 4px; color: rgba(245, 240, 230, .45); font-size: .68rem; }
.platform-choice strong { color: #f5f0e6; font-size: .82rem; }
.platform-choice b { color: #d7b978; }
.next-step { display: flex; align-items: center; gap: 14px; margin-top: 28px; }

.join-actions {
  display: grid;
  grid-template-columns: minmax(300px, 1.4fr) .6fr .6fr;
  gap: 10px;
  margin-top: 18px;
}
.copy-primary,
.join-actions > a {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  border: 1px solid rgba(245, 240, 230, .14);
  border-radius: 14px;
  color: #f5f0e6;
  background: rgba(8, 21, 26, .74);
  cursor: pointer;
  backdrop-filter: blur(14px);
}
.copy-primary { border-color: #d7b978; color: #102924; background: #f5f0e6; text-align: left; }
.copy-primary span { display: grid; gap: 5px; }
.copy-primary small { font: 600 8px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; opacity: .58; }
.copy-primary strong { font: 700 12px/1 "IBM Plex Mono", monospace; }
.copy-primary i { font-size: 1.2rem; font-style: normal; }
.join-actions > a { font-size: .78rem; font-weight: 700; }

@media (max-width: 800px) {
  .join-flow { grid-template-columns: 1fr; }
  .join-flow nav { grid-template-columns: repeat(5, 1fr); }
  .join-flow nav button { min-width: 44px; grid-template-columns: 1fr; place-items: center; padding: 7px 0; border-bottom: 2px solid rgba(245, 240, 230, .1); }
  .join-flow nav strong { display: none; }
  .join-flow nav button.active { border-color: #d7b978; }
  .join-actions { grid-template-columns: 1fr 1fr; }
  .copy-primary { grid-column: 1 / -1; }
}
@media (max-width: 500px) {
  .join { padding-inline: 16px; }
  .join-header h2 { font-size: clamp(3.5rem, 19vw, 5.5rem); }
  .join-guide { min-height: 390px; padding: 24px 18px; }
  .address-box { grid-template-columns: 1fr; }
  .address-box code { min-height: 44px; display: flex; align-items: center; }
  .platform-choice { grid-template-columns: 1fr; }
  .join-actions { grid-template-columns: 1fr; }
  .copy-primary { grid-column: auto; }
}
</style>
