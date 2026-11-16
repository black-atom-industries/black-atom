import preview from "#/storybook/preview.tsx";
import { Button } from "#/components/button/index.ts";
import { DockRail } from "./dock-rail.tsx";

const meta = preview.meta({
    title: "Layout/DockRail",
    component: DockRail,
    parameters: {
        layout: "fullscreen",
        // Fixed positioning needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "200px" } },
    },
    args: {
        children: (
            <Button variant="square" aria-label="Theme">
                ◐
            </Button>
        ),
    },
});

export const Default = meta.story();
