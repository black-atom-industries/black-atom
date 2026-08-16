Dialog frame — strong border, subtle surface, content behind dims to 30% opacity (no blur, no shadow).

```jsx
<Dialog title="FILTERS" footerLeft="12 THEMES MATCH" footerRight={<><KeyHint keys="h/l ←→">MOVE</KeyHint> <KeyHint keys="⏎">DONE</KeyHint></>}>
  <SectionHeader>COLLECTION</SectionHeader>
  <RadioGroup options={collections} value="jpn" />
</Dialog>
```

Every control inside must be keyboard-addressable (Chip hotkeys + hjkl/arrows).
