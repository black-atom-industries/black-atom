import { useState } from "react";
import { themeCatalog } from "@black-atom/core";
import type * as Theme from "@black-atom/core";
import { expect, fn } from "storybook/test";
import preview from "#/storybook/preview.tsx";
import { ThemePanel } from "./theme-panel.tsx";

const koyoLight = themeCatalog["black-atom-jpn-koyo-light"];

const meta = preview.meta({
    title: "Partials/ThemePanel",
    component: ThemePanel,
    args: {
        themeKey: "black-atom-default-dark" as Theme.Key,
        sharePath: "/iter",
        documentation: {
            label: "Theme documentation →",
            render: <a href="#theme-documentation" />,
        },
        onSelect: fn(),
    },
    render: (args) => {
        const [themeKey, setThemeKey] = useState(args.themeKey);
        return (
            <div style={{ maxWidth: 380 }}>
                <ThemePanel
                    {...args}
                    themeKey={themeKey}
                    onSelect={(key) => {
                        setThemeKey(key);
                        args.onSelect(key);
                    }}
                />
            </div>
        );
    },
});

export const Default = meta.story();

export const PicksATheme = meta.story({
    play: async ({ canvas, userEvent, args }) => {
        await userEvent.click(canvas.getByRole("button", { name: koyoLight.meta.name }));

        await expect(args.onSelect).toHaveBeenCalledWith(koyoLight.meta.key);
        await expect(canvas.getByRole("button", { name: koyoLight.meta.name })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        await expect(canvas.getByText("?theme=jpn-koyo-light")).toBeVisible();

        await userEvent.click(canvas.getByRole("button", { name: /dark \/ light/ }));

        await expect(args.onSelect).toHaveBeenLastCalledWith("black-atom-jpn-koyo-dark");
    },
});

export const StepsThroughThemes = meta.story({
    play: async ({ canvas, userEvent, args }) => {
        await userEvent.click(canvas.getByRole("button", { name: "Next theme" }));
        await userEvent.click(canvas.getByRole("button", { name: "Previous theme" }));

        await expect(args.onSelect).toHaveBeenCalledTimes(2);
        await expect(args.onSelect).toHaveBeenLastCalledWith("black-atom-default-dark");
    },
});
