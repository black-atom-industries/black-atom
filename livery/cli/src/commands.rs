use livery_core::config::types::{AppName, Config};
use livery_core::themes::registry::{config_folder_marker, ThemeProvisioning};
use livery_core::themes::{catalog, commands as themes, detect, unpack};
use livery_core::updaters::{self, ThemeContext, UpdateResult, UpdateStatus};

/// Every core entry point the CLI reaches for is `async` while awaiting
/// nothing, so a current-thread runtime is sufficient at every call site.
fn block_on<F: std::future::Future>(future: F) -> F::Output {
    tokio::runtime::Builder::new_current_thread()
        .build()
        .expect("failed to start the tokio runtime")
        .block_on(future)
}

/// The theme `setup` applies when it is not asked interactively.
const DEFAULT_THEME_KEY: &str = "black-atom-default-dark";

/// Themes are read from the binary, but a first run still owes the disk its
/// unpacked tree — Linked apps read the files, not the embedded payload.
fn unpacked() -> Result<(), String> {
    unpack::ensure_unpacked().map(|_| ())
}

pub fn list() -> Result<(), String> {
    unpacked()?;

    let mut current_collection = String::new();
    for theme in catalog::themes() {
        if theme.collection_key != current_collection {
            if !current_collection.is_empty() {
                println!();
            }
            println!("{}", theme.collection_key.to_uppercase());
            current_collection = theme.collection_key.clone();
        }
        println!("  {}  ({})", theme.key, theme.appearance);
    }
    Ok(())
}

pub fn apply(theme_key: &str) -> Result<(), String> {
    let theme = catalog::find(theme_key)
        .ok_or_else(|| format!("unknown theme '{theme_key}' — run `livery list`"))?;

    unpacked()?;

    let config = livery_core::config::commands::get_config();
    let enabled = enabled_apps(&config);
    if enabled.is_empty() && !config.system_appearance {
        println!("No apps are enabled — run `livery setup`.");
        return Ok(());
    }

    println!("{}", theme.label);

    enum CompletedUpdate {
        App(AppName, livery_core::updaters::UpdateResult),
        Appearance(livery_core::updaters::UpdateResult),
    }

    let mut failed = 0;
    let mut notes = Notes::default();
    let mut applied = 0;
    std::thread::scope(|scope| {
        let (sender, receiver) = std::sync::mpsc::channel();

        for app in enabled.iter().copied() {
            let sender = sender.clone();
            let context = ThemeContext {
                theme_key: theme.key.clone(),
                appearance: theme.appearance.clone(),
                collection_key: theme.collection_key.clone(),
                theme_label: Some(theme.label.clone()),
            };
            scope.spawn(move || {
                let result = block_on(updaters::update_app(app, context));
                sender
                    .send(CompletedUpdate::App(app, result))
                    .expect("apply receiver dropped");
            });
        }

        if config.system_appearance {
            let sender = sender.clone();
            let appearance = theme.appearance.clone();
            scope.spawn(move || {
                let result = updaters::update_system_appearance(appearance);
                sender
                    .send(CompletedUpdate::Appearance(result))
                    .expect("apply receiver dropped");
            });
        }
        drop(sender);

        for completed in receiver {
            let (label, result) = match completed {
                CompletedUpdate::App(app, result) => (app.as_str(), result),
                CompletedUpdate::Appearance(result) => ("appearance", result),
            };
            if result.status == UpdateStatus::Error {
                failed += 1;
            }
            if theme_was_applied(&result) {
                applied += 1;
            }
            println!("  {label:<11} {}", update_label(&result));
            notes.add_update(label, &result);
        }
    });

    notes.print();

    // One updater landing is enough to change what the user is looking at,
    // so the record follows the machine rather than the exit code. A run that
    // only skipped or errored without patching a config leaves the record standing.
    let persistence_error = if applied > 0 {
        livery_core::config::commands::set_active_theme(&theme.key)
            .err()
            .map(|message| format!("could not record the active theme — {message}"))
    } else {
        None
    };

    match persistence_error {
        Some(message) if failed > 0 => Err(format!("{failed} update(s) failed; {message}")),
        Some(message) => Err(message),
        None if failed > 0 => Err(format!("{failed} update(s) failed")),
        None => Ok(()),
    }
}

pub fn reapply() -> Result<(), String> {
    let config = livery_core::config::commands::get_config();
    let Some(theme_key) = config.active_theme else {
        println!("No active theme recorded — skipping reapply.");
        return Ok(());
    };
    apply(&theme_key)
}

pub fn status() -> Result<(), String> {
    unpacked()?;

    let config = livery_core::config::commands::get_config();
    let statuses = block_on(themes::get_app_status())?;

    println!("theme      {}", active_theme_label());
    println!();

    for app_status in statuses {
        let app = app_status.app;
        let app_config = config.apps.get(&app);
        let enabled = app_config.is_some_and(|c| c.enabled);
        let verification = block_on(updaters::verify_app_path(app));

        println!(
            "{:<11} {:<9} {:<8} linked={:<5} config={}",
            app.as_str(),
            if enabled { "enabled" } else { "disabled" },
            provisioning_label(app_status.provisioning),
            app_status.linked,
            config_label(&verification),
        );
    }
    Ok(())
}

pub fn setup(yes: bool, theme: Option<&str>) -> Result<(), String> {
    unpacked()?;
    if let Some(key) = theme {
        catalog::find(key).ok_or_else(|| format!("unknown theme '{key}' — run `livery list`"))?;
    }

    let mut detections = block_on(detect::detect_apps());
    let found_count = detections
        .iter()
        .filter(|detection| detection.found)
        .count();
    if found_count > 0 {
        println!("Found {found_count} app(s):");
        for detection in detections.iter().filter(|detection| detection.found) {
            let path = match &detection.config_folders {
                Some(folders) => folders.join(", "),
                None => detection.config_path.clone(),
            };
            println!("  {:<11} {}", detection.app.as_str(), path);
        }
    }
    if !yes {
        complete_config_folders(&mut detections)?;
    }
    let found: Vec<AppName> = detections
        .iter()
        .filter(|detection| detection.found)
        .map(|detection| detection.app)
        .collect();

    if found.is_empty() {
        println!("No app config files were found.");
        return Ok(());
    }

    if !confirm("Enable these apps?", yes)? {
        println!("Nothing changed.");
        return Ok(());
    }

    // Setup only ever enables — an app the user turned on by hand but whose
    // config file moved must not be switched off behind their back.
    let mut config = livery_core::config::commands::get_config();
    for app in &found {
        if let Some(app_config) = config.apps.get_mut(app) {
            app_config.enabled = true;
            if config_folder_marker(*app).is_some() {
                let discovered = detections
                    .iter()
                    .find(|detection| detection.app == *app)
                    .and_then(|detection| detection.config_folders.as_ref())
                    .into_iter()
                    .flatten();
                let folders = app_config.config_folders.get_or_insert_with(Vec::new);
                for folder in discovered {
                    if !folders.contains(folder) {
                        folders.push(folder.clone());
                    }
                }
            }
        }
    }
    livery_core::config::commands::save_config(config)?;
    println!("Enabled {} app(s).", found.len());

    let linked: Vec<AppName> = found
        .iter()
        .copied()
        .filter(|app| {
            livery_core::themes::registry::provisioning(*app) == ThemeProvisioning::Linked
        })
        .collect();

    // Every row is printed before the first failure decides the exit code,
    // so the user sees the whole run and the shell still sees the failure.
    let mut failures: Vec<String> = Vec::new();
    let link_themes = !linked.is_empty() && confirm("Link their theme files?", yes)?;

    if link_themes {
        let mut notes = Notes::default();
        for app in &linked {
            let result = block_on(themes::link_app_themes(*app));
            print_link_result(&result, &mut notes);
            if result.status == UpdateStatus::Error {
                failures.push(format!("{} link failed", app.as_str()));
            }
        }
        notes.print();
    }

    if confirm("Verify their config paths?", yes)? {
        let mut notes = Notes::default();
        for app in &found {
            let verification = block_on(updaters::verify_app_path(*app));
            let label = match &verification.message {
                Some(message) => {
                    notes.add(app.as_str(), message.clone());
                    "error".to_string()
                }
                None => config_label(&verification),
            };
            println!("  {:<11} {label}", app.as_str());
            print_verification_folders(&verification);
            if let Some(message) = &verification.message {
                failures.push(format!("{} verification failed: {message}", app.as_str()));
            }
        }
        notes.print();
    }

    if !failures.is_empty() {
        return Err(failures.join("; "));
    }

    if !linked.is_empty() && !link_themes {
        println!();
        println!("Skipped applying a theme because linked theme files were not installed.");
        return Ok(());
    }

    // Enabling and linking leaves the tools configured but still wearing
    // whatever they wore before, so setup finishes by actually putting a
    // theme on the machine. That also makes the Active Theme record a
    // reading of something livery did, rather than an assumption.
    println!();
    apply(&choose_setup_theme(yes, theme)?)
}

/// Ask whether each app's discovered config folders are complete, and take the missing ones by
/// hand. A folder counts once it holds the app's marker file.
fn complete_config_folders(detections: &mut [detect::AppDetection]) -> Result<(), String> {
    use std::io::IsTerminal;

    if !std::io::stdin().is_terminal() {
        return Ok(());
    }
    for detection in detections.iter_mut() {
        let Some(marker) = config_folder_marker(detection.app) else {
            continue;
        };
        let app = detection.app.as_str();
        let discovered = detection.config_folders.as_deref().unwrap_or_default();
        let complete = if discovered.is_empty() {
            !ask(&format!("No {app} config folders found. Add one?"), false)?
        } else {
            ask(&format!("Are these all the {app} config folders?"), true)?
        };
        if complete {
            continue;
        }
        loop {
            let folder = match inquire::Text::new(&format!("{app} config folder"))
                .with_help_message(&format!(
                    "A directory that holds {marker}. Leave empty to finish."
                ))
                .prompt()
            {
                Ok(folder) => folder.trim().to_string(),
                Err(
                    inquire::InquireError::OperationCanceled
                    | inquire::InquireError::OperationInterrupted,
                ) => break,
                Err(e) => return Err(format!("no config folder read: {e}")),
            };
            if folder.is_empty() {
                break;
            }
            let expanded = shellexpand::tilde(folder.trim_end_matches('/')).to_string();
            if !std::path::Path::new(&expanded).is_absolute() {
                println!("  {folder} is not an absolute or ~/ path; not added.");
                continue;
            }
            if !std::path::Path::new(&expanded).join(marker).is_file() {
                println!("  {folder} has no {marker}; not added.");
                continue;
            }
            let folders = detection.config_folders.get_or_insert_with(Vec::new);
            let known = folders
                .iter()
                .any(|known| shellexpand::tilde(known.trim_end_matches('/')) == expanded);
            if !known {
                println!("  added {}", home_relative(&expanded));
                folders.push(expanded);
            }
            detection.found = true;
        }
    }
    Ok(())
}

fn ask(message: &str, default: bool) -> Result<bool, String> {
    match inquire::Confirm::new(message)
        .with_default(default)
        .prompt()
    {
        Ok(answer) => Ok(answer),
        Err(
            inquire::InquireError::OperationCanceled | inquire::InquireError::OperationInterrupted,
        ) => Ok(default),
        Err(e) => Err(format!("prompt cancelled: {e}")),
    }
}

/// The theme setup applies as its last step: `--theme` when given. `--yes`
/// has to stay non-interactive, so it keeps the Active Theme, or takes the
/// default when none is recorded, rather than opening the picker.
fn choose_setup_theme(yes: bool, theme: Option<&str>) -> Result<String, String> {
    if let Some(key) = theme {
        return Ok(key.to_string());
    }
    if yes {
        let active = livery_core::config::commands::get_config()
            .active_theme
            .filter(|key| catalog::find(key).is_some());
        return Ok(active.unwrap_or_else(|| DEFAULT_THEME_KEY.to_string()));
    }
    pick_theme("Pick a theme to apply")
}

pub fn appearance(mode: &str) -> Result<(), String> {
    let result = updaters::update_system_appearance(mode.to_string());
    report("appearance", &result)
}

/// The settings live in the config; the subcommand only pushes them into
/// nvim's managed block, so an untouched config writes the defaults.
pub fn nvim_settings() -> Result<(), String> {
    let settings = livery_core::config::commands::get_config()
        .apps
        .get(&AppName::Nvim)
        .and_then(|app_config| app_config.settings.clone())
        .unwrap_or_default();

    let result = block_on(updaters::write_nvim_settings(settings));
    report("nvim", &result)
}

fn report(label: &str, result: &updaters::UpdateResult) -> Result<(), String> {
    let detail = result
        .message
        .as_ref()
        .map(|message| format!(" — {message}"))
        .unwrap_or_default();

    if result.status == UpdateStatus::Error {
        return Err(format!("{label} {}{detail}", result.status.as_str()));
    }
    println!("{label:<11} {}{detail}", result.status.as_str());
    Ok(())
}

pub fn kagi(theme: Option<&str>, font: Option<&str>) -> Result<(), String> {
    let name = match theme {
        Some(theme) => theme.to_string(),
        None => pick_kagi()?,
    };
    let css = livery_core::themes::kagi::css(&name)?;
    let font = match font {
        Some(font) => font.to_string(),
        None => ask_font()?,
    };
    let font = font.trim().replace('"', "");
    copy_to_clipboard(&livery_core::themes::kagi::with_font(css, &font))?;
    let name = livery_core::themes::kagi::name_for(&name);
    if font.is_empty() {
        println!("Copied {name} — paste it into https://kagi.com/settings/custom_css");
    } else {
        println!(
            "Copied {name} with {font} first — paste it into https://kagi.com/settings/custom_css"
        );
    }
    Ok(())
}

fn ask_font() -> Result<String, String> {
    use std::io::IsTerminal;

    if !std::io::stdin().is_terminal() {
        return Ok(String::new());
    }
    match inquire::Text::new("Preferred font")
        .with_help_message(
            "Installed font family to put first in both font stacks. Leave empty to keep the theme's fonts.",
        )
        .prompt()
    {
        Ok(font) => Ok(font),
        Err(
            inquire::InquireError::OperationCanceled | inquire::InquireError::OperationInterrupted,
        ) => Ok(String::new()),
        Err(e) => Err(format!("no font read: {e}")),
    }
}

/// The cursor opens on the file holding the Active Theme.
fn pick_kagi() -> Result<String, String> {
    let names = livery_core::themes::kagi::names();
    let starting_cursor = livery_core::config::commands::get_active_theme()
        .and_then(|key| {
            let name = livery_core::themes::kagi::name_for(&key);
            names.iter().position(|candidate| *candidate == name)
        })
        .unwrap_or(0);

    let choice = inquire::Select::new("Kagi theme", names)
        .with_page_size(15)
        .with_starting_cursor(starting_cursor)
        .prompt()
        .map_err(|e| format!("no theme picked: {e}"))?;

    Ok(choice.to_string())
}

fn copy_to_clipboard(text: &str) -> Result<(), String> {
    use std::io::Write;
    use std::process::{Command, Stdio};

    let tools: &[(&str, &[&str])] = if cfg!(target_os = "macos") {
        &[("pbcopy", &[])]
    } else {
        &[("wl-copy", &[]), ("xclip", &["-selection", "clipboard"])]
    };

    for (program, args) in tools {
        let Ok(mut child) = Command::new(program)
            .args(*args)
            .stdin(Stdio::piped())
            .spawn()
        else {
            continue;
        };
        child
            .stdin
            .take()
            .ok_or_else(|| format!("{program} has no stdin"))?
            .write_all(text.as_bytes())
            .map_err(|e| format!("could not write to {program}: {e}"))?;
        let status = child
            .wait()
            .map_err(|e| format!("{program} did not finish: {e}"))?;
        return if status.success() {
            Ok(())
        } else {
            Err(format!("{program} exited with {status}"))
        };
    }

    let tried: Vec<&str> = tools.iter().map(|(program, _)| *program).collect();
    Err(format!(
        "no clipboard tool found, tried {}",
        tried.join(", ")
    ))
}

pub fn pick_and_apply() -> Result<(), String> {
    unpacked()?;
    apply(&pick_theme("Theme")?)
}

/// Open the theme picker and return the chosen key. The cursor opens on the
/// Active Theme, falling back to the default when nothing is recorded yet, so
/// a first run lands on the theme setup would otherwise have applied.
fn pick_theme(prompt: &str) -> Result<String, String> {
    let themes = catalog::themes();
    let active = livery_core::config::commands::get_active_theme();
    let width = themes
        .iter()
        .map(|theme| theme.key.len())
        .max()
        .unwrap_or(0);

    let options: Vec<String> = themes
        .iter()
        .map(|theme| {
            let marker = if Some(&theme.key) == active.as_ref() {
                "  ■"
            } else {
                ""
            };
            format!(
                "{:<width$}  [{}]{marker}",
                theme.key,
                theme.appearance,
                width = width
            )
        })
        .collect();

    // A key that no longer names a theme leaves the cursor at the top.
    let cursor_key = active.unwrap_or_else(|| DEFAULT_THEME_KEY.to_string());
    let starting_cursor = themes
        .iter()
        .position(|theme| theme.key == cursor_key)
        .unwrap_or(0);

    let choice = inquire::Select::new(prompt, options)
        .with_page_size(15)
        .with_starting_cursor(starting_cursor)
        .raw_prompt()
        .map_err(|e| format!("no theme picked: {e}"))?;

    Ok(themes[choice.index].key.clone())
}

/// The Active Theme as `status` prints it. A record whose key no longer
/// resolves is shown rather than swallowed — a stale key is worth seeing.
fn active_theme_label() -> String {
    let Some(key) = livery_core::config::commands::get_active_theme() else {
        return "none (run `livery setup`)".to_string();
    };
    match catalog::find(&key) {
        Some(theme) => format!("{key}  ({})", theme.appearance),
        None => format!("{key}  (unknown theme)"),
    }
}

fn theme_was_applied(result: &UpdateResult) -> bool {
    result.status == UpdateStatus::Done
        || (result.status == UpdateStatus::Skipped
            && result
                .message
                .as_deref()
                .is_some_and(|message| message.starts_with("Config patched;")))
}

fn enabled_apps(config: &Config) -> Vec<AppName> {
    AppName::all()
        .iter()
        .copied()
        .filter(|app| config.apps.get(app).is_some_and(|c| c.enabled))
        .collect()
}

fn confirm(message: &str, yes: bool) -> Result<bool, String> {
    if yes {
        return Ok(true);
    }
    inquire::Confirm::new(message)
        .with_default(true)
        .prompt()
        .map_err(|e| format!("prompt cancelled: {e}"))
}

fn provisioning_label(provisioning: ThemeProvisioning) -> &'static str {
    match provisioning {
        ThemeProvisioning::External => "external",
        ThemeProvisioning::Linked => "linked",
        ThemeProvisioning::Merged => "merged",
    }
}

fn print_link_result(result: &themes::LinkThemesResult, notes: &mut Notes) {
    println!("  {:<11} {}", result.app, result.status.as_str());
    if let Some(message) = &result.message {
        notes.add(&result.app, message.clone());
    }
    for folder in result.config_folders.iter().flatten() {
        let pruned = if folder.pruned > 0 {
            format!(", {} pruned", folder.pruned)
        } else {
            String::new()
        };
        println!(
            "    {:<40} {} linked{pruned}",
            home_relative(&folder.config_folder),
            folder.linked
        );
        if let Some(message) = &folder.message {
            notes.add(
                &result.app,
                format!("{}: {message}", home_relative(&folder.config_folder)),
            );
        }
    }
}

fn print_verification_folders(verification: &updaters::AppPathVerification) {
    for folder in verification.config_folders.iter().flatten() {
        let config_folder = home_relative(&folder.config_folder);
        if folder.exists {
            println!("    {config_folder}");
        } else {
            let marker = std::path::Path::new(&folder.path)
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_default();
            println!("    {config_folder:<40} missing {marker}");
        }
    }
}

/// The row status of an apply. A theme that landed with caveats says so; the caveats themselves
/// go to the notes.
fn update_label(result: &UpdateResult) -> &'static str {
    let reload_skipped = result
        .config_folders
        .iter()
        .flatten()
        .any(|folder| folder.reload_warning.is_some());
    match &result.status {
        UpdateStatus::Done if reload_skipped => "reload skipped",
        UpdateStatus::Skipped if theme_was_applied(result) => "partial",
        status => status.as_str(),
    }
}

/// Details printed under a checklist, grouped by adapter in first-seen order, without repeats.
#[derive(Default)]
struct Notes(Vec<(String, Vec<String>)>);

impl Notes {
    fn add(&mut self, app: &str, note: String) {
        let index = match self.0.iter().position(|(name, _)| name == app) {
            Some(index) => index,
            None => {
                self.0.push((app.to_string(), Vec::new()));
                self.0.len() - 1
            }
        };
        let notes = &mut self.0[index].1;
        if !notes.contains(&note) {
            notes.push(note);
        }
    }

    /// Per-folder details replace the summary message they were folded into.
    fn add_update(&mut self, app: &str, result: &UpdateResult) {
        let mut folder_notes = false;
        for folder in result.config_folders.iter().flatten() {
            if let Some(message) = &folder.message {
                self.add(
                    app,
                    format!("{}: {message}", home_relative(&folder.config_folder)),
                );
                folder_notes = true;
            }
            if let Some(warning) = &folder.reload_warning {
                self.add(app, warning.clone());
                folder_notes = true;
            }
        }
        if folder_notes {
            return;
        }
        if let Some(message) = &result.message {
            let message = message.strip_prefix("Config patched; ").unwrap_or(message);
            self.add(app, message.to_string());
        }
    }

    fn print(&self) {
        if self.0.is_empty() {
            return;
        }
        println!();
        println!("Notes");
        for (app, notes) in &self.0 {
            println!("  {app}");
            for note in notes {
                println!("    - {note}");
            }
        }
    }
}

/// A path under the home directory, shown as `~/…`.
fn home_relative(path: &str) -> String {
    match std::env::var("HOME") {
        Ok(home) if !home.trim_end_matches('/').is_empty() => {
            match path.strip_prefix(home.trim_end_matches('/')) {
                Some(rest) if rest.is_empty() || rest.starts_with('/') => format!("~{rest}"),
                _ => path.to_string(),
            }
        }
        _ => path.to_string(),
    }
}

fn config_label(verification: &updaters::AppPathVerification) -> String {
    if let Some(message) = &verification.message {
        return format!("error ({message})");
    }
    if !verification.exists {
        return "missing".to_string();
    }
    match verification.pattern_matches {
        Some(true) => "ok".to_string(),
        Some(false) => "no-match".to_string(),
        None => "ok".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn theme_was_applied_counts_patched_reload_skips_but_not_noop_skips() {
        assert!(theme_was_applied(&UpdateResult::done("ghostty")));
        assert!(theme_was_applied(&UpdateResult::skipped(
            "ghostty",
            "Config patched; live reload failed"
        )));
        assert!(!theme_was_applied(&UpdateResult::skipped(
            "ghostty",
            "App is disabled"
        )));
    }
}
