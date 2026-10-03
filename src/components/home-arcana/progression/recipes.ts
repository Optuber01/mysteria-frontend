import source from '@/assets/sources/seq9-recipes.json';
import type {Language} from '@/locales';

/*
 * The real Sequence 9 recipe for each Pathway, as the server defines it
 * (CircleOfImagination). Textures are the resource pack's 16px item icons,
 * pre-scaled 8x with nearest-neighbour so they stay crisp at any size.
 * Draw them with image-rendering: pixelated (DOM), imageSmoothingEnabled =
 * false (canvas) or NearestFilter (three.js).
 */

type Localized = Partial<Record<Language, string>> & { en: string };
type SourceIngredient = { key: string; source: string; name: Localized; texture: string | null };

export type Ingredient = Readonly<{
  key: string;
  /** How it is obtained in game: droppable, foundable, mineable… */
  source: string;
  name: (language: Language) => string;
  /** Texture URL, or null when the pack has no icon for it. */
  icon: string | null;
}>;

export type PathwayRecipe = Readonly<{
  main: readonly Ingredient[];
  supplementary: readonly Ingredient[];
  /** The Pathway's recipe-book texture. */
  book: string | null;
}>;

const icons = import.meta.glob<string>('@/assets/images/home/ingredients/*.png', {eager: true, import: 'default'});
const books = import.meta.glob<string>('@/assets/images/home/recipe-books/*.png', {eager: true, import: 'default'});

const fileUrl = (table: Record<string, string>, key: string) =>
    Object.entries(table).find(([path]) => path.endsWith(`/${key}.png`))?.[1] ?? null;

const toIngredient = (raw: SourceIngredient): Ingredient => ({
  key: raw.key,
  source: raw.source,
  name: language => raw.name[language] || raw.name.en,
  // The pack has no icon for a few items: a hand-drawn texture named after the
  // key stands in (ingredients/arbiter-badge.png); otherwise the scenes draw a rune.
  icon: fileUrl(icons, raw.texture ?? raw.key),
});

const pathways = (source as { pathways: Record<string, { main: SourceIngredient[]; supplementary: SourceIngredient[] }> }).pathways;

/** Recipe for a Pathway id; Boons and unknown ids fall back to the Fool's. */
export function recipeFor(id: string): PathwayRecipe {
  const raw = pathways[id] ?? pathways.fool;
  return {
    main: raw.main.map(toIngredient),
    supplementary: raw.supplementary.map(toIngredient),
    book: fileUrl(books, pathways[id] ? id : 'fool'),
  };
}

export const hasRecipe = (id: string) => id in pathways;
