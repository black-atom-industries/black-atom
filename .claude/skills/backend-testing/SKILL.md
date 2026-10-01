---
name: backend-testing
description: Fixture-based testing patterns for Rust file operations (file_ops)
user-invocable: false
---

# Backend Testing

## Running Tests

```bash
cargo test -p livery_core
```

Runs `livery_core`, which has no Tauri dependency. `deno task test:rust` runs the whole workspace;
it builds the UI first because `livery/src-tauri` compiles against `livery/dist`.

## Fixture-Based Testing

File operations under `livery/core/src/updaters/file_ops/` and the updaters built on them use
**real config file fixtures** instead of inline test strings. This catches formatting and
indentation issues that simplified strings miss.

### Fixture Directory

`livery/core/tests/fixtures/` groups fixtures by format: `text/`, `yaml/`, `jsonc/`, plus
`themes/` for theme files an updater reads. Each case is an input `<app>-<case>.<ext>` beside its
`<app>-<case>-expected.<ext>`. List the directory for the current set before adding a pair.

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

`CARGO_MANIFEST_DIR` resolves to `livery/core`, so fixture paths stay relative to the crate.

### Adding Fixtures for New Updaters

1. Create fixture files with **realistic content** from the actual tool's config format
2. Include comments, blank lines, and edge cases that exist in real configs
3. Create both input and expected-output fixtures
4. Write tests that compare full output against the expected fixture
5. Add an **idempotency test** — apply the operation twice, assert the result is identical
