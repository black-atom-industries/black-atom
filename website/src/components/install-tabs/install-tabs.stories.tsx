import { expect, waitFor } from "storybook/test";
import preview from "#/storybook/preview.tsx";
import { InstallTabs } from "./install-tabs.tsx";

const meta = preview.meta({
    title: "Components/InstallTabs",
    component: InstallTabs,
    args: {
        label: "Install methods",
        soonLabel: "Soon",
        methods: [
            {
                id: "lazy",
                label: "lazy.nvim",
                lines: [{ text: '{ "black-atom-industries/iter.nvim", opts = {} }' }],
                note: "Neovim 0.12+ and git on PATH.",
            },
            {
                id: "pack",
                label: "vim.pack",
                lines: [
                    {
                        text: 'vim.pack.add({ "https://github.com/black-atom-industries/iter.nvim" })',
                    },
                ],
            },
            { id: "brew", label: "brew", lines: [], isSoon: true },
        ],
    },
});

export const Default = meta.story();

export const SwitchesMethod = meta.story({
    play: async ({ canvas, userEvent }) => {
        await expect(canvas.getByText(/opts = \{\}/)).toBeVisible();

        await userEvent.click(canvas.getByRole("tab", { name: "vim.pack" }));

        await expect(canvas.getByRole("tab", { name: "vim.pack" })).toHaveAttribute(
            "aria-selected",
            "true",
        );
        await expect(canvas.getByText(/vim\.pack\.add/)).toBeVisible();
        await waitFor(() => expect(canvas.queryByText(/opts = \{\}/)).not.toBeInTheDocument());
        await expect(canvas.getByRole("tab", { name: /brew/ })).toHaveAttribute(
            "aria-disabled",
            "true",
        );
    },
});
