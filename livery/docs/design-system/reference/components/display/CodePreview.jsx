import React from "react";

/** Recessed code block colored by THEME palette values (content, not chrome tokens). */
export function CodePreview({ children, style }) {
    return (
        <div
            style={{
                background: "var(--ba-color-bg-recessed)",
                border: "var(--ba-border-subtle)",
                padding: "14px 16px",
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-2)",
                lineHeight: "var(--ba-font-lineheight-code)",
                color: "var(--ba-color-fg-subtle)",
                whiteSpace: "pre-wrap",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

/** Inline syntax-colored token for CodePreview content. Pass raw palette hex. */
export function CodeToken({ color, children }) {
    return <span style={{ color }}>{children}</span>;
}
