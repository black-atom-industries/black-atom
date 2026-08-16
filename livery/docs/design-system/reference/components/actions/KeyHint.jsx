import React from "react";

/** Footer keyboard-hint vocabulary: key in subtle fg, action label in hint fg. */
export function KeyHint({ keys, children, style }) {
    return (
        <span
            style={{
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-1)",
                color: "var(--ba-color-fg-hint)",
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            <span style={{ color: "var(--ba-color-fg-subtle)" }}>{keys}</span> {children}
        </span>
    );
}
