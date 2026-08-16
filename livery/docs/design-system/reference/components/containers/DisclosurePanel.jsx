import React from "react";

/** Expandable bordered panel; header row always visible, body when expanded. */
export function DisclosurePanel({ expanded = false, header, children, style }) {
    return (
        <div
            style={{
                border: expanded ? "var(--ba-border-strong)" : "var(--ba-border)",
                fontFamily: "var(--ba-font-mono)",
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 16px",
                    ...(expanded ? { borderBottom: "var(--ba-border)", background: "var(--ba-color-bg-subtle)" } : {}),
                }}
            >
                {header}
                <span style={{ marginLeft: "auto", fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-disabled)", whiteSpace: "nowrap" }}>
                    ⏎ {expanded ? "COLLAPSE" : "EXPAND"}
                </span>
            </div>
            {expanded ? children : null}
        </div>
    );
}
