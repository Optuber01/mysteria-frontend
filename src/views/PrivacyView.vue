<template>
  <div class="legal-ritual-page page-container">
    <HeaderItem/>
    <main id="main-content" class="legal-ritual-main" tabindex="-1">
      <div class="legal-ritual-container">
        <SectionTitle
            :eyebrow="legalContent.eyebrow"
            :subtitle="legalContent.subtitle"
            :title="legalContent.title"
            variant="legal"
        />

        <div class="legal-ledger">
          <div class="ledger-meta">
            <span class="ledger-date">{{ legalContent.updated }}</span>
          </div>

          <section
              v-for="section in legalContent.sections"
              :key="section.title"
              class="ledger-section"
          >
            <h2 class="ledger-title">{{ section.title }}</h2>
            <div class="ledger-content">
              <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
              <ul v-if="section.items.length" class="ledger-list">
                <li v-for="item in section.items" :key="item.label || item.text">
                  <span class="gold-bullet" aria-hidden="true"></span>
                  <span>
                    <strong v-if="item.label">{{ item.label }}</strong>
                    {{ item.label ? ` ${item.text}` : item.text }}
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
    <FooterItem/>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import HeaderItem from "@/components/layout/HeaderItem.vue";
import FooterItem from "@/components/layout/FooterItem.vue";
import SectionTitle from "@/components/ui/SectionTitle.vue";
import {useI18n} from "@/composables/useI18n";

interface LegalListItem {
  label?: string;
  text: string;
}

interface LegalSection {
  title: string;
  paragraphs: string[];
  items: LegalListItem[];
}

const {currentLanguage} = useI18n();

const legalContent = computed<{
  eyebrow: string;
  subtitle: string;
  title: string;
  updated: string;
  sections: LegalSection[];
}>(() => currentLanguage.value === 'uk' ? {
  eyebrow: 'Правові документи',
  subtitle: 'Як Mysterria збирає, використовує та захищає ваші дані.',
  title: 'Політика конфіденційності',
  updated: 'Останнє оновлення: 17 квітня 2026 року',
  sections: [
    {
      title: '1. Інформація, яку ми збираємо',
      paragraphs: ['Ми збираємо лише інформацію, потрібну для надання наших сервісів і керування ними. До неї належать:'],
      items: [
        {label: 'Discord ID та ім’я користувача:', text: 'Отримуються через OAuth2, коли ви входите, щоб пов’язати свій обліковий запис Discord.'},
        {label: 'Minecraft UUID:', text: 'Отримується під час підтвердження облікового запису в грі, щоб пов’язати вашого персонажа Minecraft.'},
        {label: 'Історія транзакцій:', text: 'Відомості про пожертви, зроблені через нашу крамницю.'},
      ],
    },
    {
      title: '2. Як ми використовуємо інформацію',
      paragraphs: ['Ваші дані використовуються, щоб:'],
      items: [
        {text: 'Підтверджувати ваш доступ до вебпорталу.'},
        {text: 'Керувати вашими ігровими рангами та віртуальними предметами.'},
        {text: 'Зв’язуватися з вами щодо облікового запису або пожертв.'},
        {text: 'Підтримувати безпеку, відстежуючи зловживання обліковими записами.'},
      ],
    },
    {
      title: '3. Зберігання та захист даних',
      paragraphs: ['Ми вживаємо розумних заходів для захисту вашої інформації. IP-адреси обробляються на ігровому сервері з міркувань безпеки, але не зберігаються в нашій основній веббазі даних. Ми не продаємо ваші дані та не передаємо їх третім сторонам для маркетингу.'],
      items: [],
    },
    {
      title: '4. Сторонні сервіси',
      paragraphs: ['Ми використовуємо сторонні сервіси для окремих функцій:'],
      items: [
        {label: 'Discord:', text: 'Для автентифікації та керування спільнотою.'},
        {label: 'Платіжні провайдери:', text: 'Для безпечної обробки пожертв.'},
      ],
    },
    {
      title: '5. Ваші права',
      paragraphs: ['Ви можете будь-коли попросити копію даних, які ми зберігаємо про вас, або подати запит на їх видалення, звернувшись до служби підтримки через Discord. Видалення даних призведе до втрати доступу до пов’язаного облікового запису.'],
      items: [],
    },
    {
      title: '6. Зв’язок із нами',
      paragraphs: ['Якщо у вас є запитання щодо цієї Політики конфіденційності, зверніться до ikeepcalm або команди Mysterria в нашому офіційному Discord.'],
      items: [],
    },
  ],
} : {
  eyebrow: 'Legal information',
  subtitle: 'How Mysterria collects, uses, and protects your data.',
  title: 'Privacy Policy',
  updated: 'Last updated: April 17, 2026',
  sections: [
    {
      title: '1. Information We Collect',
      paragraphs: ['We only collect information necessary to provide and manage our services. This includes:'],
      items: [
        {label: 'Discord ID and Username:', text: 'Collected via OAuth2 when you log in to link your Discord account.'},
        {label: 'Minecraft UUID:', text: 'Collected when you verify your account in-game to link your Minecraft character.'},
        {label: 'Transaction History:', text: 'Details of donations made through our shop.'},
      ],
    },
    {
      title: '2. How We Use Information',
      paragraphs: ['Your data is used to:'],
      items: [
        {text: 'Authenticate your access to the web portal.'},
        {text: 'Manage your in-game ranks and virtual items.'},
        {text: 'Communicate with you regarding your account or donations.'},
        {text: 'Ensure security by monitoring for account abuse.'},
      ],
    },
    {
      title: '3. Data Storage and Security',
      paragraphs: ['We take reasonable measures to protect your information. IP addresses are processed on the game server for security reasons but are not stored in our primary web database. We do not sell or share your data with third parties for marketing purposes.'],
      items: [],
    },
    {
      title: '4. Third-Party Services',
      paragraphs: ['We utilize third-party services for specific functions:'],
      items: [
        {label: 'Discord:', text: 'For authentication and community management.'},
        {label: 'Payment Providers:', text: 'To process donations securely.'},
      ],
    },
    {
      title: '5. Your Rights',
      paragraphs: ['You may request a copy of the data we have stored about you or request its deletion at any time by contacting our support team via Discord. Deleting your data will result in the loss of access to your linked account.'],
      items: [],
    },
    {
      title: '6. Contact',
      paragraphs: ['If you have any questions about this Privacy Policy, please reach out to ikeepcalm or the Mysterria Team on our official Discord.'],
      items: [],
    },
  ],
});
</script>

<style scoped>
.legal-ritual-page { background: linear-gradient(90deg, rgba(200,178,115,.025) 1px, transparent 1px), #070910; background-size: 88px 88px; min-height: 100vh; display: flex; flex-direction: column; }
.legal-ritual-main { flex: 1; padding: 120px 24px 80px; }
.legal-ritual-container { max-width: 1080px; margin: 0 auto; }

.legal-ledger {
  display: grid; grid-template-columns: 180px minmax(0, 720px); gap: 0 40px;
  padding-top: 38px; border-top: 1px solid rgba(200, 178, 115, .2);
}

.ledger-meta { grid-column: 1; grid-row: 1 / span 20; position: sticky; top: 110px; align-self: start; padding-left: 16px; border-left: 2px solid var(--myst-gold); }
.ledger-date {
  font-family: var(--font-ui); font-size: 12px;
  color: #b4b0aa; letter-spacing: .02em; line-height: 1.6; white-space: nowrap;
}

.ledger-section { grid-column: 2; margin-bottom: 48px; }
.ledger-title {
  font-family: var(--font-display); font-size: 24px;
  color: var(--myst-gold); margin-bottom: 24px; font-weight: 700;
}

.ledger-content { max-width: 70ch; font-size: 16px; line-height: 1.68; color: #d0cdc8; }
.ledger-content p { margin-bottom: 20px; }

.ledger-list { list-style: none; padding: 0; }
.ledger-list li { display: flex; gap: 16px; margin-bottom: 12px; align-items: flex-start; }
.gold-bullet {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  margin-top: 11px;
  border-radius: 50%;
  background: var(--myst-gold);
  opacity: 0.7;
}

@media (max-width: 768px) {
  .legal-ledger { display: block; padding-top: 24px; }
  .ledger-meta { position: static; margin-bottom: 42px; }
  .legal-ritual-main { padding-top: 100px; }
}
</style>
