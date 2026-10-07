export type GuideCategory = "start" | "progression" | "world" | "community" | "help";

/** One of the screenshots in src/assets/images/guide/. */
export type GuideImage = "ip" | "join" | "portal" | "verify";

export interface GuideStep {
    title: string;
    description: string;
    topicId: string;
}

export interface GuideDifference {
    title: string;
    body: string;
}

export interface GuideChoice {
    name: string;
    benefit: string;
    cost: string;
    bestFor: string;
    recommended?: boolean;
}

export interface GuideCommand {
    command: string;
    purpose: string;
}

export interface GuideFigure {
    image: GuideImage;
    caption: string;
}

/**
 * Where a topic goes deeper: a wiki page (`wiki`, a path under the wiki's locale root)
 * or a page of this site (`to`, an unprefixed path such as "/help").
 */
export interface GuideLink {
    label: string;
    wiki?: string;
    to?: string;
}

export interface GuideTopicSection {
    title: string;
    paragraphs?: string[];
    steps?: string[];
    bullets?: string[];
    commands?: GuideCommand[];
    warning?: string;
    tip?: string;
    figures?: GuideFigure[];
}

export interface GuideTopic {
    id: string;
    category: GuideCategory;
    title: string;
    shortTitle: string;
    summary: string;
    answer: string;
    sections: GuideTopicSection[];
    links: GuideLink[];
    related: string[];
}

export type Jsonified<T> =
    T extends string ? string
        : T extends readonly (infer U)[] ? Jsonified<U>[]
            : T extends object ? { [K in keyof T]: Jsonified<T[K]> }
                : T;

export interface GuideContent {
    ui: {
        title: string;
        lede: string;
        topics: string;
        joinTitle: string;
        joinLink: string;
        copy: string;
        copied: string;
        copyFailed: string;
        copyHint: string;
        copiedHint: string;
        copyFailedHint: string;
        javaName: string;
        javaBody: string;
        bedrockName: string;
        bedrockBody: string;
        joinVerify: string;
        stepsTitle: string;
        stepsLede: string;
        differentTitle: string;
        differentLede: string;
        starterTitle: string;
        starterLede: string;
        benefit: string;
        cost: string;
        bestFor: string;
        recommended: string;
        starterWarning: string;
        moreTitle: string;
        wikiTitle: string;
        wikiBody: string;
        helpTitle: string;
        helpBody: string;
        discordTitle: string;
        discordBody: string;
        rulesTitle: string;
        rulesBody: string;
        back: string;
        readMore: string;
        readNext: string;
        warning: string;
        tip: string;
        command: string;
        purpose: string;
    };
    steps: GuideStep[];
    differences: GuideDifference[];
    starterChoices: GuideChoice[];
    categories: Record<GuideCategory, string>;
    topics: GuideTopic[];
}
