<template>
  <ArcPage :title="t('termsViewTitle')">
    <template #lede>
      {{ t('legalPage.updated') }}
      <time :datetime="UPDATED">{{ updatedLabel }}</time>
    </template>

    <div class="arc-split">
      <ArcToc :current="current" :groups="groups" :label="t('tableOfContents')" @pick="current = $event"/>

      <div class="legal">
        <section id="acceptance" class="arc-prose">
          <h2>{{ titleOf('acceptance') }}</h2>
          <p>By accessing the Mysterria Minecraft server or using this website, you agree to be bound by these Terms
            of Service. If you do not agree, please do not use our services.</p>
        </section>

        <section id="donations" class="arc-prose">
          <h2>{{ titleOf('donations') }}</h2>
          <p>Payments made to Mysterria are considered voluntary donations. These donations support the maintenance
            and development of the project. In return, you may receive virtual items, ranks, or other in-game
            benefits.</p>
          <p><strong>No Refunds:</strong> All donations are final. Since virtual items are delivered immediately, we
            do not offer refunds, exchanges, or returns under any circumstances.</p>
        </section>

        <section id="conduct" class="arc-prose">
          <h2>{{ titleOf('conduct') }}</h2>
          <p>Players must adhere to the community rules established for both the game server and the Discord
            community. Failure to follow these rules may result in suspension without notice.</p>
          <p>Our full rules can be found at
            <RouterLink :to="$lp('/rules')">mysterria.net/rules</RouterLink>
            .
          </p>
        </section>

        <section id="age" class="arc-prose">
          <h2>{{ titleOf('age') }}</h2>
          <p>By using our services, you confirm that you are at least 13 years of age. This requirement aligns with
            the policies of our primary authentication provider, Discord.</p>
        </section>

        <section id="liability" class="arc-prose">
          <h2>{{ titleOf('liability') }}</h2>
          <p>Mysterria is an unofficial fan project and is not affiliated with Mojang AB or Microsoft. The service
            is provided "as is" without warranties. ikeepcalm and the Mysterria Team are not liable for any
            damages.</p>
        </section>

        <section id="changes" class="arc-prose">
          <h2>{{ titleOf('changes') }}</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our services after changes are
            posted constitutes your acceptance of the new terms.</p>
        </section>

        <!-- The former SLA page; /sla redirects here. -->
        <section id="service" class="arc-prose">
          <h2>{{ titleOf('service') }}</h2>

          <h3>7.1 Overview</h3>
          <p>This Service Level Agreement ("SLA") outlines the service expectations for Mysterria's game server and
            web portal. As Mysterria is an unofficial fan project managed by a small team, this agreement is
            intended to provide transparency rather than legally binding uptime guarantees.</p>

          <h3>7.2 Service Availability</h3>
          <p>We operate on a <strong>"Best Effort"</strong> basis. Our goal is to provide maximum uptime for both
            the Minecraft server and the web portal. However, we do not guarantee 100% availability.</p>

          <h3>7.3 Maintenance Windows</h3>
          <p>Regular maintenance is required to ensure the stability and security of our systems.</p>
          <ul>
            <li><strong>Scheduled Maintenance:</strong> We aim to provide at
              least 24 hours' notice for any planned downtime via our Discord community.
            </li>
            <li><strong>Emergency Maintenance:</strong> In critical situations,
              we may perform maintenance without prior notice.
            </li>
          </ul>

          <h3>7.4 Support Response Times</h3>
          <p>Support is primarily handled via our community Discord. Response times vary based on staff availability
            and the complexity of the issue. We do not provide 24/7 dedicated support.</p>

          <h3>7.5 Limitations</h3>
          <p>Mysterria is not responsible for any downtime caused by:</p>
          <ul>
            <li>Upstream provider outages (e.g., hosting providers, Discord API).</li>
            <li>User-side connectivity issues or DDoS attacks.</li>
            <li>Natural disasters or other "Act of God" events.</li>
          </ul>

          <h3>7.6 Data Integrity</h3>
          <p>While we perform regular backups, we are not liable for any data loss that may occur. Users are
            encouraged to report any missing virtual items or progress immediately.</p>
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
  {id: "acceptance", title: "1. Acceptance of Terms"},
  {id: "donations", title: "2. Donations and Virtual Items"},
  {id: "conduct", title: "3. User Conduct"},
  {id: "age", title: "4. Age Requirement"},
  {id: "liability", title: "5. Limitation of Liability"},
  {id: "changes", title: "6. Changes to Terms"},
  {id: "service", title: "7. Service Level Agreement"},
];
const titleOf = (id: string) => sections.find(s => s.id === id)?.title ?? "";
const groups: TocGroup[] = [{items: sections.map(s => ({id: s.id, label: s.title}))}];

const current = ref(typeof location === "undefined" ? "" : location.hash.slice(1));

useSeo(() => ({
  title: t("termsViewTitle"),
  description: "The terms of service for Mysterria, the Lord of the Mysteries inspired Minecraft server.",
  path: "/terms",
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

section > h2 + h3 {
  margin-top: 1.1em;
}
</style>
