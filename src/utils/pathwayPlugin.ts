import type MarkdownIt from 'markdown-it';

export const PATHWAYS = [
  'abyss', 'chained', 'darkness', 'death', 'demoness', 'door',
  'emperor', 'error', 'fool', 'fortune', 'giant', 'hanged',
  'hermit', 'justiciar', 'moon', 'mother', 'paragon', 'priest',
  'sun', 'tower', 'tyrant', 'visionary',
  'eternalaeon', 'sublunary', 'patriarch',
] as const;

// Maps alternate emoji codes to canonical pathway names
const EMOJI_ALIASES: Record<string, string> = {
  'hanged_man': 'hanged',
  'white_tower': 'tower',
};

// Maps emoji codes to plain Unicode characters
const UNICODE_EMOJIS: Record<string, string> = {
  'heart': '❤️',
};

export function getPathwayImageUrl(name: string): string {
  return new URL(`../assets/images/pathways/${name}.webp`, import.meta.url).href;
}

const warmedImages = new Map<string, Promise<void>>();

export function warmPathwayImage(src?: string): Promise<void> {
  if (!src) return Promise.resolve();
  const pending = warmedImages.get(src);
  if (pending) return pending;
  const probe = new Image();
  probe.decoding = 'async';
  probe.src = src;
  const ready = (probe.complete && probe.naturalWidth > 0 ? Promise.resolve() : probe.decode()).catch(() => {});
  warmedImages.set(src, ready);
  return ready;
}

export function decodePathwayImage(src?: string): Promise<void> {
  return warmPathwayImage(src);
}

export function schedulePathwayWarmup(urls: Array<string | undefined>): void {
  const pending = [...new Set(urls.filter((url): url is string => !!url && !warmedImages.has(url)))];
  if (!pending.length) return;
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    pending.forEach((src, index) => window.setTimeout(() => void warmPathwayImage(src), index * 90));
  };
  if (document.readyState === 'complete') begin();
  else {
    window.addEventListener('load', begin, {once: true});
    window.setTimeout(begin, 2000);
  }
}

export function pathwayEmojiPlugin(md: MarkdownIt): void {
  const pathwaySet = new Set<string>(PATHWAYS);

  md.core.ruler.push('pathway_emoji', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue;

      const newChildren: typeof blockToken.children = [];

      for (const token of blockToken.children) {
        if (token.type !== 'text') {
          newChildren.push(token);
          continue;
        }

        const parts = token.content.split(/(:[\w]+:)/g);

        if (parts.length === 1) {
          newChildren.push(token);
          continue;
        }

        for (const part of parts) {
          if (!part) continue;

          if (part.startsWith(':') && part.endsWith(':') && part.length > 2) {
            const name = part.slice(1, -1).toLowerCase();

            // Unicode emoji shortcodes
            if (UNICODE_EMOJIS[name] !== undefined) {
              const textToken = new state.Token('text', '', 0);
              textToken.content = UNICODE_EMOJIS[name];
              newChildren.push(textToken);
              continue;
            }

            // Resolve alias to canonical name
            const resolved = EMOJI_ALIASES[name] ?? name;

            if (pathwaySet.has(resolved)) {
              const imgToken = new state.Token('html_inline', '', 0);
              const url = getPathwayImageUrl(resolved);
              imgToken.content = `<img src="${url}" alt=":${resolved}:" class="pathway-emoji" title="${resolved}" />`;
              newChildren.push(imgToken);
              continue;
            }
          }

          const textToken = new state.Token('text', '', 0);
          textToken.content = part;
          newChildren.push(textToken);
        }
      }

      blockToken.children = newChildren;
    }
  });
}
