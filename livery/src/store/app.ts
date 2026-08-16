import { Store } from "@tanstack/store";
import type { ThemeDefinition } from "@black-atom/core";
import { themeMap } from "@black-atom/core";
import type { UpdateResult } from "../lib/updaters.ts";

export interface AppState {
    phase: "picking" | "applying" | "done";
    currentTheme: ThemeDefinition; // NOTE: This seems like server state. Basically the last picked theme.
    selectedTheme: ThemeDefinition;
    updaterResults: UpdateResult[];
}

export const appStore = new Store<AppState>({
    phase: "picking",
    currentTheme: themeMap["black-atom-default-dark"],
    selectedTheme: themeMap["black-atom-default-dark"],
    updaterResults: [],
});
