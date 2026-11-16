import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { themeCatalog } from "@black-atom/core";
import { describe, expect, it } from "vite-plus/test";
import { adapters } from "#/content/products/black-atom.ts";
import { adapterFilePaths } from "./adapter-files.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function pathsFor(adapterId: string, key: keyof typeof themeCatalog) {
    const adapter = adapters.find((entry) => entry.id === adapterId);
    if (adapter === undefined) throw new Error(`No adapter ${adapterId}`);
    return adapterFilePaths({
        adapterId,
        extensions: adapter.extensions,
        theme: themeCatalog[key].meta,
    });
}

describe("adapterFilePaths", () => {
    it("keeps nvim themes flat in colors/", () => {
        expect(pathsFor("nvim", "black-atom-jpn-koyo-dark")).toEqual([
            "adapters/nvim/colors/black-atom-jpn-koyo-dark.lua",
        ]);
    });

    it("names kagi files per dark/light pair, keeping dimmed", () => {
        expect(pathsFor("kagi", "black-atom-default-dimmed-dark")).toEqual([
            "adapters/kagi/themes/default/black-atom-default-dimmed.css",
        ]);
        expect(pathsFor("kagi", "black-atom-terra-fall-light")).toEqual([
            "adapters/kagi/themes/terra/black-atom-terra-fall.css",
        ]);
    });

    it("lists every file an adapter generates", () => {
        expect(pathsFor("tuicr", "black-atom-mono-dark")).toEqual([
            "adapters/tuicr/themes/mono/black-atom-mono-dark.toml",
            "adapters/tuicr/themes/mono/black-atom-mono-dark.tmTheme",
        ]);
    });

    it("points at a generated file for every theme and adapter", () => {
        const missing = Object.values(themeCatalog).flatMap((theme) =>
            adapters.flatMap((adapter) =>
                adapterFilePaths({
                    adapterId: adapter.id,
                    extensions: adapter.extensions,
                    theme: theme.meta,
                }).filter((path) => !existsSync(`${repoRoot}${path}`)),
            ),
        );
        expect(missing).toEqual([]);
    });
});
