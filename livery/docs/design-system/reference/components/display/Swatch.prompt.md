Theme color display — the one sanctioned home of saturated color (it's content, not chrome).

```jsx
<Swatch variant="band" color="#C46A5A" label="ACCENT · BURGUNDY" />
<Swatch variant="band" color="#C46A5A" label="ACCENT · 01" tag="DERIVED FROM PALETTE.RED" />
<div style={{ display: "flex", gap: 2 }}>{palette.map(c => <Swatch key={c} color={c} />)}</div>
<Swatch variant="pips" colors={["#C46A5A", "#D9A662", "#8FA36B", "#A97BA2"]} />
```

When a theme has no defined accents, derive bands from the ANSI palette and always set `tag` — never hide the section, never show it empty.
