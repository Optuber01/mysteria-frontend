import {describe, expect, it, vi} from 'vitest';

vi.mock('@/stores/auth', () => ({useAuthStore: () => ({})}));
vi.mock('../useArcana', () => ({useArcana: () => ({})}));

const {cardForPathway} = await import('../usePlayerPathway');

describe('cardForPathway', () => {
  it.each([
    ['Fool', 'fool'],
    ['Red Priest', 'priest'],
    ['RED_PRIEST', 'priest'],
    ['redpriest', 'priest'],
    ['White Tower', 'tower'],
    ['WhiteTower', 'tower'],
    ['Wheel of Fortune', 'fortune'],
    ['Twilight Giant', 'giant'],
    ['Black Emperor', 'emperor'],
    ['Hanged Man', 'hanged'],
    ['Eternal Aeon', 'aeon'],
    ['Sun Pathway', 'sun'],
  ])('%s -> %s', (name, id) => {
    expect(cardForPathway(name)).toBe(id);
  });

  it('ignores names that match nothing', () => {
    expect(cardForPathway('')).toBeNull();
    expect(cardForPathway('Banana')).toBeNull();
  });
});
