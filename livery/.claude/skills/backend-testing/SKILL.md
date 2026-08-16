---
name: backend-testing
description: Fixture-based testing patterns for Rust file operations (file_ops)
user-invocable: false
---

# Backend Testing

## Running Tests

```bash
cd src-tauri && cargo test
```

## Fixture-Based Testing

File operations (`file_ops/text.rs`, `file_ops/yaml.rs`) use **real config file fixtures** instead
of inline test strings. This catches formatting and indentation issues that simplified strings miss.

### Fixture Directory

```
src-tauri/tests/fixtures/
  text/                              # Text-based configs (ghostty, nvim, tmux, delta)
    ghostty-config.txt               # Input config
    ghostty-config-expected.txt      # Expected output after patch
    nvim-config.lua
    nvim-config-expected.lua
    nvim-config-vimcmd.lua           # Alternative vim.cmd.colorscheme() syntax
    nvim-config-vimcmd-expected.lua
    tmux.conf
    tmux-expected.conf
    delta-config.ini
    delta-config-expected.ini
  yaml/                              # YAML configs (lazygit)
    lazygit-config.yml               # Realistic lazygit config (target)
    lazygit-theme-source.yml         # Black Atom theme file (source/overlay)
    lazygit-config-expected.yml      # Expected output after merge
    simple-config.yml
    simple-overlay.yml
    simple-config-expected.yml
```

### Test Pattern

1. Copy fixture to a temp file under `$HOME` (required by home-directory security check)
2. Run the patch function (`patch_text_file` or `patch_yaml_file`)
3. Compare result to expected fixture via `assert_eq!`

```rust
fn fixture_path(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}

fn copy_fixture_to_temp(fixture_name: &str) -> tempfile::NamedTempFile {
    let content = std::fs::read_to_string(fixture_path(fixture_name)).unwrap();
    let home = dirs::home_dir().expect("Cannot determine home directory");
    let mut file = tempfile::NamedTempFile::new_in(home).unwrap();
    file.write_all(content.as_bytes()).unwrap();
    file
}
```

### Adding Fixtures for New Updaters

1. Create fixture files with **realistic content** from the actual tool's config format
2. Include comments, blank lines, and edge cases that exist in real configs
3. Create both input and expected-output fixtures
4. Write tests that compare full output against the expected fixture
5. Add an **idempotency test** — apply the operation twice, assert the result is identical
