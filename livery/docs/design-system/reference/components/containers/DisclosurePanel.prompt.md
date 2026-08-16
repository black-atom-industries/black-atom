Expandable bordered panel — the composable settings-row primitive; one per adapter, no per-tool layouts.

```jsx
<DisclosurePanel
  expanded
  header={<><Toggle on /><b style={{ width: 110 }}>ghostty</b><span>~/.config/ghostty/config</span><StatusPip intent="ok">OK</StatusPip></>}
>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 16 }}>
    <TextInput label="CONFIG_PATH" value="~/.config/ghostty/config" />
    <TextInput label="MATCH_PATTERN" value="^theme = .*$" />
  </div>
</DisclosurePanel>
```
