import type { ReactNode } from "react";
import { CommitList, type Commit } from "#/components/commit-list/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { ReleaseList, type Release } from "#/components/release-list/index.ts";

type Props = {
    releasesTitle: string;
    releases: readonly Release[];
    commitsTitle: string;
    commits: readonly Commit[];
    /** Shown in place of an empty list. */
    emptyText?: ReactNode;
    /** Level of the list titles in the page outline. */
    headingLevel?: 2 | 3;
};

export function ChangelogBlock({
    releasesTitle,
    releases,
    commitsTitle,
    commits,
    emptyText,
    headingLevel,
}: Props) {
    return (
        <PageGrid columns="two" align="start" data-partial="ChangelogBlock">
            <ReleaseList
                title={releasesTitle}
                releases={releases}
                emptyText={emptyText}
                headingLevel={headingLevel}
            />
            <CommitList
                title={commitsTitle}
                commits={commits}
                emptyText={emptyText}
                headingLevel={headingLevel}
            />
        </PageGrid>
    );
}
