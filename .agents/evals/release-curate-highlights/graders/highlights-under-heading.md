---
type: regex
pattern: '^## \[0\.11\.0\]\(\S+\) \(\d{4}-\d{2}-\d{2}\)\n\n### Highlights\n\n[\s\S]+?\n\n### Features\n'
flags: m
target:
    source: file
    path: CHANGELOG.md
---
