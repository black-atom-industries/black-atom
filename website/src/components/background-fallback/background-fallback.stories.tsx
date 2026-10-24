import preview from "#/storybook/preview.tsx";
import { BackgroundFallback } from "./background-fallback.tsx";

const meta = preview.meta({
    title: "Layout/BackgroundFallback",
    component: BackgroundFallback,
    parameters: {
        layout: "fullscreen",
        // Placed in viewport units, so it needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "640px" } },
    },
    render: (args) => (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <BackgroundFallback {...args} />
        </div>
    ),
});

export const Hole = meta.story({ args: { view: "hole" } });

export const HoleReceded = meta.story({ args: { view: "hole", isReceded: true } });

export const Iter = meta.story({ args: { view: "iter" } });

export const Radar = meta.story({ args: { view: "radar" } });

export const Wide = meta.story({ args: { view: "wide" } });
