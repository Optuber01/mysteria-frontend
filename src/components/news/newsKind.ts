export type NewsKind = 'changelog' | 'announcement';
export type NewsFilter = 'all' | NewsKind;

/*
 * The API has no type field. The daily development changelogs are the posts whose
 * slug starts with "changelog" (the homepage tells them apart the same way); every
 * other post is an announcement.
 */
export const newsKind = (slug: string): NewsKind =>
    slug.startsWith('changelog') ? 'changelog' : 'announcement';

export const isNewsFilter = (value: unknown): value is NewsFilter =>
    value === 'all' || value === 'changelog' || value === 'announcement';
