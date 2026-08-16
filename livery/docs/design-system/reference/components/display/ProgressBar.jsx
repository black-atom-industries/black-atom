import React from "react";

/** 3px determinate progress bar. Fill animates width only. */
export function ProgressBar({ value = 0, intent = "positive", style }) {
    const fill = intent === "negative" ? "var(--ba-color-fg-negative)" : "var(--ba-color-fg-positive)";
    return (
        <div style={{ height: "var(--ba-size-bar)", background: "var(--ba-color-bg-hint)", ...style }}>
            <div
                style={{
                    height: "100%",
                    width: `${Math.max(0, Math.min(100, value))}%`,
                    background: fill,
                    transition: "width var(--ba-duration-2) var(--ba-ease-linear)",
                }}
            />
        </div>
    );
}
