import { describe, expect, it } from "vitest";
import blackAtomCommits from "#/api/github/fixtures/black-atom-commits.json";
import blackAtomReleases from "#/api/github/fixtures/black-atom-releases.json";
import iterReleases from "#/api/github/fixtures/iter-releases.json";
import { blackAtom } from "#/content/products/black-atom.ts";
import { iter } from "#/content/products/iter.ts";
import { livery } from "#/content/products/livery.ts";
import { latestRelease, toCommits, toReleases } from "./changelog.ts";

const blackAtomFeed = { ok: true, data: blackAtomReleases } as const;
const iterFeed = { ok: true, data: iterReleases } as const;

describe("toReleases", () => {
    it("gives Livery only its part of a shared release", () => {
        const [latest] = toReleases([{ product: livery, feed: blackAtomFeed }], 3);
        expect(latest).toEqual({
            version: "v0.12.0",
            date: "2026-11-02",
            highlights: [
                ["Livery remembers the last theme per appearance"],
                ["Important fixes"],
                ["Upgrading from 0.11"],
            ],
        });
    });

    it("skips prereleases and labels products when several share the list", () => {
        const releases = toReleases(
            [
                { product: blackAtom, feed: blackAtomFeed },
                { product: iter, feed: iterFeed },
            ],
            1,
        );
        expect(releases.map((release) => [release.product, release.version])).toEqual([
            ["Black Atom", "v0.12.0"],
            ["iter.nvim", "v0.4.0"],
        ]);
    });

    it("renders a failed feed as no releases", () => {
        expect(
            toReleases(
                [{ product: iter, feed: { ok: false, error: { code: "rate-limited" } } }],
                3,
            ),
        ).toEqual([]);
    });
});

it("merges products that get the same highlights from one release", () => {
    const releases = toReleases(
        [
            { product: blackAtom, feed: blackAtomFeed },
            { product: livery, feed: blackAtomFeed },
        ],
        3,
    );
    expect(releases.map((release) => [release.product, release.version])).toEqual([
        ["Black Atom", "v0.12.0"],
        ["Livery", "v0.12.0"],
        ["Black Atom · Livery", "v0.11.0"],
    ]);
});

it("leaves out the date of a release without one", () => {
    const [release] = toReleases(
        [{ product: iter, feed: { ok: true, data: [{ ...iterReleases[1], published_at: null }] } }],
        1,
    );
    expect(release?.date).toBeUndefined();
});

describe("latestRelease", () => {
    it("is the newest release that is not a prerelease", () => {
        expect(latestRelease(iterFeed)).toEqual({ version: "v0.4.0", date: "2026-10-21" });
    });
});

describe("toCommits", () => {
    it("merges path feeds newest first, each commit once, with its subject line", () => {
        const feed = { ok: true, data: blackAtomCommits } as const;
        const commits = toCommits([feed, feed], 3);
        expect(commits).toEqual([
            {
                sha: "775dc71",
                message: "feat(livery): apply claude-code themes to every config folder #22",
                date: "10-15",
                href: "https://github.com/black-atom-industries/black-atom/commit/775dc7199ca86ab1f02267b45f86ebfa0775cc70",
            },
            {
                sha: "102f75a",
                message: "fix(herdr): limit the theme to colors #22",
                date: "10-14",
                href: "https://github.com/black-atom-industries/black-atom/commit/102f75a368a9c623add29a8338294e0c828ff75a",
            },
            {
                sha: "0faf8a1",
                message:
                    "feat(core): warm Minium Polymer's neutrals and key keywords to orange #22",
                date: "10-13",
                href: "https://github.com/black-atom-industries/black-atom/commit/0faf8a1864cf89c8a0a4a45b52b1605b966f3288",
            },
        ]);
    });
});
