import React from "react";
import { Chip } from "./Chip.jsx";

/** Segmented single-choice group built from Chips. */
export function RadioGroup({ options, value, onChange, style }) {
    return (
        <div style={{ display: "flex", gap: 6, ...style }}>
            {options.map((opt) => (
                <Chip
                    key={opt.value}
                    active={opt.value === value}
                    hotkey={opt.hotkey}
                    onClick={onChange ? () => onChange(opt.value) : undefined}
                >
                    {opt.label}
                </Chip>
            ))}
        </div>
    );
}
