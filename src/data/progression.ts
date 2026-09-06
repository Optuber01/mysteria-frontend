export type ProgressionStageId = 'formula' | 'ingredients' | 'brew' | 'awaken' | 'digest';

export type ProgressionHotspot = {
  id: string;
  label: string;
  detail: string;
  tone?: 'gold' | 'green' | 'blue' | 'red';
};

export type ProgressionStage = {
  id: ProgressionStageId;
  short: string;
  kicker: string;
  title: string;
  copy: string;
  fact: string;
  hotspots: ProgressionHotspot[];
};

export const progressionStages: ProgressionStage[] = [
  {
    id: 'formula',
    short: 'Discover',
    kicker: '01 · Recover the knowledge',
    title: 'Discover the formula.',
    copy: 'Find a complete formula or recover its pages from Mysterria’s loot, then assemble the matching set at a crafting table.',
    fact: 'A Sequence 9 Seer formula has two pages: main and supplementary ingredients.',
    hotspots: [
      {
        id: 'formula-main',
        label: 'Main formula page',
        detail: 'Records the main ingredients for one Pathway and Sequence.',
      },
      {
        id: 'formula-supplement',
        label: 'Supplementary page',
        detail: 'Lists the supplementary ingredients and their required order.',
      },
      {
        id: 'formula-complete',
        label: 'Sequence 9 · Seer formula',
        detail: 'A complete written formula is ready to take to the brewing altar.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'ingredients',
    short: 'Gather',
    kicker: '02 · Follow the recipe',
    title: 'Gather what it asks for.',
    copy: 'Explore, hunt Beyonder Creatures and harvest hidden resource nodes to collect the exact ingredients in order.',
    fact: 'A matching Beyonder Characteristic can replace the main ingredient set.',
    hotspots: [
      {
        id: 'lavos-squid-blood',
        label: 'Lavos Squid Blood',
        detail: 'Main ingredient · obtained from its configured Beyonder Creature.',
        tone: 'red',
      },
      {
        id: 'stellar-aqua-crystal',
        label: 'Stellar Aqua Crystal',
        detail: 'Main ingredient · discovered through generated world loot.',
        tone: 'blue',
      },
      {
        id: 'gold-mint-leaves',
        label: 'Gold Mint Leaves',
        detail: 'Supplementary ingredient · collected from a mineable resource node.',
        tone: 'gold',
      },
      {
        id: 'beyonder-characteristic',
        label: 'Beyonder Characteristic',
        detail: 'Replaces the main ingredients; supplementary ingredients are still required.',
        tone: 'green',
      },
    ],
  },
  {
    id: 'brew',
    short: 'Brew',
    kicker: '03 · Build, then brew',
    title: 'Turn the formula into a potion.',
    copy: 'Construct a Ritual Altar from its glass blueprint, load the formula and ingredients, then complete the brewing challenge.',
    fact: 'Crude, Normal and Advanced altar tiers change the brewing challenge result.',
    hotspots: [
      {
        id: 'altar-blueprint',
        label: 'Altar blueprint',
        detail: 'Place the scroll, then replace every glass guide with the requested block.',
        tone: 'blue',
      },
      {
        id: 'altar-core',
        label: 'Ritual Altar core',
        detail: 'The functional enchanting-table core opens Mysterria’s brewing interface.',
        tone: 'gold',
      },
      {
        id: 'brew-main-slots',
        label: 'Main ingredients · left',
        detail: 'Load the main ingredients on the left in the formula’s exact order.',
        tone: 'red',
      },
      {
        id: 'brew-recipe-slot',
        label: 'Written formula · center',
        detail: 'The center slot identifies the Pathway, Sequence and recipe being brewed.',
        tone: 'gold',
      },
      {
        id: 'brew-supp-slots',
        label: 'Supplementary ingredients · right',
        detail: 'Load the supplementary ingredients on the right in their written order.',
        tone: 'blue',
      },
      {
        id: 'sequence-potion',
        label: 'Sequence 9 potion',
        detail: 'A successful brew creates the potion that can awaken a new Beyonder.',
        tone: 'green',
      },
    ],
  },
  {
    id: 'awaken',
    short: 'Awaken',
    kicker: '04 · Commit to a Pathway',
    title: 'Drink. Maintain control. Awaken.',
    copy: 'Confirm the potion, complete its control challenge, and become a Sequence 9 Beyonder with a real Pathway toolkit.',
    fact: 'The first Sequence 9 potion requires no acting progress or personal advancement ritual.',
    hotspots: [
      {
        id: 'drink-potion',
        label: 'Sequence 9 · Seer',
        detail: 'Drinking commits you to the Pathway and starts the awakening challenge.',
        tone: 'green',
      },
      {
        id: 'control-challenge',
        label: 'Maintain control',
        detail: 'Mysterria selects a reaction, timing, pattern, maths or sorting challenge. Poor results add Madness.',
        tone: 'red',
      },
      {
        id: 'drink-abilities',
        label: 'Your first powers',
        detail: 'Seer begins with Divination and Spiritualism. Advancing to Sequence 8 adds Paper Dagger and Body Control.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'digest',
    short: 'Digest',
    kicker: '05 · Live the Sequence',
    title: 'Discover your acting method.',
    copy: 'Use the behavior and abilities of your Sequence, then combine bounties, exploration, events and other routes while preparing the next potion and ritual.',
    fact: 'At 95% you can attempt the next Sequence; 100% is the fully digested target.',
    hotspots: [
      {
        id: 'act-sequence',
        label: 'Act the Sequence',
        detail: 'Perform actions tied to your current Sequence when Mysterria signals an acting opportunity.',
        tone: 'gold',
      },
      {
        id: 'passive-play',
        label: 'Play naturally',
        detail: 'Passive progression contributes within its own cap while you play.',
        tone: 'green',
      },
      {
        id: 'take-bounty',
        label: 'Take bounties',
        detail: 'Complete hunts, scouting, gathering, duels, sacrifices and ability-mastery objectives.',
        tone: 'green',
      },
      {
        id: 'dungeons',
        label: 'Clear dungeons',
        detail: 'Dungeon completion is a separate implemented digestion source.',
        tone: 'red',
      },
      {
        id: 'incursions',
        label: 'Face incursions',
        detail: 'Cosmos Incursions provide another route toward digestion.',
        tone: 'blue',
      },
      {
        id: 'acting-bottle',
        label: 'Use Acting Bottles',
        detail: 'Acting Bottles contribute through their own configured source cap.',
        tone: 'gold',
      },
      {
        id: 'prepare-next',
        label: 'Prepare the next Sequence',
        detail: 'Gather the next ingredients and complete the target ritual while your current potion digests.',
        tone: 'blue',
      },
      {
        id: 'advance-sequence',
        label: 'Sequence 9 → 8',
        detail: 'Drink exactly one Sequence stronger, maintain control, unlock the next abilities and begin again.',
        tone: 'gold',
      },
    ],
  },
];
