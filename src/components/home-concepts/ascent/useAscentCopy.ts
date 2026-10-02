import {onUnmounted, ref} from 'vue';
import {SERVER_IP} from '@/composables/useServer';

export type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copies the server address and reports honestly: "copied" only when the
 * clipboard accepted it, otherwise "failed" and the address text is selected
 * so the visitor can copy it by hand.
 */
export function useAscentCopy() {
  const state = ref<CopyState>('idle');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const selectText = (node?: HTMLElement | null) => {
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const copy = async (addressNode?: HTMLElement | null) => {
    let ok = false;
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(SERVER_IP);
      ok = true;
    } catch {
      selectText(addressNode);
    }
    state.value = ok ? 'copied' : 'failed';
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      state.value = 'idle';
    }, ok ? 2000 : 4200);
  };

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {state, copy, ip: SERVER_IP};
}
