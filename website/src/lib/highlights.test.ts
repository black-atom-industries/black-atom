import { describe, expect, it } from "vitest";
import blackAtomReleases from "#/api/github/fixtures/black-atom-releases.json";
import iterReleases from "#/api/github/fixtures/iter-releases.json";
import radarReleases from "#/api/github/fixtures/radar-releases.json";
import { highlightsFor, parseHighlights, plainText } from "./highlights.ts";

function bodyOf(releases: readonly { tag_name: string; body: string }[], tag: string): string {
    const release = releases.find((candidate) => candidate.tag_name === tag);
    if (release === undefined) throw new Error(`No fixture for ${tag}`);
    return release.body;
}

describe("parseHighlights", () => {
    it("reads black-atom v0.11.0, which has no product subheadings", () => {
        expect(parseHighlights(bodyOf(blackAtomReleases, "v0.11.0"))).toEqual([
            { title: ["Claude Code"] },
            { title: ["More than one config folder"] },
            { title: ["Refreshed themes"] },
            { title: ["Important fixes"] },
        ]);
    });

    it("reads iter.nvim v0.4.0 and ignores the sections after Highlights", () => {
        expect(
            parseHighlights(bodyOf(iterReleases, "v0.4.0")).map((h) => plainText(h.title)),
        ).toEqual([
            "The diff layout follows the window width",
            "Side by side stays in its window",
            "The progress bar fills the Annotations column",
            "Important fixes",
        ]);
    });

    it("reads radar.nvim v0.8.0 with its fixes and upgrade notes", () => {
        expect(
            parseHighlights(bodyOf(radarReleases, "v0.8.0")).map((h) => plainText(h.title)),
        ).toEqual(["Locks sit on the home row", "Important fixes", "Upgrading from 0.7"]);
    });

    it("groups items under product subheadings and skips headings inside code fences", () => {
        expect(parseHighlights(bodyOf(blackAtomReleases, "v0.12.0"))).toEqual([
            { title: ["Terra gets a winter night"], section: "Themes" },
            { title: ["Kagi themes follow the appearance"], section: "Themes" },
            { title: ["Livery remembers the last theme per appearance"], section: "Livery" },
            { title: ["Contrast report per theme"], section: "Core" },
            { title: ["Important fixes"] },
            { title: ["Upgrading from 0.11"] },
        ]);
    });

    it("keeps code spans in a title as mono segments", () => {
        expect(
            parseHighlights("### Highlights\n\n#### `r` moves on, `R` removes the mark"),
        ).toEqual([{ title: [{ mono: "r" }, " moves on, ", { mono: "R" }, " removes the mark"] }]);
    });

    it("skips headings inside tilde fences", () => {
        expect(
            parseHighlights("### Highlights\n\n~~~md\n#### Inside\n~~~\n\n#### Outside"),
        ).toEqual([{ title: ["Outside"] }]);
    });

    it("finds nothing in a body without Highlights", () => {
        expect(parseHighlights("## 1.0.0\n\n### Features\n\n#### Not a highlight")).toEqual([]);
    });
});

describe("highlightsFor", () => {
    const grouped = parseHighlights(bodyOf(blackAtomReleases, "v0.12.0"));

    it("gives each product its subheadings plus the shared fixes and upgrade notes", () => {
        expect(highlightsFor(grouped, ["Livery"]).map(plainText)).toEqual([
            "Livery remembers the last theme per appearance",
            "Important fixes",
            "Upgrading from 0.11",
        ]);
        expect(highlightsFor(grouped, ["Themes", "Core"]).map(plainText)).toEqual([
            "Terra gets a winter night",
            "Kagi themes follow the appearance",
            "Contrast report per theme",
            "Important fixes",
            "Upgrading from 0.11",
        ]);
    });

    it("counts a release without subheadings for every product", () => {
        const ungrouped = parseHighlights(bodyOf(blackAtomReleases, "v0.11.0"));
        expect(highlightsFor(ungrouped, ["Livery"])).toEqual(
            highlightsFor(ungrouped, ["Themes", "Core"]),
        );
    });
});
