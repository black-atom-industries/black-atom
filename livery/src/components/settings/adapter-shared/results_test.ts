import { assertEquals } from "@std/assert";
import { findConfigFolderVerification } from "./results.ts";

Deno.test("matches Obsidian verification by configured folder identity", () => {
    const result = {
        status: "verified" as const,
        exists: true,
        patternMatches: null,
        config_folders: [{
            config_folder: "~/Notes/.obsidian",
            path: "/Users/nik/Notes/.obsidian",
            exists: true,
        }],
    };

    assertEquals(
        findConfigFolderVerification(result, "~/Notes/.obsidian"),
        result.config_folders[0],
    );
    assertEquals(findConfigFolderVerification(result, "/Users/nik/Notes/.obsidian"), undefined);
});
