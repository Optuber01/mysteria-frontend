/*
 * The visitor's choice of how much the page moves: 'full' (the Pathway's weather and its
 * signature moment, the potion story's fog and particles) or 'calm' (the same colours
 * and skies, held still: no weather, no signature moments, the story in its light mode).
 * Remembered on this device. Reduced motion at the OS level is respected separately by
 * every effect; this is the page's own switch for people who simply want it quieter.
 */
import {computed, ref} from 'vue';

const KEY = 'mysterria-effects';

function read(): 'full' | 'calm' {
  try {
    return localStorage.getItem(KEY) === 'calm' ? 'calm' : 'full';
  } catch {
    return 'full';
  }
}

const mode = ref<'full' | 'calm'>(typeof window === 'undefined' ? 'full' : read());

export function useEffects() {
  const calm = computed(() => mode.value === 'calm');
  const toggle = () => {
    mode.value = mode.value === 'calm' ? 'full' : 'calm';
    try {
      localStorage.setItem(KEY, mode.value);
    } catch {
      // storage blocked: for this visit only
    }
  };
  return {calm, toggle};
}
