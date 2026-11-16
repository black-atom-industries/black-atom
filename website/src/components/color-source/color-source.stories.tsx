import { ColorSources } from "#/hooks/use-color-source.ts";
import preview from "#/storybook/preview.tsx";
import { ColorSource } from "./color-source.tsx";

const meta = preview.meta({
    title: "Components/ColorSource",
    component: ColorSource,
    decorators: [
        (Story) => (
            <ColorSources
                value={{
                    "ui.fg.positive": { ref: "feedback.success" },
                    "feedback.success": { ref: "palette.green" },
                    "ui.bg.negative": { from: ["primaries.l30", "feedback.negative"] },
                }}
            >
                <Story />
            </ColorSources>
        ),
    ],
});

export const Is = meta.story({ args: { path: "ui.fg.positive" } });

export const From = meta.story({ args: { path: "ui.bg.negative" } });
