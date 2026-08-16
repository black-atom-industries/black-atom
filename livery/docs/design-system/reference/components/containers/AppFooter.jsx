import React from "react";

/** App footer: key vocabulary left, status pip right. */
export function AppFooter({ hints, status, style }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                borderTop: "var(--ba-border)",
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-1)",
                color: "var(--ba-color-fg-hint)",
                ...style,
            }}
        >
            <div style={{ display: "flex", gap: 18, whiteSpace: "nowrap" }}>{hints}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{status}</div>
        </div>
    );
}
