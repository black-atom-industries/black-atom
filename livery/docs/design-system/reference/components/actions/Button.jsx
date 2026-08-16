import React from "react";

/** Actuator-style button: bracket notation [ LABEL ], mono uppercase. */
export function Button({ intent = "secondary", disabled = false, hotkey, children, onClick, style }) {
    const base = {
        fontFamily: "var(--ba-font-mono)",
        fontSize: "var(--ba-font-size-1)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "6px 14px",
        cursor: disabled ? "default" : "pointer",
        background: "transparent",
        border: "1px solid transparent",
        color: "var(--ba-color-fg-default)",
        borderRadius: 0,
        transition: "background var(--ba-duration-1) var(--ba-ease)",
    };
    const intents = {
        primary: {
            background: "var(--ba-color-bg-contrast)",
            color: "var(--ba-color-fg-contrast)",
            fontWeight: 700,
        },
        secondary: { border: "var(--ba-border-strong)" },
        ghost: { color: "var(--ba-color-fg-subtle)" },
    };
    const disabledStyle = disabled
        ? {
            background: "var(--ba-color-bg-disabled)",
            color: "var(--ba-color-fg-disabled)",
            border: "1px solid transparent",
            fontWeight: 400,
        }
        : {};
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            style={{ ...base, ...(intents[intent] || intents.secondary), ...disabledStyle, ...style }}
        >
            [ {hotkey ? <span style={{ color: disabled ? "inherit" : "var(--ba-color-fg-positive)" }}>{hotkey}&nbsp;</span> : null}
            {children} ]
        </button>
    );
}
