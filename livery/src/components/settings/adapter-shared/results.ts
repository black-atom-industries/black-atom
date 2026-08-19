import type {
    ConfigFolderLinkOutcome,
    ConfigFolderOutcome,
    ConfigFolderPathVerification,
} from "../../../bindings.ts";
import type { SetUpOutcome } from "../../../lib/adapter-setup.ts";

/**
 * Session-local result of a "TEST APPLY" run — never persisted. A
 * successful test applies a random *other* theme (so the change is
 * visible), then reverts to the theme that was active before the test
 * after a short delay — "reverting" covers that window.
 */
export type TestApplyResult =
    | { status: "running" }
    | {
        status: "ok";
        durationMs: number | null;
        testedThemeLabel: string;
        message?: string | null;
        config_folders?: ConfigFolderOutcome[] | null;
    }
    | { status: "reverting" }
    | { status: "error"; message: string; config_folders?: ConfigFolderOutcome[] | null };

/** Session-local result of a "VERIFY PATH" run — never persisted. */
export type VerifyPathResult =
    | { status: "running" }
    | {
        status: "verified";
        exists: boolean;
        patternMatches: boolean | null;
        config_folders?: ConfigFolderPathVerification[] | null;
    }
    | { status: "unverifiable"; message: string };

export function findConfigFolderVerification(
    result: VerifyPathResult | undefined,
    configuredConfigFolder: string,
): ConfigFolderPathVerification | undefined {
    if (result?.status !== "verified") return undefined;
    return result.config_folders?.find(({ config_folder }) =>
        config_folder === configuredConfigFolder
    );
}

/** Session-local result of a "LINK THEMES" run — never persisted. */
export type LinkThemesRowResult =
    | { status: "running" }
    | {
        status: "ok";
        linked: number;
        pruned: number;
        message?: string | null;
        config_folders?: ConfigFolderLinkOutcome[] | null;
    }
    | { status: "error"; message: string; config_folders?: ConfigFolderLinkOutcome[] | null };

/** The qualifier a verify fault puts on the row, or null when all clear. */
export function verifyFaultLabel(result?: VerifyPathResult): string | null {
    if (!result) return null;
    if (result.status === "unverifiable") return "UNVERIFIABLE";
    if (result.status !== "verified") return null;
    if (!result.exists) return "PATH NOT FOUND";
    if (result.patternMatches === false) return "NO PATTERN MATCH";
    return null;
}

/** True while any SET UP chain step is still pending or running. */
export function setUpRunning(outcome?: SetUpOutcome): boolean {
    if (!outcome || outcome.blocked) return false;
    return outcome.steps.length > 0 &&
        outcome.steps.some((s) => s.status === "pending" || s.status === "running");
}
