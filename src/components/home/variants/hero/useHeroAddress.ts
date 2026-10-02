import {computed, onUnmounted, ref, type Ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {SERVER_IP} from '@/composables/useServer';

/* Same windows as HomeHero: success confirms briefly, failure stays up longer
   because it asks the reader to finish the copy themselves. */
const COPIED_MS = 1800;
const FAILED_MS = 4000;

export type CopyState = 'idle' | 'copied' | 'failed';

const LABEL_KEYS: Record<CopyState, string> = {
  idle: 'home.hero.addressLabel',
  copied: 'home.hero.copied',
  failed: 'home.hero.copyFailed',
};

/**
 * Copy-the-address behaviour shared by the hero variants. On a blocked
 * clipboard it selects the address text, so the copy is one keystroke away.
 */
export function useHeroAddress(addressRef: Ref<HTMLElement | null>) {
  const {t} = useI18n();
  const copyState = ref<CopyState>('idle');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const label = computed(() => t(LABEL_KEYS[copyState.value]));
  const buttonLabel = computed(() => t(copyState.value === 'copied' ? 'home.hero.copiedAria' : 'home.hero.copyAria'));
  const announcement = computed(() => {
    if (copyState.value === 'copied') return t('home.hero.copiedAnnouncement');
    if (copyState.value === 'failed') return t('home.hero.copyFailedAnnouncement');
    return '';
  });

  function selectAddress() {
    const node = addressRef.value;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      copyState.value = 'copied';
    } catch {
      copyState.value = 'failed';
      selectAddress();
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copyState.value = 'idle';
    }, copyState.value === 'copied' ? COPIED_MS : FAILED_MS);
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {SERVER_IP, copyState, label, buttonLabel, announcement, copy};
}

/** Fills `{name}`-style placeholders; t() itself does no interpolation. */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
