<script lang="ts">
/*
 * A list whose items come and go as it is filtered (search results, a topic grid): new
 * items fade in, gone ones fade out where they stood, the rest glide to their new places
 * (.arc-list in arcana.css), and the list's own height eases to its new size so what
 * follows it moves rather than jumps. Items need keys, as in any v-for.
 */
import {defineComponent, h, onBeforeUpdate, onUpdated, ref, TransitionGroup} from 'vue';
import {easeHeight, heightOf} from './easeHeight';

type Place = {top: number; left: number; width: number; height: number};

const placeOf = (el: HTMLElement): Place => ({top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight});

export default defineComponent({
  name: 'ArcList',
  props: {tag: {type: String, default: 'ul'}},
  setup(props, {slots}) {
    const root = ref<{$el: HTMLElement} | null>(null);
    const list = () => root.value?.$el ?? null;

    /*
     * A leaving item is taken out of the flow, so the others can move into its room, and
     * pinned where it stood. Every item's place is read at the first leave of an update,
     * before any is pinned (pinning one shifts the rest).
     */
    let places: Map<Element, Place> | null = null;
    const pin = (node: Element) => {
      const el = node as HTMLElement;
      if (!places) {
        places = new Map([...(el.parentElement?.children ?? [])].map(child => [child, placeOf(child as HTMLElement)]));
        queueMicrotask(() => (places = null));
      }
      const place = places.get(el) ?? placeOf(el);
      Object.assign(el.style, {
        position: 'absolute',
        top: `${place.top}px`,
        left: `${place.left}px`,
        width: `${place.width}px`,
        height: `${place.height}px`,
        margin: '0',
      });
    };

    /* the list's height eases from what it was (mid-ease or at rest) to what it now holds */
    let before = 0;
    onBeforeUpdate(() => {
      const el = list();
      if (el) before = heightOf(el);
    });
    onUpdated(() => {
      const el = list();
      if (el) easeHeight(el, before);
    });

    return () => {
      // the items are made here, so a change to them updates this list (and its height)
      const items = slots.default?.() ?? [];
      return h(TransitionGroup, {ref: root, tag: props.tag, name: 'arc-list', class: 'arc-list', onBeforeLeave: pin}, () => items);
    };
  },
});
</script>
