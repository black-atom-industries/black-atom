import preview from "#/storybook/preview.tsx";
import { Kbd } from "#/components/kbd/index.ts";
import { FeatureGrid } from "./feature-grid.tsx";

const meta = preview.meta({
    title: "Components/FeatureGrid",
    component: FeatureGrid,
    args: {
        features: [
            {
                title: "Annotations that stay put",
                body: "On lines, ranges or whole files. They follow their code and turn outdated when it is gone.",
            },
            {
                title: "A prompt, not a plugin API",
                body: "The hand-back is text on your clipboard. Any agent, any chat, any terminal.",
            },
            {
                title: "Your keys",
                body: (
                    <>
                        Every key can be remapped or switched off. <Kbd>?</Kbd> lists them.
                    </>
                ),
            },
        ],
    },
});

export const Default = meta.story();
