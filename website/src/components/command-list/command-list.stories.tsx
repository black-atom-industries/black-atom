import preview from "#/storybook/preview.tsx";
import { CommandList } from "./command-list.tsx";

const meta = preview.meta({
    title: "Components/CommandList",
    component: CommandList,
    args: {
        commands: [
            { command: "livery", description: "Pick a theme interactively" },
            { command: "livery apply [theme]", description: "Apply a theme to every enabled tool" },
            {
                command: "livery status",
                description: "Show the active theme and each tool's state",
            },
        ],
    },
});

export const Default = meta.story();
