import type { Feed } from "#/api/github/feed.ts";
import type { GitHubCommit } from "#/api/github/commits.schema.ts";
import type { GitHubRelease } from "#/api/github/releases.schema.ts";
import type { Commit } from "#/components/commit-list/index.ts";
import type { Release } from "#/components/release-list/index.ts";
import type { Product } from "#/content/products/types.ts";
import { highlightsFor, parseHighlights, plainText } from "./highlights.ts";

export type ReleaseSummary = { version: string; date?: string };

function publishedReleases(feed: Feed<GitHubRelease[]> | undefined): GitHubRelease[] {
    return feed?.ok ? feed.data.filter((release) => !release.draft && !release.prerelease) : [];
}

function day(timestamp: string | null): string | undefined {
    return timestamp?.slice(0, 10);
}

/** The newest published release in a product's repository. */
export function latestRelease(feed: Feed<GitHubRelease[]> | undefined): ReleaseSummary | undefined {
    const [latest] = publishedReleases(feed);
    return latest && { version: latest.tag_name, date: day(latest.published_at) };
}

/**
 * The releases with highlights for each product, newest first. A shared repository's release shows
 * under every product it has highlights for, labelled when several products share the list. Products
 * that get the same highlights from one release share one entry.
 */
export function toReleases(
    entries: readonly { product: Product; feed: Feed<GitHubRelease[]> | undefined }[],
    perProduct: number,
): Release[] {
    const isLabelled = entries.length > 1;
    const perProductReleases = entries.flatMap(({ product, feed }) =>
        publishedReleases(feed)
            .map((release) => ({
                url: release.html_url,
                productName: product.name,
                version: release.tag_name,
                date: day(release.published_at),
                highlights: highlightsFor(
                    parseHighlights(release.body ?? ""),
                    product.changelog.sections,
                ),
            }))
            .filter((release) => release.highlights.length > 0)
            .slice(0, perProduct),
    );
    const isSameEntry = (
        a: (typeof perProductReleases)[number],
        b: (typeof perProductReleases)[number],
    ) =>
        a.url === b.url &&
        a.highlights.map(plainText).join("\n") === b.highlights.map(plainText).join("\n");

    return perProductReleases
        .filter(
            (release, index) =>
                perProductReleases.findIndex((other) => isSameEntry(other, release)) === index,
        )
        .map((release) => ({
            version: release.version,
            date: release.date,
            highlights: release.highlights,
            ...(isLabelled
                ? {
                      product: perProductReleases
                          .filter((other) => isSameEntry(other, release))
                          .map((other) => other.productName)
                          .join(" · "),
                  }
                : {}),
        }))
        .toSorted((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** Commits from every feed, newest first, each once. */
export function toCommits(
    feeds: readonly (Feed<GitHubCommit[]> | undefined)[],
    limit: number,
): Commit[] {
    const commits = feeds.flatMap((feed) => (feed?.ok ? feed.data : []));
    const unique = commits.filter(
        (commit, index) => commits.findIndex((other) => other.sha === commit.sha) === index,
    );
    return unique
        .map((commit) => ({ commit, date: commit.commit.author?.date ?? "" }))
        .toSorted((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit)
        .map(({ commit, date }) => ({
            sha: commit.sha.slice(0, 7),
            message: commit.commit.message.split("\n")[0] ?? "",
            date: date.slice(5, 10),
            href: commit.html_url,
        }));
}
