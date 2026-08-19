use livery_core::config::types::{AppName, Config};
use livery_core::themes::registry::ThemeProvisioning;
use livery_core::themes::{catalog, commands as themes, detect, unpack};
use livery_core::updaters::{self, ThemeContext, UpdateStatus};

/// Every core entry point the CLI reaches for is `async` while awaiting
/// nothing, so a current-thread runtime carries the whole process.
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

    let mut failed = 0;
    let mut applied = 0;
    for app in enabled {
        let result = block_on(updaters::update_app(
            app,
            ThemeContext {
                theme_key: theme.key.clone(),
                appearance: theme.appearance.clone(),
                collection_key: theme.collection_key.clone(),
                theme_label: Some(theme.label.clone()),
            },
        ));
        if result.status == UpdateStatus::Error {
            failed += 1;
        } else if result.status == UpdateStatus::Done {
            applied += 1;
        }
        println!(
            "  {:<10} {}{}",
            app.as_str(),
            result.status.as_str(),
            result
                .message
                .map(|message| format!(" — {message}"))
                .unwrap_or_default()
        );
    }

    if config.system_appearance {
        let result = updaters::update_system_appearance(theme.appearance.clone());
        if result.status == UpdateStatus::Error {
            failed += 1;
        } else if result.status == UpdateStatus::Done {
            applied += 1;
        }
        println!(
            "  {:<10} {}{}",
            "appearance",
            result.status.as_str(),
            result
                .message
                .map(|message| format!(" — {message}"))
                .unwrap_or_default()
        );
    }

    // One updater landing is enough to change what the user is looking at,
    // so the record follows the machine rather than the exit code. A run that
    // only skipped or errored wrote nothing, and leaves the record standing.
    if applied > 0 {
        if let Err(message) = livery_core::state::set_active_theme(&theme.key) {
            eprintln!("warning: could not record the active theme — {message}");
        }
    }

    if failed > 0 {
        return Err(format!("{failed} update(s) failed"));
    }
    Ok(())
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
            "{:<10} {:<9} {:<8} linked={:<5} config={}",
            app.as_str(),
            if enabled { "enabled" } else { "disabled" },
            provisioning_label(app_status.provisioning),
            app_status.linked,
            config_label(&verification),
        );
    }
    Ok(())
}

pub fn setup(yes: bool) -> Result<(), String> {
    unpacked()?;

    let detections = block_on(detect::detect_apps());
    let found: Vec<AppName> = detections
        .iter()
        .filter(|detection| detection.found)
        .map(|detection| detection.app)
        .collect();

    if found.is_empty() {
        println!("No app config files were found.");
        return Ok(());
    }

    println!("Found {} app(s):", found.len());
    for detection in detections.iter().filter(|detection| detection.found) {
        let path = if detection.app == AppName::Obsidian {
            detection
                .config_folders
                .as_deref()
                .unwrap_or_default()
                .join(", ")
        } else {
            detection.config_path.clone()
        };
        println!("  {:<10} {}", detection.app.as_str(), path);
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
            if *app == AppName::Obsidian {
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
        for app in &linked {
            let result = block_on(themes::link_app_themes(*app));
            print_link_result(&result);
            if result.status == UpdateStatus::Error {
                failures.push(format!("{} link failed", app.as_str()));
            }
        }
    }

    if confirm("Verify their config paths?", yes)? {
        for app in &found {
            let verification = block_on(updaters::verify_app_path(*app));
            println!("  {:<10} {}", app.as_str(), config_label(&verification));
            print_verification_folders(&verification);
            if let Some(message) = &verification.message {
                failures.push(format!("{} verification failed: {message}", app.as_str()));
            }
        }
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
    apply(&choose_setup_theme(yes)?)
}

/// The theme setup applies as its last step. `--yes` has to stay
/// non-interactive, so it takes the default rather than opening the picker.
fn choose_setup_theme(yes: bool) -> Result<String, String> {
    if yes {
        return Ok(DEFAULT_THEME_KEY.to_string());
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
    println!("{label:<10} {}{detail}", result.status.as_str());
    Ok(())
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
    let active = livery_core::state::get_active_theme();
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
    let Some(key) = livery_core::state::get_active_theme() else {
        return "none (run `livery setup`)".to_string();
    };
    match catalog::find(&key) {
        Some(theme) => format!("{key}  ({})", theme.appearance),
        None => format!("{key}  (unknown theme)"),
    }
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

fn print_link_result(result: &themes::LinkThemesResult) {
    println!(
        "  {:<10} {}{}",
        result.app,
        result.status.as_str(),
        result
            .message
            .as_ref()
            .map(|message| format!(" — {message}"))
            .unwrap_or_default()
    );
    if let Some(folders) = &result.config_folders {
        for folder in folders {
            println!(
                "    {:<30} link={} linked={} pruned={}{}",
                folder.config_folder,
                folder.status.as_str(),
                folder.linked,
                folder.pruned,
                folder
                    .message
                    .as_ref()
                    .map(|message| format!(" — {message}"))
                    .unwrap_or_default()
            );
        }
    }
}

fn print_verification_folders(verification: &updaters::AppPathVerification) {
    if let Some(folders) = &verification.config_folders {
        for folder in folders {
            println!(
                "    {:<30} verify={} ({})",
                folder.config_folder,
                if folder.exists { "ok" } else { "missing" },
                folder.path,
            );
        }
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
