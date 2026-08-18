# Cleanup after the test pass

Run this once `HOW_TO_TEST.md` is signed off. Order matters in the GitHub section; the rest is
independent. Everything here is reversible except deletes, which are marked.

## GitHub

- [ ] Move livery's open issues to this repo: #35, #36, #37, #38, #44, #46, #47, #65, #67
      (`gh issue transfer <n> nikbrunner/black-atom --repo black-atom-industries/livery`).
      Archived repos freeze issues, so this comes first.
- [ ] Close livery#68 with a link here.
- [ ] Pointer README in each absorbed repo, then archive it (archiving locks the README): core,
      livery, ghostty, herdr, lazygit, niri, nvim, obsidian, tmux, waybar, wezterm, zed,
      adapter-template. Also website and ui, since the placeholders live here now.
- [ ] Decide per remaining repo: transfer to `nikbrunner` (helm.tmux, helm.herdr, iter.nvim,
      radar.nvim, atlas, shiplog) or delete (ai, claude are the old multi-repo agent tooling;
      `.github`, `.github-private` are org profile and labels). Deletion is not reversible; the
      old agent context is already folded into this repo's `AGENTS.md` and skills.
- [ ] Update anything that clones the old repos: `dots/install/mac/README.md` and
      `dots/install/arch/README.md` clone `black-atom-industries/helm.tmux`; the nvim pack lock
      and `plugin/50_specs/black_atom/radar.lua` point at `black-atom-industries/{nvim,radar.nvim}`.
- [ ] Close the organization once it is empty (Settings → Danger zone). Keep the name if you
      want it back later; an org can be recreated, but the handle is not reserved.
- [ ] Merge release PR #1 (0.6.0) when the first release is due (issue #6).

## JSR

- [ ] helm.tmux consumes `@black-atom/core` from JSR (issue #2). Solve that first, then
      deprecate `@black-atom/core` on jsr.io (unpublish only if nothing else pins it).
- [ ] Remove core's `publish` task and the `exports`/`publish` blocks from `core/deno.json`.

## Local machine

- [ ] Switch dots to the bundle: `scripts/dots/theme-link.sh` (`BLACK_ATOM_DIR` → this repo's
      `adapters/`, or drop the script if livery's symlinks cover it now),
      `common/.config/nvim/plugin/50_specs/black_atom/nvim.lua` (rtp →
      `~/repos/nikbrunner/black-atom/adapters/nvim`), the `nvim-pack-lock.json` entry for
      `black-atom-industries/nvim`, `common/.gitconfig.delta` header comment, the stale
      `sessions/repos_black-atom-industries_*` files.
- [ ] `~/.config/black-atom/themes/` is the old managed dir (1.6 MB); livery reads
      `~/.local/share/black-atom/themes/` now. Delete after the switch. Note
      `~/.config/black-atom/livery` is a symlink into dots, so livery's config is tracked there.
- [ ] `~/repos/black-atom-industries/` (7 GB, mostly `target/` and `node_modules/`): once the
      repos are archived and dots no longer link into it, delete the whole directory. Until then
      it is the fallback.
- [ ] `~/.claude/projects/-Users-brunner-repos-black-atom-industries/` holds the migration
      session's memory and `.claude/settings.local.json` in this repo holds a write guard from
      the run; both can go.
- [ ] Old plugin data: `~/.local/share/nvim/site/pack/*/start/black-atom*` from earlier manual
      installs, if any; the bundle uses `pack/black-atom/start/black-atom` via livery.

## Repo leftovers

Carried over on purpose ("copy everything, prune later"). Delete what you do not want:

- [ ] `livery/plans/`, `adapters/nvim/plans/` (old planning notes), `adapters/nvim/todos.json`
      (empty), `livery/.npmrc`, `livery/package-lock.json`, `livery/skills-lock.json`,
      `adapters/nvim/mise.toml`, `livery/.tanstack/`
- [ ] `core/docs/old_screenshots/`, `livery/design/drafts/` (images), `livery/docs/design-system/`
      (100 tracked reference files, excluded from checks), `livery/docs/benchmarks.md`
- [ ] `core/CHANGELOG.md`, `livery/CHANGELOG.md`: release-please writes one root `CHANGELOG.md`
      from now on; keep the old ones as history or fold them into a `docs/history/`.
- [ ] `adapters/nvim/syntax_examples/` (fixture files, excluded from checks) and
      `adapters/nvim/update_supported_plugins.sh`: keep if the plugin-support table stays.
- [ ] `livery/PRODUCT.md`, `livery/DESIGN.md`, `livery/ADAPTERS.md`: still true, decide whether
      they move under `docs/`.
- [ ] `docs/plans/2026-08-16-phase-*.md`, `MIGRATION.md`, `HOW_TO_TEST.md`, this file: history
      of the move; archive under `docs/history/` or delete once the org is closed.
- [ ] Issue #7 (post-migration polish) lists the code-level minors.

## Caches

- [ ] `cargo clean` at the repo root if `target/` grows (it holds the tauri bundle builds).
- [ ] `~/.cache/deno` and `~/.cargo/registry` are shared with everything else; leave them.
