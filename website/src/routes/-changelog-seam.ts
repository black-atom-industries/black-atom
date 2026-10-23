import type { Commit } from "#/components/commit-list/index.ts";
import type { Release } from "#/components/release-list/index.ts";

/** Release and commit lists until the changelog reads them live from GitHub. */
export const pendingChangelog: {
    releases: readonly Release[];
    commits: readonly Commit[];
    emptyText: string;
} = {
    releases: [],
    commits: [],
    emptyText: "Nothing to show here yet. Every release and commit is on GitHub.",
};
