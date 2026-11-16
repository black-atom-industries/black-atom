import { Store } from "@tanstack/store";
import type * as Theme from "@black-atom/core";
import type { UpdateResult } from "../lib/updaters.ts";

export interface AppState {
    phase: "picking" | "applying" | "done";
    /**
     * The theme the current run is applying. Null until an apply starts, and
     * it outlives the run so retry re-applies the same theme. The theme
     * livery last applied is server state and lives in useActiveTheme().
     */
    applyingTheme: Theme.Definition | null;
    updaterResults: UpdateResult[];
    /** A theme set in the config file, for the theme list's cursor to move to. */
    followThemeKey: string | null;
}

export const appStore = new Store<AppState>({
    phase: "picking",
    applyingTheme: null,
    updaterResults: [],
    followThemeKey: null,
});
