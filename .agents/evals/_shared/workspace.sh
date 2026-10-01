# Sourced by each case's fixture.sh: rebuilds this repository's history in the empty eval workspace
# without the agent setup, so the no-plugin arm cannot recover the skills from git.
root="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
git init -q -b main .
git -C "$root" fast-export HEAD -- . ':!.agents' ':!.claude' | git fast-import --quiet
git reset -q --hard main
git config user.name "Eval User"
git config user.email "eval@example.com"
