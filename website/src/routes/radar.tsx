import { createFileRoute, Link } from "@tanstack/react-router";
import { loadChangelog, useChangelog } from "#/api/github/use-changelog.ts";
import { HudList } from "#/components/hud-list/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { iter } from "#/content/products/iter.ts";
import { radar, radarHud } from "#/content/products/radar.ts";
import { studio } from "#/content/studio.ts";
import { ProductPage } from "#/partials/product-page/index.ts";

export const Route = createFileRoute("/radar")({
    head: () => ({
        meta: [
            { title: `${radar.name} · ${studio.name}` },
            { name: "description", content: radar.description },
        ],
    }),
    loader: ({ context }) => loadChangelog(context.queryClient, changelogProducts),
    component: RadarPage,
});

const changelogProducts = [radar];

function RadarPage() {
    const changelog = useChangelog(changelogProducts, { releasesPerProduct: 3, commits: 8 });

    return (
        <ProductPage
            product={radar}
            art={<SceneAnchor variant="square" label={radar.artLabel} />}
            keymapAside={<HudList groups={radarHud} />}
            pager={{
                previous: { label: "← Back", title: iter.name, render: <Link to="/iter" /> },
                next: { label: "Next →", title: "Changelog", render: <Link to="/changelog" /> },
            }}
            release={changelog.latest.radar}
            changelog={{
                releases: changelog.releases,
                commits: changelog.commits,
                empty: { href: radar.repoUrl, failed: changelog.failed },
            }}
        />
    );
}
