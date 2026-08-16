import React from "react";

/** Square-knob toggle. On = positive knob at right; off = disabled knob at left. */
export function Toggle({ on = false, disabled = false, onChange, style }) {
    return (
        <span
            role="switch"
            aria-checked={on}
            onClick={disabled ? undefined : onChange}
            style={{
                display: "inline-flex",
                alignItems: "center",
                width: 38,
                height: 22,
                border: on && !disabled ? "var(--ba-border-strong)" : "var(--ba-border)",
                padding: "0 3px",
                justifyContent: on ? "flex-end" : "flex-start",
                boxSizing: "border-box",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all var(--ba-duration-2) var(--ba-ease)",
                ...style,
            }}
        >
            <span
                style={{
                    width: 14,
                    height: 14,
                    background: on ? "var(--ba-color-fg-positive)" : "var(--ba-color-fg-disabled)",
                }}
            />
        </span>
    );
}
