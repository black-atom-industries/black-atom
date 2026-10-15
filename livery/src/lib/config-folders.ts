import type { AppConfig } from "../bindings.ts";

/** Apps configured by config folders carry a `config_folders` list instead of a `config_path`. */
export function usesConfigFolders(appConfig: AppConfig | undefined): boolean {
    return appConfig?.config_folders != null;
}
