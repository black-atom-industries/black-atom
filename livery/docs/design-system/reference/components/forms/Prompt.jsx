import React from "react";

/** Command-line search prompt: » glyph, block caret, n/m match counter. */
export function Prompt({ value = "", placeholder = "search theme names — /", count, focused = false, style }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: focused ? "1px solid var(--ba-color-focus)" : "var(--ba-border)",
                background: "var(--ba-color-bg-recessed)",
                padding: "8px 12px",
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-3)",
                ...style,
            }}
        >
            <span style={{ color: "var(--ba-color-fg-positive)", fontWeight: 700 }}>»</span>
            {value
                ? (
                    <span style={{ color: "var(--ba-color-fg-default)" }}>
                        {value}
                        <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--ba-color-focus)", verticalAlign: "text-bottom" }} />
                    </span>
                )
                : <span style={{ color: "var(--ba-color-fg-hint)" }}>{placeholder}</span>}
            {count ? <span style={{ marginLeft: "auto", fontSize: "var(--ba-font-size-1)", color: "var(--ba-color-fg-hint)" }}>{count}</span> : null}
        </div>
    );
}
