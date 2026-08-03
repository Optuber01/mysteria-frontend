<template>
  <section class="threshold" aria-labelledby="threshold-title">
    <div class="threshold-aura" aria-hidden="true"></div>
    <div class="threshold-container">
      <header class="threshold-intro">
        <p class="threshold-kicker">{{ copy.kicker }}</p>
        <h2 id="threshold-title">{{ copy.title }}</h2>
        <p>{{ copy.lede }}</p>
      </header>

      <ol class="passage">
        <li v-for="(chapter, index) in copy.chapters" :key="chapter.title" class="passage-chapter">
          <div class="passage-marker" aria-hidden="true"><span>0{{ index + 1 }}</span></div>
          <div class="chapter-visual" :class="`chapter-visual--${index + 1}`" aria-hidden="true">
            <img :src="chapter.image" alt="">
          </div>
          <div class="chapter-copy">
            <p class="chapter-label">{{ chapter.label }}</p>
            <h3>{{ chapter.title }}</h3>
            <p>{{ chapter.description }}</p>
            <ul>
              <li v-for="detail in chapter.details" :key="detail">{{ detail }}</li>
            </ul>
            <RouterLink v-if="chapter.to" :to="chapter.to" class="chapter-link">
              {{ chapter.action }} <IconArrowRight aria-hidden="true" />
            </RouterLink>
            <a v-else :href="chapter.href" class="chapter-link" target="_blank" rel="noreferrer">
              {{ chapter.action }} <IconArrowRight aria-hidden="true" />
            </a>
          </div>
        </li>
      </ol>

      <aside class="threshold-note">
        <div class="note-sigil" aria-hidden="true">✦</div>
        <div>
          <span>{{ copy.noteLabel }}</span>
          <p>{{ copy.note }}</p>
        </div>
        <RouterLink to="/guide">{{ copy.noteAction }} <IconArrowRight aria-hidden="true" /></RouterLink>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IconArrowRight from '@/assets/icons/IconArrowRight.vue'
import foolImage from '@/assets/images/pathways/fool.webp'
import hermitImage from '@/assets/images/pathways/hermit.webp'
import doorImage from '@/assets/images/pathways/door.webp'
import { useI18n } from '@/composables/useI18n'

const { currentLanguage } = useI18n()

const copy = computed(() => currentLanguage.value === 'uk' ? {
  kicker: 'ПЕРШИЙ КРОК ЗА МЕЖУ',
  title: 'Увійдіть до Містеррії',
  lede: 'Не просто виживання з косметичною магією. Тут кожна знахідка, угода й ризик можуть наблизити вас до наступної Послідовності.',
  chapters: [
    { label: 'ПОЧНІТЬ УСВІДОМЛЕНО', title: 'Оберіть не клас, а напрямок', description: 'Після верифікації ви отримаєте перший вибір. Він визначає стартовий бонус, але не замикає вас у Шляху.', details: ['Шлях Рішучості: рецепт у найближчій скрині, без довічної ціни.', 'Шлях Скорочення: здібність Послідовності 9 одразу, але −10% Духовності назавжди.'], action: 'Побачити стартові варіанти', to: '/guide', image: foolImage },
    { label: 'ЗБЕРІТЬ ЗНАННЯ', title: 'Зваріть перше зілля', description: 'Рецепти й інгредієнти не падають з меню. Шукайте скрині, полюйте на істот, торгуйте та зберіть власний магічний казан.', details: ['Перше зілля Послідовності 9 не потребує ритуалу.', 'Правильний порядок інгредієнтів і вищий рівень казана підвищують шанс успіху.'], action: 'Прочитати про магію', href: 'https://wiki.mysterria.net/magic/introduction', image: hermitImage },
    { label: 'ЗАЛИШТЕ СВІЙ СЛІД', title: 'Нехай світ запам’ятає вас', description: 'Подорожуйте без миттєвих телепортів, оселяйтеся в містах або вирушайте самі. Здібності — це не просто ефекти, а інструменти для вашої історії.', details: ['22 Шляхи, ритуали, Духовність і Розлад формують прогрес.', 'Додатковий COI Client додає гарячі клавіші здібностей, колесо та серверні візуальні ефекти.'], action: 'Відкрити архів Шляхів', to: '/pathways', image: doorImage },
  ],
  noteLabel: 'СПОЧАТКУ — СВІЙ ТЕМП', note: 'Java Edition дає повний досвід. Прийміть серверний ресурс-пак, а потім вирушайте до Mysteries з лобі.', noteAction: 'Відкрити повний путівник',
} : {
  kicker: 'THE FIRST STEP BEYOND',
  title: 'Enter Mysterria',
  lede: 'This is not survival with magic painted over it. Every discovery, bargain, and risk can bring you closer to your next Sequence.',
  chapters: [
    { label: 'BEGIN WITH INTENT', title: 'Choose a direction, not a class', description: 'After verification, your first choice shapes a starter bonus. It points you forward; it does not lock you into a Pathway.', details: ['Path of Resolve: a recipe in your next chest, with no permanent cost.', 'Path of Shortcut: Sequence 9 immediately, but −10% Spirituality forever.'], action: 'Compare starter choices', to: '/guide', image: foolImage },
    { label: 'GATHER KNOWLEDGE', title: 'Brew your first potion', description: 'Recipes and ingredients do not arrive through a menu. Search chests, hunt creatures, trade, and build your own Magic Cauldron.', details: ['Your first Sequence 9 potion needs no ritual.', 'Ingredient order and a higher-tier cauldron improve your chance of a successful brew.'], action: 'Read about magic', href: 'https://wiki.mysterria.net/magic/introduction', image: hermitImage },
    { label: 'LEAVE A MARK', title: 'Make the world remember you', description: 'Travel without instant teleports, settle in a town or strike out alone. Abilities are not just effects; they are tools for your story.', details: ['22 Pathways, rituals, Spirituality, and Madness shape advancement.', 'The optional COI Client adds ability hotkeys, a wheel, and server-driven visual effects.'], action: 'Open the Pathway archive', to: '/pathways', image: doorImage },
  ],
  noteLabel: 'START AT YOUR OWN PACE', note: 'Java Edition delivers the complete experience. Accept the server resource pack, then enter Mysteries from the lobby.', noteAction: 'Open the full guide',
})
</script>

<style scoped>
.threshold { position: relative; overflow: clip; padding: clamp(90px, 14vw, 180px) 24px 84px; color: var(--myst-offwhite); background: linear-gradient(180deg, #05070a 0%, #0a0c13 80%, #05070a 100%); }
.threshold::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35; background-image: radial-gradient(rgba(200,178,115,.3) .6px, transparent .7px); background-size: 18px 18px; mask-image: linear-gradient(90deg, transparent, black 22%, black 78%, transparent); }
.threshold-aura { position: absolute; top: 0; left: 50%; width: min(1100px, 100vw); height: 680px; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 12%, rgba(95,112,151,.16), transparent 64%); pointer-events: none; }
.threshold-container { position: relative; max-width: 1120px; margin: auto; }
.threshold-intro { width: min(700px, 100%); margin: 0 auto clamp(68px, 10vw, 128px); text-align: center; }
.threshold-kicker, .chapter-label, .threshold-note span { color: var(--myst-gold); font: 10px 'JetBrains Mono', monospace; letter-spacing: .22em; text-transform: uppercase; }
.threshold-intro h2 { margin: 14px 0 18px; font: 600 clamp(44px, 7vw, 76px)/.95 'Playfair Display', serif; letter-spacing: -.04em; }
.threshold-intro > p:last-child { margin: 0; color: #afb0b9; font-size: clamp(16px, 2vw, 19px); line-height: 1.7; }
.passage { position: relative; display: grid; gap: clamp(72px, 11vw, 136px); margin: 0; padding: 0; list-style: none; }
.passage::before { content: ''; position: absolute; top: 70px; bottom: 70px; left: 50%; width: 1px; background: linear-gradient(transparent, rgba(200,178,115,.5) 8%, rgba(200,178,115,.14) 90%, transparent); }
.passage-chapter { display: grid; grid-template-columns: minmax(0, 1fr) 100px minmax(0, 1fr); align-items: center; min-height: 300px; }
.passage-chapter:nth-child(odd) .chapter-visual { grid-column: 1; grid-row: 1; justify-self: end; }.passage-chapter:nth-child(odd) .chapter-copy { grid-column: 3; grid-row: 1; }.passage-chapter:nth-child(even) .chapter-visual { grid-column: 3; grid-row: 1; justify-self: start; }.passage-chapter:nth-child(even) .chapter-copy { grid-column: 1; grid-row: 1; text-align: right; }.passage-chapter:nth-child(even) .chapter-copy ul { direction: rtl; }.passage-chapter:nth-child(even) .chapter-link { flex-direction: row-reverse; }
.passage-marker { z-index: 2; grid-column: 2; grid-row: 1; display: grid; place-items: center; width: 50px; height: 50px; justify-self: center; border: 1px solid rgba(200,178,115,.58); border-radius: 50%; background: #0a0c13; color: var(--myst-gold); font: 10px 'JetBrains Mono', monospace; box-shadow: 0 0 0 9px rgba(10,12,19,.92), 0 0 28px rgba(200,178,115,.16); }
.chapter-visual { position: relative; width: clamp(180px, 25vw, 270px); aspect-ratio: 1; overflow: hidden; border-radius: 50%; border: 1px solid rgba(200,178,115,.28); background: #111420; box-shadow: 0 26px 56px rgba(0,0,0,.35); }.chapter-visual::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(5,7,10,.06), rgba(5,7,10,.7)); }.chapter-visual img { width: 100%; height: 100%; object-fit: cover; object-position: center; filter: saturate(.72) contrast(1.08); transform: scale(1.1); transition: transform .7s cubic-bezier(.22,1,.36,1), filter .7s ease; }.passage-chapter:hover .chapter-visual img { transform: scale(1.18); filter: saturate(1) contrast(1.04); }.chapter-visual--2 { border-color: rgba(112,144,176,.4); }.chapter-visual--3 { border-color: rgba(172,117,159,.42); }
.chapter-copy { max-width: 408px; }.chapter-copy h3 { margin: 10px 0 12px; font: 600 clamp(30px, 4vw, 46px)/1.02 'Playfair Display', serif; letter-spacing: -.035em; }.chapter-copy > p { margin: 0; color: #acadb6; font-size: 15px; line-height: 1.7; }.chapter-copy ul { display: grid; gap: 9px; margin: 23px 0 23px; padding: 0; list-style: none; }.chapter-copy li { color: #d1d0ca; font-size: 13px; line-height: 1.55; }.chapter-copy li::before { content: '✦'; margin-right: 10px; color: var(--myst-gold); font-size: 9px; }.chapter-link, .threshold-note a { display: inline-flex; align-items: center; gap: 10px; color: var(--myst-gold); font: 10px 'JetBrains Mono', monospace; letter-spacing: .13em; text-decoration: none; text-transform: uppercase; transition: color .25s ease, gap .25s ease; }.chapter-link:hover, .threshold-note a:hover { gap: 15px; color: #f7e0a1; }.chapter-link svg, .threshold-note svg { width: 15px; }
.threshold-note { display: grid; grid-template-columns: 44px 1fr auto; gap: 22px; align-items: center; max-width: 930px; margin: clamp(84px, 12vw, 150px) auto 0; padding: 24px 28px; border-top: 1px solid rgba(200,178,115,.32); border-bottom: 1px solid rgba(200,178,115,.16); background: linear-gradient(90deg, rgba(200,178,115,.08), transparent 65%); }.note-sigil { display: grid; place-items: center; width: 42px; height: 42px; color: var(--myst-gold); border: 1px solid rgba(200,178,115,.35); border-radius: 50%; }.threshold-note p { margin: 5px 0 0; color: #a8a8b0; font-size: 13px; line-height: 1.55; }
@media (max-width: 720px) { .threshold { padding-inline: 18px; }.threshold-intro { text-align: left; }.passage { gap: 72px; }.passage::before { top: 48px; bottom: 48px; left: 24px; }.passage-chapter, .passage-chapter:nth-child(n) { grid-template-columns: 48px minmax(0, 1fr); gap: 0 20px; align-items: start; min-height: 0; }.passage-marker { grid-column: 1; grid-row: 1; width: 48px; height: 48px; }.chapter-copy, .passage-chapter:nth-child(n) .chapter-copy { grid-column: 2; grid-row: 1; max-width: none; text-align: left; }.passage-chapter:nth-child(even) .chapter-copy ul { direction: ltr; }.chapter-visual, .passage-chapter:nth-child(n) .chapter-visual { display: none; }.chapter-copy h3 { font-size: clamp(30px, 9vw, 42px); }.threshold-note { grid-template-columns: 38px 1fr; padding: 20px 0; background: none; }.threshold-note a { grid-column: 2; justify-self: start; margin-top: 4px; } }
@media (prefers-reduced-motion: reduce) { .chapter-visual img { transition: none; } }
</style>
