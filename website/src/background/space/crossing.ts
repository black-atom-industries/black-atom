/**
 * Whether a phase that rose from `previous` to `current` passed `at` or one of its repeats every
 * `period`, so a landmark can tell when a moving head or beam reached a point since the last frame.
 */
export function hasPassed(previous: number, current: number, at: number, period = 1): boolean {
    if (current <= previous) return false;
    return at + Math.floor((current - at) / period) * period > previous;
}

/**
 * Passes on a share of the crossings it is asked about: with share 1 every one, with 1/3 every
 * third, evenly and without randomness.
 */
export function createThinning() {
    let due = 0;
    return (share: number): boolean => {
        due += share;
        if (due < 1 - 1e-9) return false;
        due -= 1;
        return true;
    };
}
