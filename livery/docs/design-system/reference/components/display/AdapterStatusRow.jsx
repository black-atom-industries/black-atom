import React from "react";
import { StatusPip } from "./StatusPip.jsx";
import { KVRow } from "./KVRow.jsx";
import { Button } from "../actions/Button.jsx";

const PIP_INTENT = {
    pending: "pending",
    running: "running",
    ok: "ok",
    warn: "warn",
    error: "error",
};

/**
 * One adapter's line in the ApplyRail. Pip + name + duration; error rows
 * expand in place into a detail block. Spec: Livery Explorations.dc.html#3f
 */
export function AdapterStatusRow({
    name,
    status = "pending",
    durationMs,
    message,
    path,
    code,
    cursored = false,
    expanded = false,
    onToggle,
    onRetry,
    style,
}) {
    const dim = status === "pending";
    const duration = durationMs != null && (status === "ok" || status === "warn")
        ? `${durationMs}ms`
        : "—";

    const rowStyle = {
        display: "flex",
        alignItems: "center",
        gap: "var(--ba-size-3)",
        padding: "var(--ba-size-2) var(--ba-size-4)",
        cursor: status === "error" ? "pointer" : "default",
        ...(cursored && {
            background: "var(--ba-color-bg-subtle)",
            borderLeft: "2px solid var(--ba-color-fg-positive)",
            paddingLeft: "calc(var(--ba-size-4) - 2px)",
        }),
    };

    const clickable = status === "error" ? onToggle : undefined;

    // warn = DEGRADED: two-line row, truncated reason preview under the name.
    if (status === "warn") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, ...rowStyle, alignItems: "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ba-size-3)" }}>
                    <StatusPip intent="warn" />
                    <span style={{ flex: 1, fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-1)", color: "var(--ba-color-fg-default)" }}>{name}</span>
                    <span style={{ fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-0)", letterSpacing: "0.06em", color: "var(--ba-color-fg-warn)" }}>DEGRADED</span>
                </div>
                <span style={{ paddingLeft: 18, fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-0)", color: "var(--ba-color-fg-hint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{message}</span>
            </div>
        );
    }

    return (
        <>
            <div style={{ ...rowStyle, ...style }} onClick={clickable}>
                <StatusPip intent={PIP_INTENT[status]} />
                <span style={{ flex: 1, fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-1)", color: dim ? "var(--ba-color-fg-disabled)" : "var(--ba-color-fg-default)" }}>
                    {name}{status === "running" ? " \u25B6" : ""}
                </span>
                {status === "error"
                    ? <span style={{ fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-0)", letterSpacing: "0.06em", color: "var(--ba-color-fg-negative)" }}>ERR</span>
                    : <span style={{ fontFamily: "var(--ba-font-mono)", fontSize: "var(--ba-font-size-0)", fontVariantNumeric: "tabular-nums", color: dim || status === "running" ? "var(--ba-color-fg-disabled)" : "var(--ba-color-fg-hint)" }}>{duration}</span>}
            </div>
            {status === "error" && expanded && (
                <div style={{ background: "var(--ba-color-bg-recessed)", borderTop: "var(--ba-border-subtle)", borderBottom: "var(--ba-border-subtle)", padding: "var(--ba-size-3) var(--ba-size-4)", display: "flex", flexDirection: "column", gap: "var(--ba-size-3)" }}>
                    {message && <div style={{ fontFamily: "var(--ba-font-body)", fontSize: "var(--ba-font-size-1)", lineHeight: 1.55, color: "var(--ba-color-fg-subtle)" }}>{message}</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {path && <KVRow label="PATH">{path}</KVRow>}
                        {code && <KVRow label="CODE" intent="negative">{code}</KVRow>}
                    </div>
                    {onRetry && <Button hotkey="r" onClick={onRetry} style={{ alignSelf: "flex-start" }}>RETRY FAILED</Button>}
                </div>
            )}
        </>
    );
}
