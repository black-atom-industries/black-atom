import preview from "#/storybook/preview.tsx";
import { Text } from "#/components/text/index.ts";
import { RichText } from "./rich-text.tsx";

const meta = preview.meta({
    title: "Components/RichText",
    component: RichText,
    args: {
        segments: [
            { kbd: "a" },
            " annotates a line, ",
            { mono: "nvim iter://review" },
            " opens the review. ",
            { placeholder: "[Your contact address]" },
        ],
    },
    render: (args) => (
        <Text>
            <RichText {...args} />
        </Text>
    ),
});

export const Default = meta.story();
