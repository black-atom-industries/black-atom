Bracket-notation actuator button — the only button style in the system; use `hotkey` to surface the keyboard binding.

```jsx
<Button intent="primary" onClick={apply}>APPLY THEME</Button>
<Button hotkey="r" onClick={retry}>RETRY FAILED</Button>
<Button intent="ghost">DISMISS</Button>
```

Variants: `intent` primary (filled contrast, weight 700) / secondary (1px strong border) / ghost (text only, subtle fg); `disabled` mutes fill + text. Never rounded, never shadowed, label always uppercase.
