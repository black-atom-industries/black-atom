/**
 * Pure keyboard-navigation decision logic for RadioGroup. Given a key press,
 * the currently selected index, the option count, and any disabled indexes,
 * returns the index that should become selected — or `null` if the key
 * doesn't drive navigation.
 *
 * Arrow keys move to the next/previous enabled option and wrap at the ends.
 * Home/End jump to the first/last enabled option. Disabled options are
 * skipped entirely (never returned, never landed on).
 */

export const RADIO_GROUP_NAVIGATION_KEYS = [
    "ArrowRight",
    "ArrowDown",
    "ArrowLeft",
    "ArrowUp",
    "Home",
    "End",
] as const;

export type RadioGroupNavigationKey = typeof RADIO_GROUP_NAVIGATION_KEYS[number];

export function isRadioGroupNavigationKey(key: string): key is RadioGroupNavigationKey {
    return (RADIO_GROUP_NAVIGATION_KEYS as readonly string[]).includes(key);
}

function isEnabled(index: number, disabledIndexes: ReadonlySet<number>): boolean {
    return !disabledIndexes.has(index);
}

function enabledIndexes(optionCount: number, disabledIndexes: ReadonlySet<number>): number[] {
    const indexes: number[] = [];
    for (let i = 0; i < optionCount; i++) {
        if (isEnabled(i, disabledIndexes)) indexes.push(i);
    }
    return indexes;
}

/**
 * Step from `currentIndex` in `direction` (+1/-1), skipping disabled options
 * and wrapping around. Returns `null` if every option is disabled.
 */
function step(
    currentIndex: number,
    direction: 1 | -1,
    optionCount: number,
    disabledIndexes: ReadonlySet<number>,
): number | null {
    if (optionCount <= 0) return null;
    const enabled = enabledIndexes(optionCount, disabledIndexes);
    if (enabled.length === 0) return null;

    let next = currentIndex;
    for (let i = 0; i < optionCount; i++) {
        next = (next + direction + optionCount) % optionCount;
        if (isEnabled(next, disabledIndexes)) return next;
    }
    return null;
}

/**
 * Resolve the next selected index for `key` given the group's current state.
 * Returns `null` when the key isn't a navigation key, or when there is no
 * eligible target (e.g. no options, or all options disabled).
 */
export function getNextRadioGroupIndex(
    key: string,
    currentIndex: number,
    optionCount: number,
    disabledIndexes: ReadonlySet<number> = new Set(),
): number | null {
    if (optionCount <= 0) return null;

    switch (key) {
        case "ArrowRight":
        case "ArrowDown":
            return step(currentIndex, 1, optionCount, disabledIndexes);
        case "ArrowLeft":
        case "ArrowUp":
            return step(currentIndex, -1, optionCount, disabledIndexes);
        case "Home": {
            const enabled = enabledIndexes(optionCount, disabledIndexes);
            return enabled.length > 0 ? enabled[0] : null;
        }
        case "End": {
            const enabled = enabledIndexes(optionCount, disabledIndexes);
            return enabled.length > 0 ? enabled[enabled.length - 1] : null;
        }
        default:
            return null;
    }
}
