import React from "react";

/** Bordered uppercase tag, e.g. appearance: DARK / LIGHT. size="mini" for list rows. */
export function Badge({ size = "default", children, style }) {
    const mini = size === "mini";
    return (
        <span
            style={{
                fontFamily: "var(--ba-font-mono)",
                fontSize: mini ? "var(--ba-font-size-00)" : "var(--ba-font-size-0)",
                letterSpacing: mini ? "0.04em" : "var(--ba-font-letterspacing-label)",
                textTransform: "uppercase",
                border: "var(--ba-border)",
                borderColor: mini ? "var(--ba-color-border-default)" : "var(--ba-color-border-strong)",
                color: mini ? "var(--ba-color-fg-hint)" : "var(--ba-color-fg-subtle)",
                padding: mini ? "1px 4px" : "3px 8px",
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            {children}
        </span>
    );
}
