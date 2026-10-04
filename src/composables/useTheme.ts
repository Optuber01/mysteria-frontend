/*
 * Light/dark theme. The choice lives in localStorage['myst-theme'] ('parchment'
 * for light, anything else is dark) and is mirrored on <html data-theme>.
 *
 * index.html applies the saved value with an inline script before the first
 * paint, so nothing here has to run for a returning visitor to see the right
 * colours; this module only reads that attribute and changes it on request.
 * MysticBackground (non-home pages) reads the same key.
 */

import {computed, ref} from "vue";

export type Theme = "dark" | "parchment";

export const THEME_STORAGE_KEY = "myst-theme";

/* The browser chrome follows the page (address bar on mobile). */
const THEME_COLOR: Record<Theme, string> = {dark: "#05070a", parchment: "#efede8"};

export function readSavedTheme(): Theme {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY) === "parchment" ? "parchment" : "dark";
    } catch {
        return "dark";
    }
}

const theme = ref<Theme>(
    typeof document !== "undefined" && document.documentElement.dataset.theme === "parchment"
        ? "parchment"
        : readSavedTheme(),
);

/** Writes the attribute (and the browser-chrome colour) without animating anything. */
export function applyTheme(next: Theme) {
    theme.value = next;
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
}

/*
 * Switching: every colour on the page changes at once. Elements that ease their own
 * colour (buttons, labels) would otherwise each animate for up to a second, repainting
 * the page every frame, so transitions are suspended for the frame of the switch.
 * Where the browser supports it, a View Transition crossfades the two snapshots: one
 * composited fade of the viewport, not a repaint per frame.
 */
function switchTo(next: Theme) {
    const root = document.documentElement;
    const commit = () => {
        root.classList.add("theme-switching");
        applyTheme(next);
        // Two frames: the new colours are styled and painted before transitions return.
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    };

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {startViewTransition?: (cb: () => void) => unknown};
    if (doc.startViewTransition && !reduceMotion) doc.startViewTransition(commit);
    else commit();
}

export function useTheme() {
    const isLight = computed(() => theme.value === "parchment");

    const setTheme = (next: Theme) => {
        if (next === theme.value) return;
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Blocked storage: the switch still applies for this visit.
        }
        switchTo(next);
    };

    const toggleTheme = () => setTheme(isLight.value ? "dark" : "parchment");

    return {theme, isLight, setTheme, toggleTheme};
}
