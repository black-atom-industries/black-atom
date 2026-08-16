Segmented single-choice group — chips where exactly one is active; use for 2–4 short options in settings rows.

```jsx
<RadioGroup
  options={[{ value: "keep", label: "KEEP + REPORT" }, { value: "rollback", label: "ROLL BACK" }]}
  value="keep"
  onChange={setMode}
/>
```

`h/l` moves the active option when the row is focused.
