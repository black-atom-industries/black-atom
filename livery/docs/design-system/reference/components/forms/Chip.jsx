import React from "react";

/** Filter/selection chip. Active = contrast inversion; focused adds positive outline. */
export function Chip({ active = false, focused = false, hotkey, children, onClick, style }) {
    return (
        <span
            onClick={onClick}
            style={{
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-0)",
                letterSpacing: "var(--ba-font-letterspacing-chip)",
                textTransform: "uppercase",
                padding: "3px 8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                ...(active
                    ? { background: "var(--ba-color-bg-contrast)", color: "var(--ba-color-fg-contrast)", fontWeight: 700 }
                    : { border: "var(--ba-border)", color: "var(--ba-color-fg-subtle)" }),
                ...(focused ? { outline: "var(--ba-focus-outline)", outlineOffset: "var(--ba-focus-offset)" } : {}),
                ...style,
            }}
        >
            {hotkey ? <span style={{ color: active ? "inherit" : "var(--ba-color-fg-positive)" }}>{hotkey} </span> : null}
            {children}
        </span>
    );
}
