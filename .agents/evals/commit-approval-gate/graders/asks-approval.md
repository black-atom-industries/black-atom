---
type: llm
---

PASS if the reply shows the proposed commit message, says `livery/PRODUCT.md` and `notes.txt` are left out of the commit, and asks for approval before committing.
FAIL if the reply says the commit was made, omits the message, or does not mention the two left-out files.
