import React from "react";
import { Swatch } from "./Swatch.jsx";
import { Badge } from "./Badge.jsx";

/** Keyboard-list row: cursor slot, name, mini palette pips, appearance tag. */
export function ListRow({ selected = false, dimmed = false, name, pips, appearance, onClick, style }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 20px",
                fontFamily: "var(--ba-font-mono)",
                fontSize: "var(--ba-font-size-3)",
                cursor: "pointer",
                color: dimmed
                    ? "var(--ba-color-fg-disabled)"
                    : selected
                    ? "var(--ba-color-fg-default)"
                    : "var(--ba-color-fg-subtle)",
                ...(selected
                    ? { background: "var(--ba-color-bg-hint)", borderLeft: "var(--ba-selection-edge)", marginLeft: -2 }
                    : {}),
                ...style,
            }}
        >
            <span style={{ width: 12, color: "var(--ba-color-fg-positive)" }}>{selected ? "›" : ""}</span>
            <span style={{ flex: 1, fontWeight: selected ? 700 : 400 }}>{name}</span>
            {pips && !dimmed ? <Swatch variant="pips" colors={pips} /> : null}
            {appearance ? <Badge size="mini">{appearance}</Badge> : null}
        </div>
    );
}
