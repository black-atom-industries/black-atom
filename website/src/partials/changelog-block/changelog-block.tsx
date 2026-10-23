import { CommitList, type Commit } from "#/components/commit-list/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { ReleaseList, type Release } from "#/components/release-list/index.ts";

type Props = {
    releasesTitle: string;
    releases: readonly Release[];
    commitsTitle: string;
    commits: readonly Commit[];
};

export function ChangelogBlock({ releasesTitle, releases, commitsTitle, commits }: Props) {
    return (
        <PageGrid columns="two" align="start" data-partial="ChangelogBlock">
            <ReleaseList title={releasesTitle} releases={releases} />
            <CommitList title={commitsTitle} commits={commits} />
        </PageGrid>
    );
}
