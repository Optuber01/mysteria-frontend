/*
 * A signed-in player opens the homepage on their own Pathway: the deck, the story and the
 * scene follow it. Asked once per browser session (after that the visitor's own draws
 * stand), and never when a link asks for a card (?card=). The Pathway comes from the
 * player's own Beyonder record (/api/beyonder-self resolves it from the session, never
 * from client input); its name is matched to a card loosely ("Red Priest", "RED_PRIEST",
 * "redpriest" all reach the same one).
 */
import {useAuthStore} from '@/stores/auth';
import {ALL_CARDS} from './arcana-data';
import {useArcana} from './useArcana';

const ASKED = 'mysterria-own-pathway';
const squash = (value: string) => value.toLowerCase().replace(/pathway|[^a-z]/g, '');

export function cardForPathway(name: string): string | null {
  const key = squash(name);
  if (!key) return null;
  const hit = ALL_CARDS.find(card => squash(card.id) === key || squash(card.en) === key)
      ?? ALL_CARDS.find(card => squash(card.en).includes(key) || key.includes(squash(card.id)));
  return hit?.id ?? null;
}

export async function openOnPlayerPathway(): Promise<void> {
  try {
    if (sessionStorage.getItem(ASKED)) return;
  } catch {
    return;
  }
  const auth = useAuthStore();
  for (let i = 0; auth.isLoading && i < 50; i++) await new Promise(resolve => setTimeout(resolve, 100));
  const token = auth.currentToken;
  if (!auth.isAuthenticated || !token) return;
  try {
    sessionStorage.setItem(ASKED, '1');
    const response = await fetch('/api/beyonder-self', {headers: {Authorization: `Bearer ${token}`}});
    if (!response.ok) return;
    const result = await response.json() as {success?: boolean; data?: {beyonder?: boolean; pathway?: string}};
    const pathway = result.success && result.data?.beyonder ? result.data.pathway : '';
    const id = pathway ? cardForPathway(pathway) : null;
    if (id) await useArcana().draw(id, {crossfade: true});
  } catch {
    // no record, or the service is away: the page stays as it was
  }
}
