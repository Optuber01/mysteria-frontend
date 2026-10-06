/*
 * Each Pathway's signature moment (signatures/<id>.vue, one shared boon.vue for the Boons)
 * is its own small chunk (a few KB of script and style). Hovering or focusing a card
 * fetches it ahead (prefetchSignature), and once the page has settled every one is
 * fetched in turn, one per idle slice (prefetchAllSignatures): "Draw again" picks at
 * random, and a moment loaded at the draw itself brought its fetch, its compile and a
 * new stylesheet (whose @keyframes restyle every animated element) into the switch.
 */
import {defineAsyncComponent, type Component} from 'vue';
import {cardById} from './arcana-data';
import {whenSettled, yieldToIdle} from './progression/prewarm';

type Loader = () => Promise<{default: Component}>;
const files = import.meta.glob<{default: Component}>('./signatures/*.vue');
const components = new Map<string, Component>();
const fetched = new Set<string>();

const fileFor = (id: string) => (cardById(id).boon ? 'boon' : id);
const loaderFor = (id: string): Loader | null => (files[`./signatures/${fileFor(id)}.vue`] as Loader | undefined) ?? null;

export function signatureFor(id: string): Component | null {
  const name = fileFor(id);
  const loader = loaderFor(id);
  if (!loader) return null;
  if (!components.has(name)) components.set(name, defineAsyncComponent(loader));
  return components.get(name) ?? null;
}

type AsyncComponent = Component & {__asyncLoader?: () => Promise<unknown>};

/** Fetches a signature and resolves its component, so a draw renders it in the same pass. */
export function prefetchSignature(id: string): Promise<unknown> {
  const name = fileFor(id);
  const component = signatureFor(id) as AsyncComponent | null;
  if (fetched.has(name) || !component?.__asyncLoader) return Promise.resolve();
  fetched.add(name);
  return component.__asyncLoader().catch(() => fetched.delete(name));
}

/** Every signature, one per idle slice, after the page has settled. Returns a cancel. */
export function prefetchAllSignatures(ids: readonly string[]): () => void {
  return whenSettled(async () => {
    for (const id of ids) {
      await yieldToIdle();
      await prefetchSignature(id);
    }
  });
}
