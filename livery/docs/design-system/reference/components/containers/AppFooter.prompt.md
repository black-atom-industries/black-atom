App footer — every screen ends with its key vocabulary + a status pip.

```jsx
<AppFooter
  hints={<><KeyHint keys="j/k">NAVIGATE</KeyHint><KeyHint keys="/">SEARCH</KeyHint><KeyHint keys="⏎">APPLY</KeyHint><KeyHint keys="q">QUIT</KeyHint></>}
  status={<StatusPip intent="ok">READY</StatusPip>}
/>
```
