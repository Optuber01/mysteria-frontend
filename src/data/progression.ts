export type ProgressionStageId =
  | 'formula'
  | 'altar'
  | 'ingredients'
  | 'brew'
  | 'drink'
  | 'digest'
  | 'ritual'
  | 'advance';

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
    short: 'Formula',
    kicker: 'Recover the formula',
    title: 'Find what you need.',
    copy: 'Recover formula pages from loot, read each page, then combine the complete matching set at a crafting table.',
    fact: 'A complete written recipe can also appear as loot.',
    hotspots: [
      {
        id: 'formula-main',
        label: 'Main formula page',
        detail: 'Lists the main ingredients for one Pathway and Sequence.',
      },
      {
        id: 'formula-supplement',
        label: 'Supplement formula page',
        detail: 'Lists the supplementary ingredients in their required order.',
      },
      {
        id: 'formula-ritual',
        label: 'Ritual formula page',
        detail: 'Records the personalized ritual attached to the target Sequence when one is required.',
      },
      {
        id: 'formula-complete',
        label: 'Complete Seer formula',
        detail: 'Combine the matching main, supplementary and ritual pages at a crafting table to create the written formula.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'altar',
    short: 'Altar',
    kicker: 'Build the workstation',
    title: 'Build the Ritual Altar.',
    copy: 'Place an altar scroll, inspect its glass blueprint, and replace each guide block with the material it requests.',
    fact: 'Crude, Normal and Advanced altars shift the result of the brewing challenge.',
    hotspots: [
      {
        id: 'altar-blueprint',
        label: 'Glass blueprint',
        detail: 'Right-click once to preview the structure, then place the scroll to create its glass guides.',
        tone: 'blue',
      },
      {
        id: 'altar-materials',
        label: 'Requested blocks',
        detail: 'Replace each guide with the exact material shown in chat to complete the multiblock.',
      },
      {
        id: 'altar-core',
        label: 'Functional block',
        detail: 'Right-click the completed altar core to open the brewing interface.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'ingredients',
    short: 'Ingredients',
    kicker: 'Source the formula',
    title: 'Gather the real ingredients.',
    copy: 'Found ingredients come from loot, mineable ingredients appear as world nodes, and creature ingredients drop from configured Beyonder mobs.',
    fact: 'This example uses the live Fool Sequence 9 formula.',
    hotspots: [
      {
        id: 'lavos-squid-blood',
        label: 'Lavos Squid Blood',
        detail: 'Main ingredient · dropped by its configured Beyonder creature.',
        tone: 'red',
      },
      {
        id: 'stellar-aqua-crystal',
        label: 'Stellar Aqua Crystal',
        detail: 'Main ingredient · discovered through generated loot.',
        tone: 'blue',
      },
      {
        id: 'gold-mint-leaves',
        label: 'Gold Mint Leaves',
        detail: 'Supplementary ingredient · collected from a discovered mineable node.',
        tone: 'gold',
      },
      {
        id: 'beyonder-characteristic',
        label: 'Beyonder Characteristic',
        detail: 'Can replace the main ingredient set; supplementary ingredients are still required.',
        tone: 'green',
      },
    ],
  },
  {
    id: 'brew',
    short: 'Brew',
    kicker: 'Order matters',
    title: 'Load it. Complete the challenge.',
    copy: 'Load main ingredients on the left, the formula in the center, and supplements on the right—in the listed order.',
    fact: 'A brewed Sequence potion expires after 48 real hours.',
    hotspots: [
      {
        id: 'brew-main-slots',
        label: 'Main ingredients',
        detail: 'Four left-side slots. The list must exactly match the formula and preserve its order.',
        tone: 'red',
      },
      {
        id: 'brew-recipe-slot',
        label: 'Written formula',
        detail: 'The center slot identifies the Pathway, Sequence and exact recipe being brewed.',
        tone: 'gold',
      },
      {
        id: 'brew-supp-slots',
        label: 'Supplementary ingredients',
        detail: 'Four right-side slots. These remain necessary even when a Characteristic replaces the main set.',
        tone: 'blue',
      },
      {
        id: 'sequence-potion',
        label: 'Sequence 9 potion',
        detail: 'Awarded after the brewing challenge succeeds. Altar quality shifts the resulting grade.',
        tone: 'green',
      },
    ],
  },
  {
    id: 'drink',
    short: 'Drink',
    kicker: 'Commit to the Pathway',
    title: 'Become a Beyonder.',
    copy: 'Confirm and drink a Sequence 9 potion to awaken. Mysterria then rebuilds your inventory around the Pathway abilities you unlocked.',
    fact: 'After awakening, each potion must advance exactly one Sequence.',
    hotspots: [
      {
        id: 'drink-potion',
        label: 'Sequence 9 · Seer',
        detail: 'The first potion opens a confirmation before the awakening challenge begins.',
        tone: 'green',
      },
      {
        id: 'drink-abilities',
        label: 'First abilities',
        detail: 'Seer unlocks Divination and Spiritualism in the current implementation.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'digest',
    short: 'Digest',
    kicker: 'Progress through play',
    title: 'Digest through play.',
    copy: 'Act like your current Sequence, then combine other routes to build digestion without turning progression into one repetitive grind.',
    fact: 'Each source has its own configurable cap and cooldowns.',
    hotspots: [
      {
        id: 'act-sequence',
        label: 'Act the Sequence',
        detail: 'Seer progress comes from successful divinations, premonition-guided encounters and discovering mineable ingredients.',
        tone: 'gold',
      },
      {
        id: 'take-bounty',
        label: 'Take a bounty',
        detail: 'Choose objectives such as hunts, scouting, gathering, sacrifices, duels or ability mastery.',
        tone: 'green',
      },
      {
        id: 'hunt-beyonders',
        label: 'Hunt Beyonders',
        detail: 'Wild Beyonder and configured Beyonder Creature kills can contribute to digestion.',
        tone: 'red',
      },
      {
        id: 'explore-gather',
        label: 'Explore & gather',
        detail: 'Long journeys, map recon, biome surveys, crops, ore, fishing and ingredient nodes appear in the bounty pool.',
        tone: 'blue',
      },
      {
        id: 'crimson-moon',
        label: 'Crimson Moon',
        detail: 'A live night event with increased custom mob spawns and dedicated hunt opportunities.',
        tone: 'red',
      },
      {
        id: 'acting-bottle',
        label: 'Acting bottles',
        detail: 'A separate implemented source that contributes within its own progression cap.',
        tone: 'gold',
      },
    ],
  },
  {
    id: 'ritual',
    short: 'Ritual',
    kicker: 'Meet the next condition',
    title: 'Complete your ritual.',
    copy: 'Your next advancement receives its own ritual objectives. Finish them alongside at least 95% digestion.',
    fact: 'Sequences 8–6 can proceed early with a Madness cost; from Sequence 5 onward the ritual is mandatory.',
    hotspots: [
      {
        id: 'ritual-book',
        label: 'Personal ritual',
        detail: 'Objectives are assigned from the ritual pool for your target Sequence.',
        tone: 'gold',
      },
      {
        id: 'ritual-readiness',
        label: 'Advancement readiness',
        detail: 'The next potion, at least 95% digestion and the required ritual state must all be ready.',
        tone: 'green',
      },
      {
        id: 'ritual-madness',
        label: 'Incomplete ritual cost',
        detail: 'Proceeding early at lower Sequences adds proportional temporary and permanent Madness.',
        tone: 'red',
      },
    ],
  },
  {
    id: 'advance',
    short: 'Advance',
    kicker: 'Carry the new power',
    title: 'Advance. Then feel the difference.',
    copy: 'The completed ritual resolves into a Pathway-colored advancement, restores your resources and unlocks the next ability set.',
    fact: 'Madness remains a live risk: at 100%, the player loses control and becomes a Rampager.',
    hotspots: [
      {
        id: 'advance-sequence',
        label: 'Sequence 9 → 8',
        detail: 'Successful advancement rebuilds the player at the next Sequence and assigns the following ritual.',
        tone: 'gold',
      },
      {
        id: 'advance-abilities',
        label: 'New abilities',
        detail: 'The next Pathway ability set is added and the updated controls are shown in game.',
        tone: 'green',
      },
      {
        id: 'advance-spirituality',
        label: 'Resources restored',
        detail: 'Maximum health and Spirituality are recalculated and restored on success.',
        tone: 'blue',
      },
      {
        id: 'advance-madness',
        label: 'Power has a cost',
        detail: 'Higher Madness slows regeneration, locks abilities and eventually triggers loss of control.',
        tone: 'red',
      },
    ],
  },
];
