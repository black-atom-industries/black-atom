import { useStore } from "@tanstack/react-store";
import type * as Theme from "@black-atom/core";
import { themeWasApplied } from "../../lib/progress.ts";
import { defaultTheme } from "../../lib/themes.ts";
import { useActiveTheme } from "../../queries/use-active-theme.ts";
import { appStore } from "../../store/app.ts";

/**
 * The theme livery wears: it follows the run while one is on screen and the
 * record once the rail is dismissed — a pass that wrote nothing must not leave
 * the app tinted as a theme the machine never got. Falling back to
 * default-dark covers a launch before setup ran.
 */
export function useDisplayedTheme(): Theme.Definition {
    const phase = useStore(appStore, (s) => s.phase);
    const applyingTheme = useStore(appStore, (s) => s.applyingTheme);
    const runChangedTheme = useStore(appStore, (s) => s.updaterResults.some(themeWasApplied));
    const activeTheme = useActiveTheme();

    const runTheme =
        phase === "applying" || (phase === "done" && runChangedTheme) ? applyingTheme : null;
    return runTheme ?? activeTheme.theme ?? defaultTheme;
}
