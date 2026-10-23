import preview from "#/storybook/preview.tsx";
import { MediaFrame } from "#/components/media-frame/index.ts";
import { Demo } from "./demo.tsx";

const frame = (
    <MediaFrame
        src="/media/drawer.webp"
        alt="The status drawer: moving through files previews each diff"
        width={2654}
        height={1520}
    />
);

const meta = preview.meta({
    title: "Components/Demo",
    component: Demo,
    args: {
        kicker: "Status drawer",
        title: "Every change, one keystroke away",
        body: "The branch, how far it is ahead and behind, Unstaged and Staged side by side.",
        media: frame,
    },
});

export const Row = meta.story();

export const Stacked = meta.story({ args: { layout: "stacked" } });
