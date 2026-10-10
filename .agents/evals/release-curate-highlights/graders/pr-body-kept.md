---
type: llm
focus:
    source: file
    path: .gh-stub/edited-body.md
---

PASS if the PR body keeps release-please's first line ("I have created a release"), keeps the `---` line before and after the notes, keeps the footer ("This PR was generated with Release Please"), and the text between the two `---` lines is the 0.11.0 section of CHANGELOG.md line for line, heading included, with the Highlights.
FAIL if the header or footer is missing or rewritten, a `---` line is missing, or the notes differ from the CHANGELOG.md section.
