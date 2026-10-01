---
type: regex
pattern: '## \[Unreleased\]'
match: not_contains
target:
    source: file
    path: CHANGELOG.md
---
