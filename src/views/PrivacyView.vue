<template>
  <ArcPage :title="t('privacyViewTitle')">
    <template #lede>
      {{ t('legalPage.updated') }}
      <time :datetime="UPDATED">{{ updatedLabel }}</time>
    </template>

    <div class="arc-split">
      <ArcToc :current="current" :groups="groups" :label="t('tableOfContents')" @pick="current = $event"/>

      <div class="legal">
        <section id="collect" class="arc-prose">
          <h2>{{ titleOf('collect') }}</h2>
          <p>We only collect information necessary to provide and manage our services. This includes:</p>
          <ul>
            <li><strong>Discord ID and Username:</strong> Collected via OAuth2
              when you log in to link your Discord account.
            </li>
            <li><strong>Minecraft UUID:</strong> Collected when you verify your
              account in-game to link your Minecraft character.
            </li>
            <li><strong>Transaction History:</strong> Details of donations made
              through our shop.
            </li>
          </ul>
        </section>

        <section id="use" class="arc-prose">
          <h2>{{ titleOf('use') }}</h2>
          <p>Your data is used to:</p>
          <ul>
            <li>Authenticate your access to the web portal.</li>
            <li>Manage your in-game ranks and virtual items.</li>
            <li>Communicate with you regarding your account or donations.</li>
            <li>Ensure security by monitoring for account abuse.</li>
          </ul>
        </section>

        <section id="storage" class="arc-prose">
          <h2>{{ titleOf('storage') }}</h2>
          <p>We take reasonable measures to protect your information. IP addresses are processed on the game server
            for security reasons but are not stored in our primary web database. We do not sell or share your data
            with third parties for marketing purposes.</p>
        </section>

        <section id="third-party" class="arc-prose">
          <h2>{{ titleOf('third-party') }}</h2>
          <p>We utilize third-party services for specific functions:</p>
          <ul>
            <li><strong>Discord:</strong> For authentication and community
              management.
            </li>
            <li><strong>Payment Providers:</strong> To process donations
              securely.
            </li>
          </ul>
        </section>

        <section id="rights" class="arc-prose">
          <h2>{{ titleOf('rights') }}</h2>
          <p>You may request a copy of the data we have stored about you or request its deletion at any time by
            contacting our support team via Discord. Deleting your data will result in the loss of access to your
            linked account.</p>
        </section>

        <section id="contact" class="arc-prose">
          <h2>{{ titleOf('contact') }}</h2>
          <p>If you have any questions about this Privacy Policy, please reach out to ikeepcalm or the Mysterria
            Team on our official Discord.</p>
        </section>
      </div>
    </div>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import {useI18n} from "@/composables/useI18n";
import {useSeo} from "@/composables/useSeo";
import ArcPage from "@/components/arcana/ArcPage.vue";
import ArcToc, {type TocGroup} from "@/components/arcana/ArcToc.vue";

const {t, intlLocale} = useI18n();

/* The legal text is English in every language; only the page around it is translated. */
const UPDATED = "2026-04-17";
const updatedLabel = computed(() =>
    new Intl.DateTimeFormat(intlLocale.value, {dateStyle: "long", timeZone: "UTC"}).format(new Date(UPDATED)));

const sections = [
  {id: "collect", title: "1. Information We Collect"},
  {id: "use", title: "2. How We Use Information"},
  {id: "storage", title: "3. Data Storage and Security"},
  {id: "third-party", title: "4. Third-Party Services"},
  {id: "rights", title: "5. Your Rights"},
  {id: "contact", title: "6. Contact"},
];
const titleOf = (id: string) => sections.find(s => s.id === id)?.title ?? "";
const groups: TocGroup[] = [{items: sections.map(s => ({id: s.id, label: s.title}))}];

const current = ref(typeof location === "undefined" ? "" : location.hash.slice(1));

useSeo(() => ({
  title: t("privacyViewTitle"),
  description: "How Mysterria handles your account data, Discord linkage and cookies.",
  path: "/privacy",
}));
</script>

<style scoped>
/* every section is one anchor target, clear of the sticky header */
section {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 16px);
}

.legal section + section {
  margin-top: clamp(40px, 4vw, 64px);
}

/* the section's own heading opens it: no gap above */
section > h2:first-child {
  margin-top: 0;
}
</style>
