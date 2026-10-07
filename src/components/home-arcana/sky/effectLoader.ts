/*
 * The nine effects load on their own (a few KB each), never in the homepage's first
 * chunk: the one for the drawn card when it is drawn, and the rest once the page has
 * settled, one per idle moment, so a later draw never waits on the network.
 */
import {defineAsyncComponent, type Component} from 'vue';
import {isSkyEffect} from './skyScenes';

const files = import.meta.glob<{default: Component}>('./effects/*.vue');
const loaders = new Map<string, () => Promise<{default: Component}>>();
for (const [path, load] of Object.entries(files)) loaders.set(path.replace(/^.*\/(.+)\.vue$/, '$1'), load);
const components = new Map<string, Component>();

export function effectFor(id: string): Component | null {
  if (!isSkyEffect(id)) return null;
  const load = loaders.get(id);
  if (!load) return null;
  let component = components.get(id);
  if (!component) {
    component = defineAsyncComponent(load);
    components.set(id, component);
  }
  return component;
}

type IdleWindow = Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number; cancelIdleCallback?: (id: number) => void};

/** Fetches every effect, one per idle moment; returns how to stop. */
export function prefetchEffects(): () => void {
  const w = window as IdleWindow;
  const queue = [...loaders.values()];
  let handle = 0;
  let stopped = false;
  const next = () => {
    const load = queue.shift();
    if (!load || stopped) return;
    void load().catch(() => undefined).then(() => {
      if (!stopped) handle = w.requestIdleCallback ? w.requestIdleCallback(next, {timeout: 4000}) : window.setTimeout(next, 400);
    });
  };
  handle = w.requestIdleCallback ? w.requestIdleCallback(next, {timeout: 4000}) : window.setTimeout(next, 1500);
  return () => {
    stopped = true;
    if (w.cancelIdleCallback) w.cancelIdleCallback(handle);
    clearTimeout(handle);
  };
}
