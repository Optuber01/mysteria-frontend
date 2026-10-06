/*
 * Each Pathway's signature moment (signatures/<id>.vue, one shared boon.vue for the Boons)
 * is its own small chunk, loaded when its card is drawn. Hovering or focusing a card
 * fetches it ahead (prefetchSignature), so the moment starts with the draw instead of a
 * beat after it.
 */
import {defineAsyncComponent, type Component} from 'vue';
import {cardById} from './arcana-data';

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

export function prefetchSignature(id: string): void {
  const name = fileFor(id);
  if (fetched.has(name)) return;
  fetched.add(name);
  void loaderFor(id)?.().catch(() => fetched.delete(name));
}
