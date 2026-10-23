import { createFileRoute, Link } from "@tanstack/react-router";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { iter } from "#/content/products/iter.ts";
import { livery } from "#/content/products/livery.ts";
import { radar } from "#/content/products/radar.ts";
import { studio } from "#/content/studio.ts";
import { ProductPage } from "#/partials/product-page/index.ts";
import { ChangelogEmpty } from "./-changelog-empty.tsx";

export const Route = createFileRoute("/iter")({
    head: () => ({
        meta: [
            { title: `${iter.name} · ${studio.name}` },
            { name: "description", content: iter.description },
        ],
    }),
    loader: ({ context }) => loadChangelog(context.queryClient, changelogProducts),
    component: IterPage,
});

const changelogProducts = [iter];

function IterPage() {
    const changelog = useChangelog(changelogProducts, { releasesPerProduct: 3, commits: 8 });

    return (
        <ProductPage
            product={iter}
            art={<SceneAnchor variant="wide" label={iter.artLabel} />}
            pager={{
                previous: {
                    label: "← Back",
                    title: livery.name,
                    render: <Link to="/black-atom/livery" />,
                },
                next: { label: "Next →", title: radar.name, render: <Link to="/radar" /> },
            }}
            release={changelog.latest.iter}
            changelog={{
                releases: changelog.releases,
                commits: changelog.commits,
                emptyText: <ChangelogEmpty href={iter.repoUrl} />,
            }}
        />
    );
}
