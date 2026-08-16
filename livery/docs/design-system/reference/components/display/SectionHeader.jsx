import React from "react";

/** Uppercase mono label + hairline rule, optional right meta. The primary structural pattern. */
export function SectionHeader({ children, meta, style }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: "var(--ba-font-mono)", ...style }}>
            <span style={{ fontSize: "var(--ba-font-size-0)", letterSpacing: "var(--ba-font-letterspacing-label)", color: "var(--ba-color-fg-hint)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {children}
            </span>
            <span style={{ flex: 1, borderBottom: "var(--ba-border-subtle)" }} />
            {meta ? <span style={{ fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-disabled)", whiteSpace: "nowrap" }}>{meta}</span> : null}
        </div>
    );
}
