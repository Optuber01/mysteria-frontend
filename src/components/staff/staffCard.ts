import type {InjectionKey, Ref} from "vue";

/**
 * Which member card is open, shared by every chip on the page so only one shows at a time.
 * `pinned` means it was opened by a click or tap and stays until dismissed; a card opened
 * by hover or keyboard focus closes when the pointer or focus leaves.
 */
export interface StaffCardState {
    openId: Ref<string | null>;
    pinned: Ref<boolean>;
    open: (id: string, pin: boolean) => void;
    close: (id?: string) => void;
}

export const STAFF_CARD: InjectionKey<StaffCardState> = Symbol('staff-card');
