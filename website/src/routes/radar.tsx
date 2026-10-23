import { createFileRoute, Link } from "@tanstack/react-router";
import { HudList } from "#/components/hud-list/index.ts";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { iter } from "#/content/products/iter.ts";
import { radar, radarHud } from "#/content/products/radar.ts";
import { studio } from "#/content/studio.ts";
import { ProductPage } from "#/partials/product-page/index.ts";
import { pendingChangelog } from "#/routes/-changelog-seam.ts";

export const Route = createFileRoute("/radar")({
    head: () => ({
        meta: [
            { title: `${radar.name} · ${studio.name}` },
            { name: "description", content: radar.description },
        ],
    }),
    component: RadarPage,
});

function RadarPage() {
    return (
        <ProductPage
            product={radar}
            art={
                <Stack gap="lg" align="center">
                    <SceneAnchor variant="square" label={radar.artLabel} />
                    <HudList groups={radarHud} />
                </Stack>
            }
            pager={{
                previous: { label: "← Back", title: iter.name, render: <Link to="/iter" /> },
                next: { label: "Next →", title: "Changelog", render: <Link to="/changelog" /> },
            }}
            changelog={pendingChangelog}
        />
    );
}
