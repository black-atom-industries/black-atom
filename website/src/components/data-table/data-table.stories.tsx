import preview from "#/storybook/preview.tsx";
import { Pill } from "#/components/pill/index.ts";
import { DataTable } from "./data-table.tsx";

const meta = preview.meta({
    title: "Components/DataTable",
    component: DataTable,
    args: {
        label: "Adapters",
        columns: [
            { label: "Tool", tone: "mono" },
            { label: "Kind", tone: "subtle" },
            { label: "Livery" },
        ] as const,
        rows: [
            {
                key: "ghostty",
                cells: [
                    "ghostty",
                    "terminal",
                    <Pill key="pill" isActive hasDot>
                        switches
                    </Pill>,
                ],
            },
            {
                key: "kagi",
                cells: [
                    "kagi",
                    "search",
                    <Pill key="pill" hasDot>
                        by hand
                    </Pill>,
                ],
            },
        ],
    },
});

export const Default = meta.story();
