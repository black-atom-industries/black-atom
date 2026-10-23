import preview from "#/storybook/preview.tsx";
import { Kbd } from "#/components/kbd/index.ts";
import { StepList } from "./step-list.tsx";

const meta = preview.meta({
    title: "Components/StepList",
    component: StepList,
    args: {
        steps: [
            {
                title: "See what changed",
                body: (
                    <>
                        <Kbd>:Iter</Kbd> opens the status drawer at the bottom. <Kbd>s</Kbd>{" "}
                        <Kbd>u</Kbd> <Kbd>d</Kbd> stage, unstage and discard.
                    </>
                ),
            },
            {
                title: "Review",
                body: "iter draws the diff itself, with treesitter syntax and the changed words picked out.",
            },
            {
                title: "Hand back",
                body: (
                    <>
                        <Kbd>y</Kbd> copies the review as a prompt: every annotation with its file,
                        line and code.
                    </>
                ),
            },
        ],
    },
});

export const Default = meta.story();
