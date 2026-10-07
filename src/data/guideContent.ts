/*
 * Guide registry. The copy itself lives in src/data/guide/<code>.json, one file
 * per locale, mirroring how src/locales/ is laid out.
 *
 * All files except zh-TW are translated directly. zh-TW is GENERATED from zh-CN by
 * scripts/build-zh-tw.mjs - never edit src/data/guide/zh-TW.json by hand.
 *
 * The copy is JSON rather than TypeScript so Weblate can read and write it in
 * place; see i18n/weblate.json.
 */
import type {Language} from "@/locales";
import type {GuideContent, Jsonified} from "./guide/types";

export type {
    GuideCategory,
    GuideChoice,
    GuideCommand,
    GuideContent,
    GuideDifference,
    GuideFigure,
    GuideImage,
    GuideLink,
    GuideStep,
    GuideTopic,
    GuideTopicSection,
} from "./guide/types";

/**
 * Re-narrows `category` and `image` from `string` back to their unions. The
 * loader's type is what does the work: the whole tree is still shape-checked,
 * so a locale with a missing or misspelt field fails to compile.
 */
type Loader = () => Promise<{default: Jsonified<GuideContent>}>;

/*
 * Total, not Partial: every locale has a guide, and typing it that way is the
 * only thing that will flag a locale added to `Language` but not translated
 * here. Each one is its own chunk, so a reader downloads only their language.
 */
const loaders: Record<Language, Loader> = {
    en: () => import("./guide/en.json"),
    uk: () => import("./guide/uk.json"),
    ro: () => import("./guide/ro.json"),
    de: () => import("./guide/de.json"),
    es: () => import("./guide/es.json"),
    fr: () => import("./guide/fr.json"),
    "zh-CN": () => import("./guide/zh-CN.json"),
    "zh-TW": () => import("./guide/zh-TW.json"),
};

const cache = new Map<Language, Promise<GuideContent>>();

export const loadGuide = (language: Language): Promise<GuideContent> => {
    let pending = cache.get(language);
    if (!pending) {
        pending = loaders[language]().then(module => module.default as GuideContent);
        cache.set(language, pending);
    }
    return pending;
};

/* The wiki is translated too: English sits at its root, every other language under its own lower-cased code. */
const WIKI = "https://wiki.mysterria.net/";

export const wikiUrl = (path: string, language: Language): string =>
    `${WIKI}${language === "en" ? "" : `${language.toLowerCase()}/`}${path}`;
