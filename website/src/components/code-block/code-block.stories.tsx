import preview from "#/storybook/preview.tsx";
import { CodeBlock } from "./code-block.tsx";

const meta = preview.meta({
    title: "Components/CodeBlock",
    component: CodeBlock,
    args: {
        lines: [
            { prompt: "$ ", text: "livery apply black-atom-jpn-murasaki-light" },
            { prompt: "$ ", text: "livery status", comment: "  # every tool's state" },
        ],
    },
});

export const Commands = meta.story();

export const Wrapped = meta.story({
    args: {
        isWrapped: true,
        lines: [
            { prompt: "$ ", text: "git clone https://github.com/black-atom-industries/black-atom" },
            { prompt: "$ ", text: "cd black-atom && npm install" },
        ],
    },
});

export const ShareUrl = meta.story({
    args: { lines: [{ text: "black-atom.industries/iter", accent: "?theme=jpn-koyo-dark" }] },
});
