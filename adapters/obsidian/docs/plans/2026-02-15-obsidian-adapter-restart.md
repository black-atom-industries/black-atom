# Obsidian Adapter Restart — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Replace the broken Obsidian adapter with a clean, colors-only
implementation for the Default collection (4 themes).

**Architecture:** Pure CSS template approach. Core generates one CSS file per
theme via Eta template. A minimal shell script concatenates the Style Settings
header + generated files into a single `theme.css`. No SCSS, no npm
dependencies.

**Tech Stack:** Eta templates (via black-atom-core), bash, Obsidian CSS
variables, Style Settings plugin.

**Design doc:** `docs/plans/2026-02-15-obsidian-adapter-restart-design.md`

---

### Task 1: Clean up old implementation

Remove all files from the old SCSS-based approach. Keep only what we need.

**Files:**

- Delete: `src/scss/` (entire directory)
- Delete: `build.sh`
- Delete: `package.json`
- Delete: `package-lock.json`
- Delete: `themes/` (entire directory)
- Delete: `templates/theme-tokens.template.css`
- Delete: `templates/theme-tokens.css`
- Delete: `templates/manifest.template.json`
- Delete: `templates/manifest.json`
- Delete: `version-bump.mjs`
- Delete: `versions.json`
- Delete: `docs/theme-creation/` (entire directory)
- Keep: `manifest.json` (root), `CLAUDE.md`, `README.md`, `.gitignore`,
  `.editorconfig`, `.github/`

**Step 1: Delete old files**

```bash
rm -rf src/ themes/ docs/theme-creation/
rm -f build.sh package.json package-lock.json version-bump.mjs versions.json
rm -f templates/theme-tokens.template.css templates/theme-tokens.css
rm -f templates/manifest.template.json templates/manifest.json
```

**Step 2: Clean up .gitignore**

Update `.gitignore` to reflect new structure. Remove npm-specific entries, add
generated file patterns:

```gitignore
# Generated theme files (per-theme outputs from core adapt)
templates/default/*.css
templates/stations/*.css
templates/jpn/*.css
templates/terra/*.css
templates/mnml/*.css

# OS
.DS_Store

# Editors
.vscode
*.iml
.idea
```

**Step 3: Verify clean state**

```bash
ls -la
# Should show: .editorconfig, .git, .github, .gitignore, black-atom-adapter.json,
#              CLAUDE.md, docs/, manifest.json, README.md, templates/, theme.css
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old SCSS-based implementation [DEV-177]"
```

---

### Task 2: Update adapter configuration

Configure `black-atom-adapter.json` for the Default collection with all 4
themes.

**Files:**

- Modify: `black-atom-adapter.json`

**Step 1: Write the new adapter config**

The core template engine derives output paths by:

1. Replacing `.template.` with `.` in the template path
2. Replacing `collection` with the theme key

So template path `templates/default/collection.template.css` generates:

- `templates/default/black-atom-default-dark.css`
- `templates/default/black-atom-default-dark-dimmed.css`
- `templates/default/black-atom-default-light.css`
- `templates/default/black-atom-default-light-dimmed.css`

```json
{
    "$schema": "https://raw.githubusercontent.com/black-atom-industries/core/refs/heads/main/adapter.schema.json",
    "collections": {
        "default": {
            "template": "templates/default/collection.template.css",
            "themes": [
                "black-atom-default-dark",
                "black-atom-default-dark-dimmed",
                "black-atom-default-light",
                "black-atom-default-light-dimmed"
            ]
        }
    }
}
```

**Step 2: Create the template directory**

```bash
mkdir -p templates/default
```

**Step 3: Commit**

```bash
git add black-atom-adapter.json
git commit -m "chore: configure adapter for Default collection [DEV-177]"
```

---

### Task 3: Create the Eta template

This is the core of the adapter. One template file that generates a CSS block
for a single theme variant. The core processes this once per theme.

**Files:**

- Create: `templates/default/collection.template.css`

**Reference docs:**

- Core theme type:
  `/Users/nbr/repos/black-atom-industries/core/src/types/theme.ts`
- Design doc token mapping tables:
  `docs/plans/2026-02-15-obsidian-adapter-restart-design.md`
- Obsidian CSS variables:
  https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors
- Eta template syntax: `<%= theme.xxx %>` for values, `<% %>` for JS logic

**Step 1: Write the template**

The template receives a `theme` object of type `Definition` with: `meta`,
`primaries`, `palette`, `ui`, `syntax`.

Key considerations:

- Use `theme.meta.appearance` to determine `.theme-dark` vs `.theme-light`
  selector
- Use `theme.meta.key` for the variant class name
- Obsidian needs `-rgb` variants for extended colors (format: `R, G, B`)
- Hex-to-RGB conversion needs inline JS in the Eta template since core has no
  helper for this
- Primaries map to `--color-base-*` scale. For dark themes: d10=00, d20=05,
  d30=10, d40=20, m10=25, m20=30, m30=35, m40=40, l10=50, l20=60, l30=70,
  l40=100. For light themes: the order reverses.

```
<%
/* Helper: convert hex to "R, G, B" string for Obsidian's rgba() patterns */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

const isDark = theme.meta.appearance === "dark";
const selector = isDark ? ".theme-dark" : ".theme-light";
%>
/* <%= theme.meta.label %> */
<%= selector %>.<%= theme.meta.key %> {
  /* Foundation: Base Colors */
<% if (isDark) { %>
  --color-base-00: <%= theme.primaries.d10 %>;
  --color-base-05: <%= theme.primaries.d20 %>;
  --color-base-10: <%= theme.primaries.d30 %>;
  --color-base-20: <%= theme.primaries.d40 %>;
  --color-base-25: <%= theme.primaries.m10 %>;
  --color-base-30: <%= theme.primaries.m20 %>;
  --color-base-35: <%= theme.primaries.m30 %>;
  --color-base-40: <%= theme.primaries.m40 %>;
  --color-base-50: <%= theme.primaries.l10 %>;
  --color-base-60: <%= theme.primaries.l20 %>;
  --color-base-70: <%= theme.primaries.l30 %>;
  --color-base-100: <%= theme.primaries.l40 %>;
<% } else { %>
  --color-base-00: <%= theme.primaries.l40 %>;
  --color-base-05: <%= theme.primaries.l30 %>;
  --color-base-10: <%= theme.primaries.l20 %>;
  --color-base-20: <%= theme.primaries.l10 %>;
  --color-base-25: <%= theme.primaries.m40 %>;
  --color-base-30: <%= theme.primaries.m30 %>;
  --color-base-35: <%= theme.primaries.m20 %>;
  --color-base-40: <%= theme.primaries.m10 %>;
  --color-base-50: <%= theme.primaries.d40 %>;
  --color-base-60: <%= theme.primaries.d30 %>;
  --color-base-70: <%= theme.primaries.d20 %>;
  --color-base-100: <%= theme.primaries.d10 %>;
<% } %>

  /* Extended Colors */
  --color-red: <%= theme.palette.red %>;
  --color-red-rgb: <%= hexToRgb(theme.palette.red) %>;
  --color-orange: <%= theme.palette.darkYellow %>;
  --color-orange-rgb: <%= hexToRgb(theme.palette.darkYellow) %>;
  --color-yellow: <%= theme.palette.yellow %>;
  --color-yellow-rgb: <%= hexToRgb(theme.palette.yellow) %>;
  --color-green: <%= theme.palette.green %>;
  --color-green-rgb: <%= hexToRgb(theme.palette.green) %>;
  --color-cyan: <%= theme.palette.cyan %>;
  --color-cyan-rgb: <%= hexToRgb(theme.palette.cyan) %>;
  --color-blue: <%= theme.palette.blue %>;
  --color-blue-rgb: <%= hexToRgb(theme.palette.blue) %>;
  --color-purple: <%= theme.palette.magenta %>;
  --color-purple-rgb: <%= hexToRgb(theme.palette.magenta) %>;
  --color-pink: <%= theme.palette.darkMagenta %>;
  --color-pink-rgb: <%= hexToRgb(theme.palette.darkMagenta) %>;

  /* Backgrounds */
  --background-primary: <%= theme.ui.bg.default %>;
  --background-primary-alt: <%= theme.ui.bg.active %>;
  --background-secondary: <%= theme.ui.bg.panel %>;
  --background-secondary-alt: <%= theme.ui.bg.float %>;
  --background-modifier-hover: <%= theme.ui.bg.hover %>;
  --background-modifier-active-hover: <%= theme.ui.bg.hover %>;
  --background-modifier-border: <%= theme.ui.bg.active %>;
  --background-modifier-border-hover: <%= theme.ui.bg.hover %>;
  --background-modifier-border-focus: <%= theme.ui.fg.accent %>;
  --background-modifier-error-rgb: <%= hexToRgb(theme.ui.bg.negative) %>;
  --background-modifier-error: <%= theme.ui.bg.negative %>;
  --background-modifier-error-hover: <%= theme.ui.bg.negative %>;
  --background-modifier-success-rgb: <%= hexToRgb(theme.ui.bg.positive) %>;
  --background-modifier-success: <%= theme.ui.bg.positive %>;
  --background-modifier-message: <%= theme.ui.bg.info %>;
  --background-modifier-form-field: <%= theme.ui.bg.default %>;

  /* Text */
  --text-normal: <%= theme.ui.fg.default %>;
  --text-muted: <%= theme.ui.fg.subtle %>;
  --text-faint: <%= theme.ui.fg.disabled %>;
  --text-accent: <%= theme.ui.fg.accent %>;
  --text-accent-hover: <%= theme.ui.fg.accent %>;
  --text-on-accent: <%= theme.ui.fg.contrast %>;
  --text-on-accent-inverted: <%= theme.ui.fg.default %>;
  --text-error: <%= theme.ui.fg.negative %>;
  --text-warning: <%= theme.ui.fg.warn %>;
  --text-success: <%= theme.ui.fg.positive %>;
  --text-selection: <%= theme.ui.bg.selection %>;
  --text-highlight-bg: <%= theme.ui.bg.search %>;

  /* Interactive */
  --interactive-normal: <%= theme.ui.bg.default %>;
  --interactive-hover: <%= theme.ui.bg.hover %>;
  --interactive-accent: <%= theme.ui.fg.accent %>;
  --interactive-accent-hover: <%= theme.ui.fg.accent %>;

  /* Headings */
  --h1-color: <%= theme.syntax.markup.heading.h1 %>;
  --h2-color: <%= theme.syntax.markup.heading.h2 %>;
  --h3-color: <%= theme.syntax.markup.heading.h3 %>;
  --h4-color: <%= theme.syntax.markup.heading.h4 %>;
  --h5-color: <%= theme.syntax.markup.heading.h5 %>;
  --h6-color: <%= theme.syntax.markup.heading.h6 %>;

  /* Markup */
  --bold-color: <%= theme.syntax.markup.strong %>;
  --italic-color: <%= theme.syntax.markup.italic %>;
  --blockquote-border-color: <%= theme.syntax.markup.quote %>;
  --link-color: <%= theme.syntax.markup.link %>;
  --link-color-hover: <%= theme.syntax.markup.link %>;
  --link-external-color: <%= theme.syntax.markup.link %>;
  --link-external-color-hover: <%= theme.syntax.markup.link %>;

  /* Code / Syntax Highlighting */
  --code-normal: <%= theme.syntax.variable.default %>;
  --code-comment: <%= theme.syntax.comment.default %>;
  --code-function: <%= theme.syntax.func.default %>;
  --code-important: <%= theme.syntax.keyword.default %>;
  --code-keyword: <%= theme.syntax.keyword.default %>;
  --code-operator: <%= theme.syntax.operator.default %>;
  --code-property: <%= theme.syntax.property.default %>;
  --code-punctuation: <%= theme.syntax.punctuation.default %>;
  --code-string: <%= theme.syntax.string.default %>;
  --code-tag: <%= theme.syntax.tag.default %>;
  --code-value: <%= theme.syntax.constant.default %>;
  --code-background: <%= theme.syntax.markup.code.bg %>;

  /* Tags */
  --tag-color: <%= theme.ui.fg.accent %>;
  --tag-color-hover: <%= theme.ui.fg.accent %>;
  --tag-background: <%= theme.ui.bg.hover %>;
  --tag-background-hover: <%= theme.ui.bg.active %>;

  /* Graph */
  --graph-line: <%= theme.ui.bg.active %>;
  --graph-node: <%= theme.ui.fg.accent %>;
  --graph-node-focused: <%= theme.ui.fg.accent %>;
  --graph-node-tag: <%= theme.palette.cyan %>;
  --graph-node-attachment: <%= theme.palette.green %>;

  /* Scrollbar */
  --scrollbar-bg: <%= theme.ui.bg.default %>;
  --scrollbar-thumb-bg: <%= theme.ui.bg.active %>;
  --scrollbar-active-thumb-bg: <%= theme.ui.fg.subtle %>;

  /* Nav */
  --nav-item-background-hover: <%= theme.ui.bg.hover %>;
  --nav-item-background-active: <%= theme.ui.bg.active %>;
  --nav-item-background-selected: <%= theme.ui.bg.selection %>;
  --nav-item-color: <%= theme.ui.fg.default %>;
  --nav-item-color-hover: <%= theme.ui.fg.default %>;
  --nav-item-color-active: <%= theme.ui.fg.accent %>;
  --nav-item-color-selected: <%= theme.ui.fg.default %>;
}
```

**Step 2: Commit**

```bash
git add templates/default/collection.template.css
git commit -m "feat: add Eta template for Default collection [DEV-177]"
```

---

### Task 4: Create the Style Settings header

A static CSS file containing the Style Settings plugin configuration comment.
This is concatenated at the top of `theme.css` during build.

**Files:**

- Create: `templates/style-settings.css`

**Step 1: Write the Style Settings header**

```css
/* @settings
name: Black Atom
id: black-atom
settings:
  -
    id: theme-variant
    title: Theme Variant
    description: Choose your Black Atom theme variant
    type: class-select
    allowEmpty: false
    default: black-atom-default-dark
    options:
      -
        label: "Default: Dark"
        value: black-atom-default-dark
      -
        label: "Default: Dark Dimmed"
        value: black-atom-default-dark-dimmed
      -
        label: "Default: Light"
        value: black-atom-default-light
      -
        label: "Default: Light Dimmed"
        value: black-atom-default-light-dimmed
*/
```

**Step 2: Commit**

```bash
git add templates/style-settings.css
git commit -m "feat: add Style Settings configuration header [DEV-177]"
```

---

### Task 5: Create the build script

A simple shell script that:

1. Runs `black-atom-core adapt` to generate per-theme CSS files
2. Concatenates the Style Settings header + generated files into `theme.css`

**Files:**

- Create: `build.sh`

**Step 1: Write the build script**

```bash
#!/bin/bash
set -euo pipefail

echo "Building Black Atom Obsidian theme..."

# Step 1: Generate per-theme CSS files from templates
echo "Generating theme tokens..."
black-atom-core adapt

# Step 2: Assemble theme.css
echo "Assembling theme.css..."
cat templates/style-settings.css > theme.css
echo "" >> theme.css

# Concatenate all generated theme CSS files
for dir in templates/*/; do
  for file in "$dir"*.css; do
    # Skip template files and the style-settings header
    [[ "$file" == *.template.css ]] && continue
    [[ "$file" == templates/style-settings.css ]] && continue
    [ -f "$file" ] || continue
    echo "" >> theme.css
    cat "$file" >> theme.css
  done
done

echo "Build complete: theme.css"
```

**Step 2: Make it executable**

```bash
chmod +x build.sh
```

**Step 3: Commit**

```bash
git add build.sh
git commit -m "feat: add build script for theme assembly [DEV-177]"
```

---

### Task 6: Run the build and validate

Generate the theme and verify it works.

**Step 1: Run the build**

```bash
./build.sh
```

Expected: `theme.css` is generated with Style Settings header + 4 theme variant
blocks.

**Step 2: Inspect the output**

```bash
head -30 theme.css
```

Expected: Style Settings comment block at the top.

```bash
grep "^\.theme-" theme.css
```

Expected: 4 selectors:

- `.theme-dark.black-atom-default-dark {`
- `.theme-dark.black-atom-default-dark-dimmed {`
- `.theme-light.black-atom-default-light {`
- `.theme-light.black-atom-default-light-dimmed {`

```bash
grep "undefined" theme.css
```

Expected: No matches. If there are matches, a template variable is wrong.

**Step 3: Validate no missing variables**

```bash
grep -c "^  --" theme.css
```

Expected: Roughly 4 × ~80 = ~320 variable declarations total across all 4 theme
blocks.

**Step 4: Commit the generated output**

```bash
git add theme.css
git commit -m "feat: generate theme.css for Default collection [DEV-177]"
```

---

### Task 7: Test in Obsidian

Manual testing in Obsidian to verify colors render correctly.

**Step 1: Set up symlinks**

Find the user's Obsidian vault path and create symlinks:

```bash
# Adjust vault path as needed
VAULT_THEMES="$HOME/obsidian-vault/.obsidian/themes"
mkdir -p "$VAULT_THEMES/Black-Atom"
ln -sf "$(pwd)/theme.css" "$VAULT_THEMES/Black-Atom/theme.css"
ln -sf "$(pwd)/manifest.json" "$VAULT_THEMES/Black-Atom/manifest.json"
```

**Step 2: Verify in Obsidian**

1. Open Obsidian → Settings → Appearance → Select "Black Atom" theme
2. Install Style Settings plugin if not installed
3. Settings → Style Settings → Black Atom → Theme Variant
4. Switch between all 4 variants and verify:
   - Dark: dark background, light text
   - Dark Dimmed: slightly lighter dark background
   - Light: light background, dark text
   - Light Dimmed: slightly darker light background
5. Check heading colors (h1-h6 should have different colors)
6. Check code blocks (syntax highlighting colors)
7. Check links, bold, italic text

**Step 3: Note any issues for follow-up**

If colors look wrong, the template mappings may need adjustment. This is
iterative.

---

### Task 8: Update project documentation

Update CLAUDE.md and README.md to reflect the new architecture.

**Files:**

- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Update CLAUDE.md**

Replace content to reflect the pure CSS template approach, removing all SCSS
references. Key sections to update:

- Repository Structure (remove `src/scss/`, update `templates/`)
- Build Process (just `./build.sh` which runs core adapt + concatenation)
- Development Workflow (symlink + build + reload)
- Remove SCSS-related sections

**Step 2: Update README.md**

Simplify to reflect the new minimal approach:

- Installation instructions
- How to switch variants (Style Settings)
- Development setup (symlinks, build command)
- Available themes (Default collection: 4 variants)

**Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update project docs for new adapter architecture [DEV-177]"
```

---

### Task 9: Update .gitignore and clean up

Ensure generated per-theme CSS files are gitignored (they're build artifacts)
but `theme.css` is tracked (it's the distributable).

**Files:**

- Modify: `.gitignore`

**Step 1: Update .gitignore**

```gitignore
# Generated per-theme CSS files (build artifacts from core adapt)
templates/default/*.css
templates/stations/*.css
templates/jpn/*.css
templates/terra/*.css
templates/mnml/*.css

# Keep theme.css tracked (it's the distributable output)
# Keep templates/*.template.css tracked (source templates)
# Keep templates/style-settings.css tracked (static header)

# OS
.DS_Store

# Editors
.vscode
*.iml
.idea
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for new build artifacts [DEV-177]"
```
