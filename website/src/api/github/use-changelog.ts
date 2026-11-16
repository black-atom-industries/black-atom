import { useMemo } from "react";
import { useSuspenseQueries, type QueryClient } from "@tanstack/react-query";
import type { Commit } from "#/components/commit-list/index.ts";
import type { Release } from "#/components/release-list/index.ts";
import type { Product } from "#/content/products/types.ts";
import { latestRelease, toCommits, toReleases, type ReleaseSummary } from "#/lib/changelog.ts";
import { getCommits } from "./get-commits.ts";
import { getReleases } from "./get-releases.ts";

function repositories(products: readonly Product[]): string[] {
    return [...new Set(products.map((product) => product.changelog.repo))];
}

function changelogQueries(products: readonly Product[]) {
    return {
        releases: repositories(products).map((repo) => getReleases(repo)),
        commits: products.flatMap(({ changelog: { repo, paths } }) =>
            paths.length === 0 ? [getCommits(repo)] : paths.map((path) => getCommits(repo, path)),
        ),
    };
}

function dataOf<T>(results: readonly { data: T }[]): T[] {
    return results.map((result) => result.data);
}

/** Fills the cache with every feed the products' changelogs read, in parallel. */
export async function loadChangelog(
    queryClient: QueryClient,
    products: readonly Product[],
): Promise<void> {
    const queries = changelogQueries(products);
    await Promise.all([
        ...queries.releases.map((query) => queryClient.query({ ...query, staleTime: "static" })),
        ...queries.commits.map((query) => queryClient.query({ ...query, staleTime: "static" })),
    ]);
}

type Changelog = {
    releases: Release[];
    commits: Commit[];
    latest: Partial<Record<Product["key"], ReleaseSummary>>;
    /** Per list: some feed failed, so an empty list may only mean GitHub did not answer. */
    failed: { releases: boolean; commits: boolean };
};

/** The products' releases and commits, read from GitHub. A failed feed reads as empty and is flagged in `failed`. */
export function useChangelog(
    products: readonly Product[],
    limits: { releasesPerProduct: number; commits: number },
): Changelog {
    const queries = changelogQueries(products);
    const releaseFeeds = useSuspenseQueries({ queries: queries.releases, combine: dataOf });
    const commitFeeds = useSuspenseQueries({ queries: queries.commits, combine: dataOf });

    return useMemo(() => {
        const repos = repositories(products);
        const entries = products.map((product) => ({
            product,
            feed: releaseFeeds[repos.indexOf(product.changelog.repo)],
        }));
        return {
            releases: toReleases(entries, limits.releasesPerProduct),
            commits: toCommits(commitFeeds, limits.commits),
            latest: Object.fromEntries(
                entries.map(({ product, feed }) => [product.key, latestRelease(feed)]),
            ),
            failed: {
                releases: releaseFeeds.some((feed) => !feed.ok),
                commits: commitFeeds.some((feed) => !feed.ok),
            },
        };
    }, [products, releaseFeeds, commitFeeds, limits.releasesPerProduct, limits.commits]);
}
