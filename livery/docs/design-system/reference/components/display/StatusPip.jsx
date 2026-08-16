import React from "react";

const INTENT_COLOR = {
    ok: "var(--ba-color-fg-positive)",
    running: "var(--ba-color-fg-default)",
    pending: null,
    warn: "var(--ba-color-fg-warn)",
    error: "var(--ba-color-fg-negative)",
    off: "var(--ba-color-border-default)",
};

/** Square status pip + optional mono label. Pips are never round. */
export function StatusPip({ intent = "ok", children, style }) {
    const color = INTENT_COLOR[intent];
    const pip = intent === "pending"
        ? { width: "var(--ba-size-pip)", height: "var(--ba-size-pip)", border: "var(--ba-border)", boxSizing: "border-box" }
        : { width: "var(--ba-size-pip)", height: "var(--ba-size-pip)", background: color };
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-0)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: intent === "pending" || intent === "off" ? "var(--ba-color-fg-disabled)" : color,
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            <span style={pip} />
            {children}
        </span>
    );
}
