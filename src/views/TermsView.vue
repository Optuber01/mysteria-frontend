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
              <p v-if="section.rulesLink">
                {{ section.rulesLink }}
                <RouterLink to="/rules" class="ledger-link">mysterria.net/rules</RouterLink>.
              </p>
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

interface LegalSection {
  title: string;
  paragraphs: LegalParagraph[];
  rulesLink?: string;
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
  subtitle: 'Умови, що регулюють користування сервером і вебсайтом Mysterria.',
  title: 'Умови користування',
  updated: 'Останнє оновлення: 17 квітня 2026 року',
  sections: [
    {
      title: '1. Прийняття умов',
      paragraphs: [{text: 'Відвідуючи Minecraft-сервер Mysterria або користуючись цим вебсайтом, ви погоджуєтеся дотримуватися цих Умов користування. Якщо ви не погоджуєтеся з ними, будь ласка, не користуйтеся нашими сервісами.'}],
    },
    {
      title: '2. Донати та віртуальні предмети',
      paragraphs: [
        {text: 'Платежі на користь Mysterria вважаються добровільними пожертвами. Вони підтримують роботу та розвиток проєкту. В обмін ви можете отримати віртуальні предмети, ранги або інші ігрові переваги.'},
        {lead: 'Повернення коштів не передбачене:', text: 'Усі пожертви є остаточними. Оскільки віртуальні предмети надаються одразу, ми за жодних обставин не повертаємо кошти, не обмінюємо та не приймаємо їх назад.'},
      ],
    },
    {
      title: '3. Поведінка користувачів',
      paragraphs: [{text: 'Гравці повинні дотримуватися правил спільноти, встановлених для ігрового сервера та Discord-спільноти. Порушення цих правил може призвести до блокування без попередження.'}],
      rulesLink: 'Повний перелік правил доступний за адресою',
    },
    {
      title: '4. Вікові обмеження',
      paragraphs: [{text: 'Користуючись нашими сервісами, ви підтверджуєте, що вам виповнилося щонайменше 13 років. Ця вимога відповідає політикам нашого основного постачальника автентифікації Discord.'}],
    },
    {
      title: '5. Обмеження відповідальності',
      paragraphs: [{text: 'Mysterria є неофіційним фанатським проєктом і не пов’язана з Mojang AB або Microsoft. Сервіс надається «як є» без будь-яких гарантій. ikeepcalm і команда Mysterria не несуть відповідальності за будь-які збитки.'}],
    },
    {
      title: '6. Зміни до умов',
      paragraphs: [{text: 'Ми залишаємо за собою право змінювати ці умови в будь-який час. Продовжуючи користуватися нашими сервісами після публікації змін, ви приймаєте оновлені умови.'}],
    },
  ],
} : {
  eyebrow: 'Legal information',
  subtitle: 'The terms that govern use of the Mysterria server and website.',
  title: 'Terms of Service',
  updated: 'Last updated: April 17, 2026',
  sections: [
    {
      title: '1. Acceptance of Terms',
      paragraphs: [{text: 'By accessing the Mysterria Minecraft server or using this website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.'}],
    },
    {
      title: '2. Donations and Virtual Items',
      paragraphs: [
        {text: 'Payments made to Mysterria are considered voluntary donations. These donations support the maintenance and development of the project. In return, you may receive virtual items, ranks, or other in-game benefits.'},
        {lead: 'No Refunds:', text: 'All donations are final. Since virtual items are delivered immediately, we do not offer refunds, exchanges, or returns under any circumstances.'},
      ],
    },
    {
      title: '3. User Conduct',
      paragraphs: [{text: 'Players must adhere to the community rules established for both the game server and the Discord community. Failure to follow these rules may result in suspension without notice.'}],
      rulesLink: 'Our full rules can be found at',
    },
    {
      title: '4. Age Requirement',
      paragraphs: [{text: 'By using our services, you confirm that you are at least 13 years of age. This requirement aligns with the policies of our primary authentication provider, Discord.'}],
    },
    {
      title: '5. Limitation of Liability',
      paragraphs: [{text: 'Mysterria is an unofficial fan project and is not affiliated with Mojang AB or Microsoft. The service is provided “as is” without warranties. ikeepcalm and the Mysterria Team are not liable for any damages.'}],
    },
    {
      title: '6. Changes to Terms',
      paragraphs: [{text: 'We reserve the right to modify these terms at any time. Continued use of our services after changes are posted constitutes your acceptance of the new terms.'}],
    },
  ],
});
</script>

<style scoped>
.legal-ritual-page { background: linear-gradient(90deg, rgba(200,178,115,.025) 1px, transparent 1px), #070910; background-size: 88px 88px; min-height: 100vh; display: flex; flex-direction: column; }
.legal-ritual-main { flex: 1; padding: 120px 24px 80px; }
.legal-ritual-container { max-width: 1080px; margin: 0 auto; }

.legal-ledger {
  display: grid;
  grid-template-columns: 180px minmax(0, 720px);
  gap: 0 40px;
  padding-top: 38px;
  border-top: 1px solid rgba(200, 178, 115, .2);
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

.ledger-link { color: var(--myst-gold); text-decoration: none; border-bottom: 1px solid rgba(200, 178, 115, 0.3); transition: background-color var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard); }
.ledger-link:hover { border-bottom-color: var(--myst-gold); background: rgba(200, 178, 115, 0.05); }

@media (max-width: 768px) {
  .legal-ledger { display: block; padding-top: 24px; }
  .ledger-meta { position: static; margin-bottom: 42px; }
  .legal-ritual-main { padding-top: 100px; }
}
</style>
