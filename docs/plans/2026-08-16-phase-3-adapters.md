# Phase 3 — Adapters

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The nine text-config adapters emit `themes/<collection>/black-atom-*.<ext>`; the Neovim adapter emits self-contained `colors/*.lua` that load with nothing but `adapters/nvim` on the runtimepath and honour `vim.g.black_atom_core_config`.

**Architecture:** Core's generator gains an optional per-collection `output` directory (default: the template's directory), so a shared template can still write per-collection dirs (waybar, herdr) and nvim can write `colors/`. The Neovim template renders the whole theme table into each `colors/<key>.lua`, which then calls a small runtime module under `lua/black-atom/` (same rtp entry) that merges the config global with defaults and sets highlights. The plugin's setup/commands/cache/file machinery is removed.

**Tech Stack:** Deno, Eta templates, Neovim 0.10+ Lua.

## Global Constraints

- Source repos under `/Users/brunner/repos/black-atom-industries/<name>/` are read-only.
- Commit format: `<type>(<scope>): <description> black-atom-industries/livery#68`. Subagents never commit.
- No comments that are conversation residue; docs state what is.
- Simplest thing that works. Surgical changes. No `any`.
- Generated output is never hand-edited: change the template or config and regenerate.
- Headless Neovim checks run with `-u NONE` and an explicit `--cmd "set rtp+=..."`, never Nik's `init.lua`. Never touch `~/.config/nvim`.
- Every commit green: `deno task check`, `deno task test`.

## Facts

- Output path today (`core/src/lib/template.ts` ~line 67): `templatePath.replace(".template.", ".").replace(/collection/, themeKey)`, so output lands next to the template. Per-collection templates live in `themes/<collection>/collection.template.<ext>`. herdr and waybar use one shared `themes/collection.template.<ext>`; herdr's `scripts/postGenerate.ts` then moves files into `themes/<collection>/`; waybar stays flat (`themes/black-atom-*.css`), which is the one layout to fix.
- Adapter config schema: zod in `core/src/lib/validate-adapter.ts` (`createAdapterConfigSchema`), JSON schema written by `core/src/lib/generate-schema.ts` via `cd core && deno task schema`.
- nvim today: templates `lua/black-atom/themes/<collection>/collection.template.lua` render a Lua module (`M.meta`, `M.primaries`, `M.palette`, `M.ui`, `M.syntax`, ...) into `lua/black-atom/themes/<collection>/<key>.lua`; `colors/<key>.lua` is a two-line stub `require("black-atom").load(require("black-atom.themes.<c>.<key>"))`. `lua/black-atom/init.lua` has `setup(opts)` and `load(theme)`; `config.lua` holds `default_config` and merges into `vim.g.black_atom_core_config`; `highlights.lua` builds via `lib/highlights.lua`, `highlights/{ui,syntax,lsp}.lua`, `highlights/plugins/*`, with a file cache in `lib/cache.lua`. `lua/black-atom/themes/nord/` has templates for no configured theme (dead).
- livery's nvim updater (`livery/src-tauri/src/updaters/nvim.rs`) applies by `execute("colorscheme <key>")` over nvim sockets; it does not read the plugin's Lua. Reclassifying nvim as Linked in `livery/src-tauri/src/themes/registry.rs` needs a placement that puts `colors/` and `lua/` on the runtimepath (`~/.local/share/nvim/site/pack/black-atom/start/black-atom` → the unpacked nvim theme dir); that lands with the embedding in Phase 4 where the files exist. Decision recorded in `MIGRATION.md`.

---

### Task 1: Per-collection `output` in core; waybar and herdr layouts

**Files:**

- Modify: `core/src/lib/validate-adapter.ts`, `core/src/lib/generate-schema.ts`, `core/adapter.schema.json` (regenerated), `core/src/lib/template.ts`, `core/src/tasks/adapters/watch.ts` (if it maps template paths to output), `core/docs/adapter_development-guide.md` (document `output`)
- Modify: `adapters/waybar/black-atom-adapter.json`, `adapters/herdr/black-atom-adapter.json`, `adapters/herdr/deno.json`
- Delete: `adapters/herdr/scripts/postGenerate.ts`, flat `adapters/waybar/themes/black-atom-*.css`
- Tests: `core/src/lib/template_test.ts` or the existing test file for template.ts (find with `ls core/src/lib/*test*`), TDD.

- [ ] **Step 1: failing test** — a collection config `{ template: "themes/collection.template.css", output: "themes/jpn", themes: ["black-atom-jpn-koyo-yoru"] }` produces `themes/jpn/black-atom-jpn-koyo-yoru.css`; without `output` the path is `themes/black-atom-jpn-koyo-yoru.css` (current behaviour). Run, see it fail.
- [ ] **Step 2: implement** — zod: `output: z.string().optional()` on the collection schema; JSON schema property `output` (`"Directory the generated files are written to, relative to the adapter root; defaults to the template's directory"`); `template.ts`: `const outputDir = collection.output ? join(adapterDir, collection.output) : dirname(templatePath); const outputPath = join(outputDir, basename(templatePath).replace(".template.", ".").replace(/collection/, themeKey));` (adapt to how the function currently receives the adapter dir/collection). `cd core && deno task schema`.
- [ ] **Step 3: waybar** — each of the six collections gets `"output": "./themes/<collection>"`; delete the flat generated files; `cd adapters/waybar && deno task generate`; expect `themes/<collection>/black-atom-*.css`, 38 files, no flat ones left, `themes/collection.template.css` still the single template.
- [ ] **Step 4: herdr** — each collection gets `"output": "./themes/<collection>"`; remove `postGenerate` from `black-atom-adapter.json`; `deno.json` `generate` becomes `deno run -A ../../core/src/cli/index.ts generate`, `postGenerate` task removed; delete `scripts/postGenerate.ts`; keep `scripts/dev.ts` (watcher wrapper) only if it does more than `generate --watch`, otherwise replace `dev` with `deno run -A ../../core/src/cli/index.ts generate --watch` and delete it. Regenerate; output identical to before (`git status --porcelain adapters/herdr` shows only the config/script changes).
- [ ] **Step 5: Verify**

```sh
cd black-atom && deno task check && deno test -P core/ && deno task generate && git status --porcelain
for a in ghostty herdr lazygit niri obsidian tmux waybar wezterm zed; do
  find adapters/$a/themes -maxdepth 1 -name 'black-atom-*' | wc -l   # 0 for all nine
  find adapters/$a/themes -mindepth 2 -name 'black-atom-*' | wc -l    # 38 (obsidian 34)
done
```

- [ ] **Commit** (orchestrator): `feat(core): per-collection output dir; waybar and herdr emit themes/<collection>/ black-atom-industries/livery#68`

---

### Task 2: Neovim: self-contained `colors/*.lua`, runtime shrinks

Load `dev-nvim`. Opus.

**Files:**

- Create: `adapters/nvim/templates/collection.template.lua` (one shared template; or keep per-collection templates under `adapters/nvim/templates/<collection>/` if collections differ, they do not today: check with `diff` across the six existing templates and choose one shared template if identical apart from paths)
- Modify: `adapters/nvim/black-atom-adapter.json` (template path + `"output": "./colors"` per collection), `adapters/nvim/lua/black-atom/init.lua`, `adapters/nvim/lua/black-atom/config.lua`, `adapters/nvim/lua/black-atom/highlights.lua`, `adapters/nvim/README.md` (install section), `adapters/nvim/CONTRIBUTION.md` if it documents the layout
- Delete: `adapters/nvim/lua/black-atom/themes/` (all collections incl. `nord`, templates and generated), old `adapters/nvim/colors/*.lua` stubs (regenerated), `lua/black-atom/commands.lua`, `lua/black-atom/api.lua`, `lua/black-atom/lib/cache.lua`, `lib/files.lua`, `lib/themes.lua`, `lib/debug.lua`, `lib/validate.lua` — each only if nothing the colorschemes need at load still imports it (grep `require("black-atom.` after the rewrite; delete what is unreachable from `colors/*.lua`). `adapters/nvim/update_supported_plugins.sh` stays.

- [ ] **Step 1: template** — renders the whole theme table (same fields the current template renders: meta, primaries, palette, ui, syntax, feedback, everything `lib/highlights.lua` and `highlights/*` read) as a local, then:

```lua
require("black-atom").load(theme)
```

Output file name `black-atom-<collection>-<name>.lua` in `colors/`.

- [ ] **Step 2: runtime** — `lua/black-atom/init.lua` keeps only `M.load(theme)`: read `vim.g.black_atom_core_config` (may be nil or partial), `vim.tbl_deep_extend("force", defaults, user or {})` where `defaults` is the current `default_config` from `config.lua` minus `debug`, `theme`, `collection` (those two are set from `theme.meta` at load); never write the global back; `hi clear` + `syntax reset`; `vim.g.colors_name = theme.meta.key`; `termguicolors`; `background = theme.meta.appearance`; build the highlight map via the existing `lib/highlights.lua` + `highlights/*` and set it. No file cache (delete `lib/cache.lua` and its call sites). `M.setup` is removed. `types.lua` stays as annotations; drop the `theme`/`collection`/`debug` config fields from `BlackAtom.Config` if that type still exists.
- [ ] **Step 3: adapter config** — every collection: `"template": "./templates/collection.template.lua"`, `"output": "./colors"`. Regenerate: `cd adapters/nvim && deno task generate`; expect 38 files in `colors/`, none elsewhere, `git status` shows the old `lua/black-atom/themes/**` deleted and `colors/*` rewritten.
- [ ] **Step 4: gate (run exactly these)**

```sh
cd black-atom
nvim --headless -u NONE --cmd "set rtp+=adapters/nvim" \
  +"colorscheme black-atom-jpn-koyo-yoru" \
  +"lua print(vim.fn.synIDattr(vim.fn.hlID('Normal'),'bg'))" +q 2>&1
nvim --headless -u NONE --cmd "set rtp+=adapters/nvim" \
  --cmd "lua vim.g.black_atom_core_config = { styles = { transparency = 'full' } }" \
  +"colorscheme black-atom-jpn-koyo-yoru" \
  +"lua print(vim.fn.synIDattr(vim.fn.hlID('Normal'),'bg'))" +q 2>&1
nvim --headless -u NONE --cmd "set rtp+=adapters/nvim" \
  --cmd "lua vim.g.black_atom_core_config = { styles = { syntax = { comments = { italic = false, bold = true } } } }" \
  +"colorscheme black-atom-jpn-koyo-yoru" \
  +"lua print(vim.fn.synIDattr(vim.fn.hlID('Comment'),'bold'))" +q 2>&1
```

Expected: first prints a hex colour, second prints an empty value (transparent), third prints `1`; none prints an error. Also every one of the 38 colorschemes loads: loop `for f in adapters/nvim/colors/*.lua; do nvim --headless -u NONE --cmd "set rtp+=adapters/nvim" +"colorscheme $(basename $f .lua)" +q 2>&1 | grep -i error; done` prints nothing. Confirm the transparency option name/values by reading `lib/bg.lua`/`highlights/ui.lua` first; if `transparency` is not the switch that clears `Normal` bg, use the option that is and say so.

- [ ] **Step 5: docs** — `adapters/nvim/README.md` install section: manual install is "put `adapters/nvim` (or a copy of it) on the runtimepath (`vim.opt.rtp:append(...)`, or via a plugin manager pointing at the directory) and set `vim.g.black_atom_core_config` before `:colorscheme`"; list the config options with defaults; drop `setup()`; drop everything about `lua/black-atom/themes`, the cache, and the multi-repo layout. Keep it short. `deno fmt` on the changed markdown; `stylua --check` on the Lua if `stylua` is installed (`which stylua`), otherwise skip and say so.

- [ ] **Step 6: Verify** — `deno task check`, `deno task test`, `deno task generate` idempotent, `git status --porcelain` clean after regeneration; the gate commands above.

- [ ] **Commit** (orchestrator): `feat(nvim): self-contained colorschemes in colors/, runtime reads the config global black-atom-industries/livery#68`

---

### Task 3: Phase gate (orchestrator)

- [ ] `deno task generate` produces the declared layouts for all ten (`themes/<collection>/` for nine, `colors/` for nvim); tree clean afterwards.
- [ ] nvim headless checks from Task 2 Step 4, run by the orchestrator.
- [ ] `deno task check`, `deno task test`, `cargo test` green; old repos untouched.
- [ ] Reviewer (sonnet) + Codex; fix Important+.
- [ ] `MIGRATION.md`: Phase 4, Next 4.1; note the nvim Linked reclassification moves to Phase 4 with the embedding.
