<template>
  <ArcPage :title="copy.title" :lede="copy.lede">
    <div class="arc-split">
      <ArcToc :current="current" :groups="groups" :label="copy.tocLabel" @pick="current = $event"/>

      <div class="help">
        <HelpSection id="linking" :title="copy.linking.title">
          <HelpText :text="copy.linking.intro"/>
          <HelpSteps :steps="copy.linking.steps"/>
          <h3>{{ copy.linking.offlineTitle }}</h3>
          <HelpText :text="copy.linking.offline"/>
          <h3>{{ copy.linking.troubleTitle }}</h3>
          <HelpRows :rows="copy.linking.trouble"/>
          <HelpLinks :links="[{label: copy.linking.geyserLink, href: GEYSER_LINK}]"/>
        </HelpSection>

        <HelpSection id="top-ups" :title="copy.topUps.title">
          <HelpText :text="copy.topUps.intro"/>
          <HelpSteps :steps="copy.topUps.steps"/>
          <HelpText :text="copy.topUps.donatello"/>
          <h3>{{ copy.topUps.missTitle }}</h3>
          <HelpText :text="copy.topUps.miss"/>
          <HelpText :text="copy.topUps.renamed"/>
          <HelpLinks :links="[{label: copy.topUps.bmcLink, href: BMC}, discordLink]"/>
        </HelpSection>

        <HelpSection id="vote" :title="copy.vote.title">
          <HelpText :text="copy.vote.intro"/>
          <HelpSteps :steps="copy.vote.steps"/>
          <HelpLinks :links="voteLinks"/>
          <h3>{{ copy.vote.notCountTitle }}</h3>
          <HelpText :text="copy.vote.notCount"/>
          <HelpText :text="copy.vote.more"/>
        </HelpSection>

        <HelpSection id="events" :title="copy.events.title">
          <HelpText :text="copy.events.intro"/>
          <HelpRows :rows="copy.events.rows"/>
          <HelpLinks :links="[discordLink]"/>
        </HelpSection>

        <HelpSection id="epochs" :title="copy.epochs.title">
          <HelpText :text="copy.epochs.intro"/>
          <p>{{ epochDates }}</p>
          <HelpText :text="copy.epochs.next"/>
          <HelpText :text="copy.epochs.carry"/>
        </HelpSection>

        <HelpSection id="support" :title="copy.support.title">
          <HelpText :text="copy.support.intro"/>
          <HelpSteps :steps="copy.support.steps"/>
          <HelpLinks :links="supportLinks"/>
          <h3>{{ copy.support.categoriesTitle }}</h3>
          <HelpRows :rows="copy.support.categories"/>
          <h3>{{ copy.support.appealTitle }}</h3>
          <HelpText :text="copy.support.appealIntro"/>
          <HelpSteps :steps="copy.support.appealSteps"/>
          <HelpLinks :links="[{label: copy.support.rulesLink, href: '/rules#law-7', internal: true}]"/>
          <h3>{{ copy.support.lostTitle }}</h3>
          <HelpText :text="copy.support.lost"/>
        </HelpSection>

        <HelpSection id="joining" :title="copy.joining.title">
          <HelpRows :rows="copy.joining.rows"/>
          <HelpText :text="copy.joining.launcher"/>
          <HelpLinks :links="[{label: copy.joining.guideLink, href: '/guide/connect', internal: true}]"/>
        </HelpSection>

        <HelpSection id="client" :title="copy.client.title">
          <HelpText :text="copy.client.body"/>
          <HelpLinks :links="CLIENT_LINKS"/>
        </HelpSection>
      </div>
    </div>
  </ArcPage>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from '@/composables/useI18n';
import {breadcrumbLd, useSeo} from '@/composables/useSeo';
import ArcPage from '@/components/arcana/ArcPage.vue';
import ArcToc, {type TocGroup} from '@/components/arcana/ArcToc.vue';
import HelpSection from '@/components/help/HelpSection.vue';
import HelpText from '@/components/help/HelpText.vue';
import HelpSteps from '@/components/help/HelpSteps.vue';
import HelpRows, {type HelpRow} from '@/components/help/HelpRows.vue';
import HelpLinks, {type HelpLink} from '@/components/help/HelpLinks.vue';

type Section = {title: string};
type HelpCopy = {
  title: string;
  lede: string;
  seoDescription: string;
  tocLabel: string;
  toc: Record<'linking' | 'topUps' | 'vote' | 'events' | 'epochs' | 'support' | 'joining' | 'client', string>;
  linking: Section & {intro: string; steps: string[]; offlineTitle: string; offline: string; troubleTitle: string; trouble: HelpRow[]; geyserLink: string};
  topUps: Section & {intro: string; steps: string[]; missTitle: string; miss: string; renamed: string; donatello: string; bmcLink: string};
  vote: Section & {intro: string; steps: string[]; points: string; notCountTitle: string; notCount: string; more: string};
  events: Section & {intro: string; rows: HelpRow[]};
  epochs: Section & {intro: string; now: string; next: string; carry: string};
  support: Section & {
    intro: string; steps: string[]; categoriesTitle: string; categories: HelpRow[];
    appealTitle: string; appealIntro: string; appealSteps: string[];
    lostTitle: string; lost: string; discordLink: string; guideLink: string; wikiLink: string; rulesLink: string;
  };
  joining: Section & {rows: HelpRow[]; launcher: string; guideLink: string};
  client: Section & {body: string};
};

const {tree, intlLocale} = useI18n();
const route = useRoute();
const router = useRouter();
const copy = computed(() => tree<HelpCopy>('helpPage'));

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';
const WIKI = 'https://wiki.mysterria.net/';
const BMC = 'https://buymeacoffee.com/mysterria';
const GEYSER_LINK = 'https://link.geysermc.net/';
/* the vote sites live in the server's VotingPlugin config, with these rewards */
const VOTE_SITES = [
  {name: 'PlanetMinecraft', href: 'https://www.planetminecraft.com/server/mysterria-lord-of-the-mysteries-inspired-server/', points: 20},
  {name: 'Crafty.gg', href: 'https://crafty.gg/servers/mc.mysterria.net', points: 10},
];
/* the official COI Client pages, as the homepage and the owner's announcements link them */
const CLIENT_LINKS: HelpLink[] = [
  {label: 'Modrinth', href: 'https://modrinth.com/mod/coi-client'},
  {label: 'CurseForge', href: 'https://www.curseforge.com/minecraft/mc-mods/coi-client'},
  {label: 'GitHub', href: 'https://github.com/ikeepcalm/coi-client/releases'},
];
/* Epoch I closed and Epoch II opened on these days; Epoch II has no announced end */
const EPOCH_I_END = '2026-05-08';
const EPOCH_II_START = '2026-05-16';

const discordLink = computed<HelpLink>(() => ({label: copy.value.support.discordLink, href: DISCORD}));
const voteLinks = computed<HelpLink[]>(() => VOTE_SITES.map(site => ({
  label: `${site.name} · ${copy.value.vote.points.replace('{n}', String(site.points))}`,
  href: site.href,
})));
const supportLinks = computed<HelpLink[]>(() => [
  discordLink.value,
  {label: copy.value.support.guideLink, href: '/guide', internal: true},
  {label: copy.value.support.wikiLink, href: WIKI},
]);

const epochDates = computed(() => {
  const format = new Intl.DateTimeFormat(intlLocale.value, {dateStyle: 'long', timeZone: 'UTC'});
  return copy.value.epochs.now
      .replace('{end}', format.format(new Date(EPOCH_I_END)))
      .replace('{start}', format.format(new Date(EPOCH_II_START)));
});

/* the anchors other pages link to (/help#top-ups), in page order */
const SECTIONS = [
  {id: 'linking', key: 'linking'},
  {id: 'top-ups', key: 'topUps'},
  {id: 'vote', key: 'vote'},
  {id: 'events', key: 'events'},
  {id: 'epochs', key: 'epochs'},
  {id: 'support', key: 'support'},
  {id: 'joining', key: 'joining'},
  {id: 'client', key: 'client'},
] as const;

const groups = computed<TocGroup[]>(() => [{
  items: SECTIONS.map(section => ({id: section.id, label: copy.value.toc[section.key]})),
}]);

const current = ref<string>(route.hash.slice(1) || SECTIONS[0].id);

/*
 * Which section the reader is in. An observer on a band near the top of the
 * viewport reports changes only, never per frame.
 */
let observer: IntersectionObserver | null = null;
const inBand = new Set<string>();

onMounted(async () => {
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) inBand.add(entry.target.id);
      else inBand.delete(entry.target.id);
    }
    const first = SECTIONS.find(section => inBand.has(section.id));
    if (first) current.value = first.id;
  }, {rootMargin: '-140px 0px -55% 0px'});
  document.querySelectorAll('.help [data-spy]').forEach(el => observer?.observe(el));

  /*
   * A deep link (/en/help#top-ups) lands on its section. On a fresh load two other
   * scrolls run after this mount: the router's, which ignores scroll-margin, and
   * App.vue's jump to the top on the first route change. So wait for the router and
   * a frame past App's, then scroll: scrollIntoView honours the scroll-margin-top.
   */
  if (!route.hash) return;
  await router.isReady();
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  const target = document.getElementById(decodeURIComponent(route.hash.slice(1)));
  target?.scrollIntoView({block: 'start', behavior: 'instant'});
});

onUnmounted(() => observer?.disconnect());

useSeo(() => ({
  title: copy.value.title,
  description: copy.value.seoDescription,
  path: '/help',
  jsonLd: [breadcrumbLd([{name: 'Home', path: '/'}, {name: copy.value.title, path: '/help'}])],
}));

</script>

<style scoped>
/* one reading column: the hairlines between answers end where the text does */
.help {
  min-width: 0;
  max-width: var(--arc-measure);
}
</style>
