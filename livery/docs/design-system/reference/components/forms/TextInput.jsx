import React from "react";

/** Labeled text field: uppercase mono label above, recessed mono value. */
export function TextInput({ label, value, placeholder, optional = false, editing = false, hint, style }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--ba-font-mono)", ...style }}>
            {label
                ? (
                    <span style={{ fontSize: "var(--ba-font-size-0)", letterSpacing: "var(--ba-font-letterspacing-label)", color: "var(--ba-color-fg-hint)", textTransform: "uppercase" }}>
                        {label}
                        {optional ? <span style={{ color: "var(--ba-color-fg-disabled)" }}> · OPTIONAL</span> : null}
                    </span>
                )
                : null}
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--ba-color-bg-recessed)",
                    border: editing ? "1px solid var(--ba-color-focus)" : "var(--ba-border)",
                    padding: "8px 12px",
                    fontSize: "var(--ba-font-size-2)",
                    color: value ? "var(--ba-color-fg-default)" : "var(--ba-color-fg-disabled)",
                }}
            >
                <span>
                    {value || placeholder}
                    {editing ? <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--ba-color-focus)", verticalAlign: "text-bottom" }} /> : null}
                </span>
                {editing && hint ? <span style={{ marginLeft: "auto", fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-hint)" }}>{hint}</span> : null}
            </span>
        </div>
    );
}
