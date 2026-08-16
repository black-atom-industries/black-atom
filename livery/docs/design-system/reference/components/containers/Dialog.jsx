import React from "react";

/** Modal dialog frame: title + hint header, content slot, meta footer. Strong border, no shadow. */
export function Dialog({ title, hint = "esc CLOSE", footerLeft, footerRight, children, style }) {
    return (
        <div
            style={{
                background: "var(--ba-color-bg-subtle)",
                border: "var(--ba-border-strong)",
                fontFamily: "var(--ba-font-mono)",
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderBottom: "var(--ba-border)" }}>
                <span style={{ fontSize: "var(--ba-font-size-1)", letterSpacing: "0.16em", fontWeight: 700, textTransform: "uppercase" }}>{title}</span>
                <span style={{ fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-hint)", letterSpacing: "0.1em" }}>{hint}</span>
            </div>
            <div style={{ padding: 18 }}>{children}</div>
            {(footerLeft || footerRight)
                ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderTop: "var(--ba-border)", fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-hint)", letterSpacing: "0.1em" }}>
                        <span>{footerLeft}</span>
                        <span>{footerRight}</span>
                    </div>
                )
                : null}
        </div>
    );
}
