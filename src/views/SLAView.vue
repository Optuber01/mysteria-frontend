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
              <p v-for="paragraph in section.paragraphs" :key="paragraph.text">
                <strong v-if="paragraph.lead">{{ paragraph.lead }}</strong>
                {{ paragraph.lead ? ` ${paragraph.text}` : paragraph.text }}
              </p>
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

interface LegalParagraph {
  lead?: string;
  text: string;
}

interface LegalListItem {
  label?: string;
  text: string;
}

interface LegalSection {
  title: string;
  paragraphs: LegalParagraph[];
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
  subtitle: 'Очікуваний рівень доступності, обслуговування та підтримки Mysterria.',
  title: 'Угода про рівень обслуговування',
  updated: 'Останнє оновлення: 17 квітня 2026 року',
  sections: [
    {
      title: '1. Загальні положення',
      paragraphs: [{text: 'Ця Угода про рівень обслуговування (SLA) описує очікуваний рівень роботи ігрового сервера та вебпорталу Mysterria. Оскільки Mysterria є неофіційним фанатським проєктом, яким керує невелика команда, ця угода покликана забезпечити прозорість, а не надати юридично обов’язкові гарантії безперервної роботи.'}],
      items: [],
    },
    {
      title: '2. Доступність сервісів',
      paragraphs: [{lead: 'Ми працюємо за принципом «максимально можливих зусиль».', text: 'Наша мета — забезпечити максимальну доступність Minecraft-сервера та вебпорталу. Однак ми не гарантуємо 100% доступності.'}],
      items: [],
    },
    {
      title: '3. Періоди технічного обслуговування',
      paragraphs: [{text: 'Регулярне технічне обслуговування потрібне для стабільності та безпеки наших систем.'}],
      items: [
        {label: 'Планове обслуговування:', text: 'Ми прагнемо повідомляти про заплановану недоступність щонайменше за 24 години через нашу Discord-спільноту.'},
        {label: 'Аварійне обслуговування:', text: 'У критичних ситуаціях ми можемо проводити роботи без попереднього повідомлення.'},
      ],
    },
    {
      title: '4. Час відповіді підтримки',
      paragraphs: [{text: 'Підтримка переважно надається через Discord нашої спільноти. Час відповіді залежить від доступності команди та складності питання. Ми не надаємо окрему цілодобову підтримку.'}],
      items: [],
    },
    {
      title: '5. Обмеження',
      paragraphs: [{text: 'Mysterria не несе відповідальності за недоступність, спричинену такими обставинами:'}],
      items: [
        {text: 'Збої постачальників послуг, зокрема хостинг-провайдерів або Discord API.'},
        {text: 'Проблеми з підключенням на боці користувача або DDoS-атаки.'},
        {text: 'Стихійні лиха або інші форс-мажорні обставини.'},
      ],
    },
    {
      title: '6. Цілісність даних',
      paragraphs: [{text: 'Хоча ми регулярно створюємо резервні копії, ми не несемо відповідальності за можливу втрату даних. Користувачам слід негайно повідомляти про зникнення віртуальних предметів або ігрового прогресу.'}],
      items: [],
    },
  ],
} : {
  eyebrow: 'Legal information',
  subtitle: 'What to expect from Mysterria availability, maintenance, and support.',
  title: 'Service Level Agreement',
  updated: 'Last updated: April 17, 2026',
  sections: [
    {
      title: '1. Overview',
      paragraphs: [{text: 'This Service Level Agreement ("SLA") outlines the service expectations for Mysterria\'s game server and web portal. As Mysterria is an unofficial fan project managed by a small team, this agreement is intended to provide transparency rather than legally binding uptime guarantees.'}],
      items: [],
    },
    {
      title: '2. Service Availability',
      paragraphs: [{lead: 'We operate on a "Best Effort" basis.', text: 'Our goal is to provide maximum uptime for both the Minecraft server and the web portal. However, we do not guarantee 100% availability.'}],
      items: [],
    },
    {
      title: '3. Maintenance Windows',
      paragraphs: [{text: 'Regular maintenance is required to ensure the stability and security of our systems.'}],
      items: [
        {label: 'Scheduled Maintenance:', text: 'We aim to provide at least 24 hours\' notice for any planned downtime via our Discord community.'},
        {label: 'Emergency Maintenance:', text: 'In critical situations, we may perform maintenance without prior notice.'},
      ],
    },
    {
      title: '4. Support Response Times',
      paragraphs: [{text: 'Support is primarily handled via our community Discord. Response times vary based on staff availability and the complexity of the issue. We do not provide 24/7 dedicated support.'}],
      items: [],
    },
    {
      title: '5. Limitations',
      paragraphs: [{text: 'Mysterria is not responsible for any downtime caused by:'}],
      items: [
        {text: 'Upstream provider outages (e.g., hosting providers, Discord API).'},
        {text: 'User-side connectivity issues or DDoS attacks.'},
        {text: 'Natural disasters or other “Act of God” events.'},
      ],
    },
    {
      title: '6. Data Integrity',
      paragraphs: [{text: 'While we perform regular backups, we are not liable for any data loss that may occur. Users are encouraged to report any missing virtual items or progress immediately.'}],
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
