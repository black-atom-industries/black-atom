import { CommitList, type Commit } from "#/components/commit-list/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { ReleaseList, type Release } from "#/components/release-list/index.ts";
import { ChangelogEmpty } from "#/partials/changelog-empty/index.ts";

type Props = {
    releasesTitle: string;
    releases: readonly Release[];
    commitsTitle: string;
    commits: readonly Commit[];
    /** Where an empty list points to, and which lists are empty because a feed failed. */
    empty: { href: string; failed: { releases: boolean; commits: boolean } };
    /** Level of the list titles in the page outline. */
    headingLevel?: 2 | 3;
};

export function ChangelogBlock({
    releasesTitle,
    releases,
    commitsTitle,
    commits,
    empty,
    headingLevel,
}: Props) {
    return (
        <PageGrid columns="two" align="start" data-partial="ChangelogBlock">
            <ReleaseList
                title={releasesTitle}
                releases={releases}
                emptyText={<ChangelogEmpty href={empty.href} hasFailed={empty.failed.releases} />}
                headingLevel={headingLevel}
            />
            <CommitList
                title={commitsTitle}
                commits={commits}
                emptyText={<ChangelogEmpty href={empty.href} hasFailed={empty.failed.commits} />}
                headingLevel={headingLevel}
            />
        </PageGrid>
    );
}
