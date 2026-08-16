import React from "react";

/** Theme color display: band (full-width labeled bar), cell (grid swatch + hex), pips (mini row). */
export function Swatch({ variant = "cell", color, label, hex, tag, colors, style }) {
    if (variant === "pips") {
        return (
            <span style={{ display: "inline-flex", gap: 2, ...style }}>
                {(colors || []).map((c, i) => (
                    <span key={i} style={{ width: "var(--ba-size-pip-mini)", height: "var(--ba-size-pip-mini)", background: c }} />
                ))}
            </span>
        );
    }
    if (variant === "band") {
        return (
            <div style={{ display: "flex", alignItems: "center", background: color, height: "var(--ba-size-band)", padding: "0 16px", fontFamily: "var(--ba-font-mono)", ...style }}>
                <span style={{ fontSize: "var(--ba-font-size-0)", letterSpacing: "var(--ba-font-letterspacing-label)", color: "var(--ba-color-bg-recessed)", textTransform: "uppercase" }}>{label}</span>
                {tag
                    ? <span style={{ marginLeft: 14, fontSize: "var(--ba-font-size-00)", letterSpacing: "0.1em", color: "var(--ba-color-bg-recessed)", border: "1px solid currentColor", padding: "1px 6px", opacity: 0.75 }}>{tag}</span>
                    : null}
                <span style={{ marginLeft: "auto", fontSize: "var(--ba-font-size-1)", color: "var(--ba-color-bg-recessed)" }}>{hex || color}</span>
            </div>
        );
    }
    return (
        <div style={{ flex: 1, fontFamily: "var(--ba-font-mono)", ...style }}>
            <div style={{ height: "var(--ba-size-swatch)", background: color }} />
            <div style={{ fontSize: "var(--ba-font-size-00)", color: "var(--ba-color-fg-hint)", paddingTop: 3 }}>{(hex || color || "").replace("#", "")}</div>
        </div>
    );
}
