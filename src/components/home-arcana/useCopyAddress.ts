import {onUnmounted, ref, type Ref} from 'vue';
import {SERVER_IP} from '@/composables/useServer';

export type CopyState = 'idle' | 'copied' | 'failed';

/** Last-resort copy for browsers without the async clipboard (or when it is denied). */
function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  field.remove();
  return ok;
}

/** Select an element's text, so a blocked copy leaves the address ready for Ctrl+C. */
function selectText(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Copies the server address and reports honestly whether it worked, so the UI
 * can tell the player to select it by hand when the clipboard is unavailable.
 * Pass the element that shows the address to have it selected on failure.
 */
export function useCopyAddress(target?: Ref<HTMLElement | null>) {
  const state = ref<CopyState>('idle');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      ok = true;
    } catch {
      ok = legacyCopy(SERVER_IP);
    }
    state.value = ok ? 'copied' : 'failed';
    if (!ok && target?.value) selectText(target.value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (state.value = 'idle'), ok ? 2000 : 4500);
  };

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {state, copy, address: SERVER_IP};
}
