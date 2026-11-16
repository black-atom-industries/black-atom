import preview from "#/storybook/preview.tsx";
import { SceneAnchor } from "./scene-anchor.tsx";

const meta = preview.meta({
    title: "Layout/SceneAnchor",
    component: SceneAnchor,
    args: {
        variant: "wide",
        label: "Changes flow into a review loop and come back out as a prompt",
    },
    render: (args) => (
        <div style={{ maxWidth: 480, outline: "1px dashed var(--ba-fg-subtle)" }}>
            <SceneAnchor {...args} />
        </div>
    ),
});

export const Wide = meta.story();

export const Square = meta.story({ args: { variant: "square" } });
