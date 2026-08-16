# livery

Theme management desktop app for [Black Atom Industries](https://github.com/black-atom-industries).
Pick a theme once, apply it across all configured developer tools simultaneously.

## Architecture

**TypeScript (frontend) = orchestrator.** Decides _what_ to do. **Rust (backend) = executor.** Does
_how_ to do it — all OS operations.

No direct file system access from TypeScript. No shell commands from TypeScript.

Livery develops against the **sibling `../core` checkout** via the `links` field in `deno.json` —
clone [black-atom-industries/core](https://github.com/black-atom-industries/core) alongside livery.

See [DESIGN.md](DESIGN.md) for config decisions, updater flow, and data architecture. See
[ADAPTERS.md](ADAPTERS.md) for the theme provisioning classification and per-adapter setup
contracts.

## Shared Language

See [GLOSSARY.md](GLOSSARY.md) for ubiquitous terms.

## Scoped Context

- **Frontend:** [src/AGENTS.md](src/AGENTS.md) — React patterns, TypeScript, Deno
- **Backend:** [src-tauri/AGENTS.md](src-tauri/AGENTS.md) — Rust commands, file_ops, config module

## Project Tracking

Issues tracked in [GitHub Issues](https://github.com/black-atom-industries/livery/issues).

## Sources of Truth

- **Tauri v2**: https://tauri.app/
- **TanStack Query/Router/Store**: https://tanstack.com/
- **@black-atom/core**: https://jsr.io/@black-atom/core
- **Deno**: https://docs.deno.com/
