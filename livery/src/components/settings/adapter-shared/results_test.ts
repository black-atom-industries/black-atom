import { assert, test } from "vitest";
import { findConfigFolderVerification } from "./results.ts";

test("matches Obsidian verification by configured folder identity", () => {
    const result = {
        status: "verified" as const,
        exists: true,
        patternMatches: null,
        config_folders: [
            {
                config_folder: "~/Notes/.obsidian",
                path: "/Users/nik/Notes/.obsidian",
                exists: true,
            },
        ],
    };

    assert.deepEqual(
        findConfigFolderVerification(result, "~/Notes/.obsidian"),
        result.config_folders[0],
    );
    assert.deepEqual(findConfigFolderVerification(result, "/Users/nik/Notes/.obsidian"), undefined);
});
