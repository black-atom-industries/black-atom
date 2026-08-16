# Contributing to Black Atom for Neovim

Thank you for considering contributing to Black Atom!

## Table of Contents

1. [Getting Started](#getting-started)
2. [How Can I Contribute?](#how-can-i-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Enhancements](#suggesting-enhancements)
3. [Style Guidelines](#style-guidelines)
   - [Git Commit Messages](#git-commit-messages)
   - [Lua Styleguide](#lua-styleguide)
     - [Luacheck](#luacheck)
     - [StyLua](#stylua)
   - [CI Checks](#ci-checks)
   - [Editor Configuration](#editor-configuration)
4. [Adding Plugin Highlights](#adding-plugin-highlights)

## Getting Started

1. Create a branch for your contribution.
2. Make your changes under `adapters/nvim/`.
3. Run `mise run check` before opening a pull request.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Black Atom Industries. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Black Atom Industries, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Provide specific examples to demonstrate the steps or point out the part of Black Atom Industries where the suggestion is related to.

## Style Guidelines

### Git Commit Messages

Commit messages follow the root [`CLAUDE.md`](../../CLAUDE.md) convention:
`<type>(<scope>): <description> <issue-reference>`. Use `nvim` as the scope for changes scoped
to this adapter.

### Lua Styleguide

We use Luacheck and StyLua to enforce consistent code style across the project. Our CI pipeline automatically runs these checks on every pull request.

- Use 4 spaces for indentation
- Use snake_case for variable and function names
- Use PascalCase for module names
- Follow the existing code style in the project

#### Luacheck

We use Luacheck to catch common Lua errors and enforce coding standards. Our `.luacheckrc` file defines the specific rules we follow.

#### StyLua

StyLua is used to automatically format our Lua code. It ensures consistent formatting throughout the project.

To run StyLua locally:

```bash
stylua --check .
```

To automatically fix styling issues:

```bash
stylua .
```

### CI Checks

Our GitHub Actions workflow runs the following checks on every pull request:

1. **Luacheck**: Checks for Lua syntax errors and style violations.
2. **StyLua**: Ensures consistent code formatting.
3. **PR Metadata**: Verifies that commit messages and PR titles follow our conventional commit format.

Make sure your contributions pass all these checks before submitting a pull request. You can run these checks locally to catch issues early in your development process.

### Editor Configuration

This adapter provides a `.luarc.json` file with some basic configurations:

```json
{
    "diagnostics.globals": [
        "vim"
    ]
}
```

This configuration helps suppress false positives related to the `vim` global in Neovim Lua development.

Please ensure your editor respects these configurations to maintain consistency across the project.

## Adding Plugin Highlights

To add highlights for a new plugin:

1. Create a new file in `lua/black-atom/highlights/plugins/` named after your plugin (e.g., `my_plugin.lua`).
2. Use the template provided in `__plugin_highlight_template.lua` as a starting point.
3. Implement your highlight groups within the `map` function.
4. Ensure you follow the naming convention: replace dots with underscores in the filename (e.g., `telescope.nvim` becomes `telescope_nvim.lua`).
5. Run `./update_supported_plugins.sh` from the root of the project to update the README with your new plugin.

The structure of your highlight groups should be as follows:

```lua
---@type BlackAtom.Highlights
return {
    HighlightGroup1 = { ... },
    HighlightGroup2 = { ... },
    ...
}
```

This structure is crucial for the automatic highlight group counting to work correctly.

Thank you for your contribution to Black Atom Industries!
