import { Store } from "@tanstack/store";
import type { ThemeDefinition } from "@black-atom/core";
import type { UpdateResult } from "../lib/updaters.ts";

export interface AppState {
    phase: "picking" | "applying" | "done";
    /**
     * The theme the current run is applying. Null until an apply starts, and
     * it outlives the run so retry re-applies the same theme. The theme
     * livery last applied is server state and lives in useActiveTheme().
     */
    applyingTheme: ThemeDefinition | null;
    updaterResults: UpdateResult[];
}

export const appStore = new Store<AppState>({
    phase: "picking",
    applyingTheme: null,
    updaterResults: [],
});
