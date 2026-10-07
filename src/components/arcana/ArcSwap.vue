<script lang="ts">
/*
 * Content that changes in place (a tab's list, search results, loading to loaded): the old
 * fades as the new rises in over it, both in one grid cell (.arc-swap in arcana.css), and
 * the box eases from the old height to the new so what follows it moves rather than jumps.
 * Its one child changes by v-if/v-else or by :key; attributes (id, role, labels) land on
 * the box, which stays put.
 */
import {defineComponent, h, Transition} from 'vue';
import {easeHeight, heightOf} from './easeHeight';

export default defineComponent({
  name: 'ArcSwap',
  props: {tag: {type: String, default: 'div'}},
  setup(props, {slots}) {
    let box: HTMLElement | null = null;
    let before: number | null = null;

    // the box's height as the old content starts to go (mid-ease, if it was moving)
    const onBeforeLeave = (el: Element) => {
      box = el.parentElement;
      if (box) before = heightOf(box);
    };
    // the new content is in: ease from there to its height (the old one is out of the way by then)
    const onEnter = (el: Element) => {
      const parent = el.parentElement;
      if (!parent || before === null || parent !== box) return;
      const style = getComputedStyle(parent);
      const item = getComputedStyle(el);
      const frame = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'] as const;
      const extra = frame.reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0)
          + (parseFloat(item.marginTop) || 0) + (parseFloat(item.marginBottom) || 0);
      easeHeight(parent, before, (el as HTMLElement).offsetHeight + extra);
      before = null;
    };

    return () => h(props.tag, {class: 'arc-swap'}, h(Transition, {name: 'arc-swap', onBeforeLeave, onEnter}, () => slots.default?.()));
  },
});
</script>
