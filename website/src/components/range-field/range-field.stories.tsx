import { useState } from "react";
import { fn } from "storybook/test";
import preview from "#/storybook/preview.tsx";
import { RangeField } from "./range-field.tsx";

const meta = preview.meta({
    title: "Components/RangeField",
    component: RangeField,
    args: {
        label: "Tempo",
        valueText: "96 BPM",
        value: 96,
        min: 80,
        max: 140,
        onValueChange: fn(),
    },
    render: (args) => {
        const [value, setValue] = useState(args.value);
        return (
            <div style={{ width: 320 }}>
                <RangeField
                    {...args}
                    value={value}
                    valueText={`${value} BPM`}
                    onValueChange={(next) => {
                        setValue(next);
                        args.onValueChange(next);
                    }}
                />
            </div>
        );
    },
});

export const Default = meta.story();
