import { createFileRoute, Link } from "@tanstack/react-router";
import { SceneAnchor } from "#/components/scene-anchor/index.ts";
import { iter } from "#/content/products/iter.ts";
import { livery } from "#/content/products/livery.ts";
import { radar } from "#/content/products/radar.ts";
import { studio } from "#/content/studio.ts";
import { ProductPage } from "#/partials/product-page/index.ts";
import { pendingChangelog } from "#/routes/-changelog-seam.ts";

export const Route = createFileRoute("/iter")({
    head: () => ({
        meta: [
            { title: `${iter.name} · ${studio.name}` },
            { name: "description", content: iter.description },
        ],
    }),
    component: IterPage,
});

function IterPage() {
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
            changelog={pendingChangelog}
        />
    );
}
