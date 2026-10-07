/*
 * Whose skin the potion story's player wears, and the name on his tag.
 *
 * A signed-in visitor whose linked account is a premium Java one sees their own skin and
 * name; everyone else (signed out, Bedrock through Floodgate, offline-mode accounts, or a
 * lookup that fails) sees Optuber's. The server runs in offline mode, so a linked UUID is
 * not always Mojang's: only version-4 UUIDs (the ones Mojang issues) are looked up, so
 * nobody is ever shown a stranger's skin.
 *
 * playerdb.co answers with the current name and the profile's textures (the skin on
 * textures.minecraft.net and its arm model); both allow cross-origin reads, which a WebGL
 * texture needs. The skin is then read texel by texel (skinCheck.ts): one that would look
 * wrong in the dark room is not worn, and Optuber's stays on. The answer is kept for the
 * session.
 */
import {computed, ref, watch} from 'vue';
import {useAuthStore} from '@/stores/auth';
import playerSkinUrl from '@/assets/images/home/progression/player-skin.png';
import {judgeSkin} from './skinCheck';

export type PlayerSkin = Readonly<{url: string; name: string; slim: boolean}>;

/** Optuber's, bundled: the player everyone sees unless their own is found. */
export const DEFAULT_SKIN: PlayerSkin = {url: playerSkinUrl, name: 'Optuber', slim: false};

const CACHE = 'mysterria-skin:';
const TEXTURES = /^https?:\/\/textures\.minecraft\.net\/texture\/[0-9a-f]+$/i;

/** The UUID without dashes when Mojang issued it (version 4), else null. */
export function premiumUuid(value?: string | null): string | null {
  const hex = (value ?? '').replace(/-/g, '').toLowerCase();
  return /^[0-9a-f]{32}$/.test(hex) && hex[12] === '4' ? hex : null;
}

type Textures = {textures?: {SKIN?: {url?: string; metadata?: {model?: string}}}};

function readTextures(properties: unknown): {url: string; slim: boolean} | null {
  if (!Array.isArray(properties)) return null;
  const encoded = properties.find(property => property?.name === 'textures')?.value;
  if (typeof encoded !== 'string') return null;
  try {
    const skin = (JSON.parse(atob(encoded)) as Textures).textures?.SKIN;
    if (!skin?.url || !TEXTURES.test(skin.url)) return null;
    return {url: skin.url.replace(/^http:/, 'https:'), slim: skin.metadata?.model === 'slim'};
  } catch {
    return null;
  }
}

/** The image must load cross-origin, decode, and pass the check before the player wears it. */
async function suits(url: string, slim: boolean): Promise<boolean> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  try {
    await image.decode();
  } catch {
    return false;
  }
  const {naturalWidth: width, naturalHeight: height} = image;
  if (width !== 64 || (height !== 64 && height !== 32)) return false;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) return false;
  context.drawImage(image, 0, 0);
  const verdict = judgeSkin(context.getImageData(0, 0, width, height).data, width, height, slim);
  if (import.meta.env.DEV) console.info('[player skin]', verdict.ok ? 'worn' : `not worn: ${verdict.reason}`, verdict.metrics);
  return verdict.ok;
}

async function lookUp(uuid: string): Promise<PlayerSkin | null> {
  try {
    const kept = sessionStorage.getItem(CACHE + uuid);
    if (kept) return JSON.parse(kept) as PlayerSkin;
  } catch {
    // storage blocked: look it up again
  }
  try {
    const response = await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`, {signal: AbortSignal.timeout(6000)});
    if (!response.ok) return null;
    const player = (await response.json())?.data?.player;
    const name = typeof player?.username === 'string' ? player.username : '';
    const textures = readTextures(player?.properties);
    if (!name || !textures || !(await suits(textures.url, textures.slim))) return null;
    const skin: PlayerSkin = {url: textures.url, name, slim: textures.slim};
    try {
      sessionStorage.setItem(CACHE + uuid, JSON.stringify(skin));
    } catch {
      // not kept, only looked up again next visit
    }
    return skin;
  } catch {
    return null;
  }
}

const current = ref<PlayerSkin>(DEFAULT_SKIN);

/** The skin to wear; looked up only once `wanted` (the story is near), and only for a premium account. */
export function usePlayerSkin(wanted: () => boolean) {
  const auth = useAuthStore();
  const uuid = computed(() => premiumUuid(auth.user?.minecraftUuid));
  watch([uuid, wanted], async ([id, want]) => {
    if (!id) {
      current.value = DEFAULT_SKIN;
      return;
    }
    if (!want) return;
    const found = await lookUp(id);
    if (uuid.value === id) current.value = found ?? DEFAULT_SKIN;
  }, {immediate: true});
  return current;
}
