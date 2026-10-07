<template>
  <!--
    A name that opens its card: on hover with a mouse, on keyboard focus, and on click or
    tap (which pins it until Escape, a second click, or a tap elsewhere). The card is the
    button's disclosure, so screen readers reach it the same way.
  -->
  <li
      ref="root"
      class="staff-chip"
      :class="{'is-open': isOpen, 'is-above': above}"
      @pointerenter="onEnter"
      @pointerleave="onLeave"
      @focusout="onFocusOut"
  >
    <button
        ref="button"
        type="button"
        class="arc-tile staff-chip__btn"
        :aria-expanded="isOpen"
        :aria-controls="cardId"
        @click="onClick"
        @focus="onFocus"
    >
      <StaffAvatar :url="member.avatarUrl" :name="member.nickname" :size="32"/>
      <span class="staff-chip__text">
        <span class="staff-chip__name">{{ member.nickname }}</span>
        <span v-if="caption" class="staff-chip__caption">{{ caption }}</span>
      </span>
    </button>

    <Transition name="staff-card">
      <div v-show="isOpen" :id="cardId" ref="cardEl" class="staff-chip__card" :style="{translate: `${shift}px 0`}">
        <StaffMemberCard :member="member" :about="about"/>
      </div>
    </Transition>
  </li>
</template>

<script setup lang="ts">
import {computed, inject, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "@/composables/useI18n";
import StaffAvatar from "./StaffAvatar.vue";
import StaffMemberCard from "./StaffMemberCard.vue";
import {STAFF_CARD} from "./staffCard";
import type {StaffEntry} from "./staffRoster";
import {formatTenure} from "./staffTime";

const props = defineProps<{member: StaffEntry; id: string; about: string | null}>();

const {intlLocale} = useI18n();
const card = inject(STAFF_CARD)!;

const root = ref<HTMLLIElement>();
const button = ref<HTMLButtonElement>();
const cardEl = ref<HTMLDivElement>();
const shift = ref(0);
const above = ref(false);

const cardId = computed(() => `staff-card-${props.id}`);
const isOpen = computed(() => card.openId.value === props.id);
// A second rank, or else how long they've served, in one short phrase.
const caption = computed(() => props.member.also ?? formatTenure(props.member.staffSince, intlLocale.value, true));

let openTimer = 0;
let closeTimer = 0;
const clearTimers = () => {
  window.clearTimeout(openTimer);
  window.clearTimeout(closeTimer);
};

// Hover intent: a short delay so sweeping the pointer across the list doesn't flash cards.
const onEnter = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return;
  clearTimers();
  if (!isOpen.value) openTimer = window.setTimeout(() => card.open(props.id, false), 120);
};

const onLeave = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return;
  clearTimers();
  if (isOpen.value && !card.pinned.value) closeTimer = window.setTimeout(() => card.close(props.id), 160);
};

const onFocus = () => {
  // Keyboard focus only: a mouse click focuses the button too, and handles itself.
  if (button.value?.matches(':focus-visible') && !isOpen.value) card.open(props.id, false);
};

const onFocusOut = (event: FocusEvent) => {
  if (!root.value?.contains(event.relatedTarget as Node | null)) card.close(props.id);
};

const onClick = () => {
  clearTimers();
  if (isOpen.value && card.pinned.value) card.close(props.id);
  else card.open(props.id, true);
};

/*
 * Keep the card on screen: slide it sideways, and open it upwards when the space below runs
 * out. "Below" ends at the viewport or at the end of <main>, whichever comes first: the
 * footer stacks above the page, so a card hanging past <main> would be painted over.
 */
const place = async () => {
  shift.value = 0;
  above.value = false;
  await nextTick();
  const el = cardEl.value;
  const anchor = button.value;
  if (!el || !anchor) return;
  const margin = 12;
  const rect = el.getBoundingClientRect();
  const width = document.documentElement.clientWidth;
  if (rect.right > width - margin) shift.value = width - margin - rect.right;
  if (rect.left + shift.value < margin) shift.value = margin - rect.left;
  const anchorRect = anchor.getBoundingClientRect();
  const mainBottom = anchor.closest('main')?.getBoundingClientRect().bottom ?? Infinity;
  const floor = Math.min(window.innerHeight, mainBottom) - margin;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-stack')) || 0;
  const roomAbove = anchorRect.top - header - margin;
  above.value = rect.bottom > floor && roomAbove >= rect.height + 8;
};

watch(isOpen, open => {
  if (open) void place();
});

onBeforeUnmount(clearTimers);
</script>

<style scoped>
.staff-chip {
  position: relative;
  min-width: 0;
}

.staff-chip.is-open {
  z-index: 5;
}

.staff-chip__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  min-height: 44px;
  padding: 6px 14px 6px 6px;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.staff-chip.is-open .staff-chip__btn {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.staff-chip__text {
  display: grid;
  min-width: 0;
}

.staff-chip__name {
  overflow: hidden;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-chip__caption {
  overflow: hidden;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-chip__card {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(320px, calc(100vw - 24px));
}

.staff-chip.is-above .staff-chip__card {
  top: auto;
  bottom: calc(100% + 8px);
}

.staff-card-enter-active,
.staff-card-leave-active {
  transition: opacity .16s ease, transform .2s cubic-bezier(.2, .8, .2, 1);
}

.staff-card-enter-from,
.staff-card-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.staff-chip.is-above .staff-card-enter-from,
.staff-chip.is-above .staff-card-leave-to {
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .staff-card-enter-active,
  .staff-card-leave-active {
    transition: opacity .12s linear;
  }

  .staff-card-enter-from,
  .staff-card-leave-to {
    transform: none;
  }
}
</style>
