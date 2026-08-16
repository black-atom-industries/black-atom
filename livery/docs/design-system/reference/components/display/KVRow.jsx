import React from "react";

/** Datasheet key-value pair: uppercase hint label left, mono value right. */
export function KVRow({ label, children, intent, style }) {
    const valueColor = intent === "positive"
        ? "var(--ba-color-fg-positive)"
        : intent === "warn"
        ? "var(--ba-color-fg-warn)"
        : intent === "negative"
        ? "var(--ba-color-fg-negative)"
        : "var(--ba-color-fg-subtle)";
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-1)", ...style }}>
            <span style={{ color: "var(--ba-color-fg-hint)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
            <span style={{ color: valueColor, textAlign: "right" }}>{children}</span>
        </div>
    );
}
