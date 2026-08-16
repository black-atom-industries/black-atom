import React from "react";

/** App header bar: wordmark (dot as O) + version left, context right. */
export function AppHeader({ product = "LIVERY", version, context, style }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "var(--ba-border)",
                fontFamily: "var(--ba-font-mono)",
                ...style,
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "var(--ba-font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>
                    BLACK AT
                    <span style={{ display: "inline-block", width: "0.62em", height: "0.62em", borderRadius: "var(--ba-radius-dot)", background: "var(--ba-color-fg-default)", margin: "0 0.03em" }} />
                    M {product}
                </span>
                {version ? <span style={{ fontSize: "var(--ba-font-size-1)", color: "var(--ba-color-fg-hint)" }}>{version}</span> : null}
            </div>
            {context ? <div style={{ fontSize: "var(--ba-font-size-1)", color: "var(--ba-color-fg-hint)", letterSpacing: "0.1em" }}>{context}</div> : null}
        </div>
    );
}
