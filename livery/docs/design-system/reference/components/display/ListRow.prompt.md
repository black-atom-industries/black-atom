Keyboard-list row — cursor slot, name, palette pips, appearance tag. Group rows under SectionHeaders per collection.

```jsx
<ListRow name="Koyo Hiru" pips={["#B0543F","#7A8B4C","#B08D3E","#5F7A94"]} appearance="L" />
<ListRow selected name="Koyo Yoru" pips={["#C46A5A","#D9A662","#8FA36B","#A97BA2"]} appearance="D" />
<ListRow dimmed name="Dark Dimmed" appearance="D" />
```

Query misses are `dimmed`, never removed — the list keeps its shape.
