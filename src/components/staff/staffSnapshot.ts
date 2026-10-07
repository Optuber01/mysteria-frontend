import type {StaffEntry} from "./staffRoster";

/*
 * Shown only when the live roster fails to load: the Discord staff roles as of 2026-10-07,
 * top rank first, Discord usernames. Nothing here updates on its own.
 */
const BY_RANK: [rank: string, names: (string | [name: string, also: string])[]][] = [
    ['Owner', ['ikeepca1m']],
    ['Leader', ['king_julien26']],
    ['Developer', ['djecka1337', 'farmerjoe6262', 'optuber', ['ikeabird1', 'Eventer']]],
    ['Emissary', ['tythecanasian', 'just_linaaa', ['curativeflame70', 'Translator']]],
    ['Herald', ['canblisticchicn', 'thecoolaids', 'petrichormoths', 'sashimi0628']],
    ['Designer', ['librarianoflotm']],
    ['Translator', ['roidelle4250', ['ahealex', 'Tester']]],
    ['Tester', ['_a_ce', 'chamonile', 'sombie.', '.moistjesus', 'phillip3235', 'delicousriceeater', '.taygan.',
        'einlumian', 'penguins5997', 'lesouth03', 'fish713', 'sick_weeb']],
];

export const STAFF_SNAPSHOT: StaffEntry[] = BY_RANK.flatMap(([position, names]) =>
    names.map(entry => {
        const [nickname, also] = Array.isArray(entry) ? entry : [entry, undefined];
        return {position, nickname, avatarUrl: null, also};
    }));
