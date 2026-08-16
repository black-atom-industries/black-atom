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

    let enabled = enabled_apps(&livery_core::config::commands::get_config());
    if enabled.is_empty() {
        println!("No apps are enabled — run `livery setup`.");
        return Ok(());
    }

    println!("{}", theme.label);

    let mut failed = 0;
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

    if failed > 0 {
        return Err(format!("{failed} app(s) failed"));
    }
    Ok(())
}

pub fn status() -> Result<(), String> {
    unpacked()?;

    let config = livery_core::config::commands::get_config();
    let statuses = block_on(themes::get_app_status());

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
        println!("  {:<10} {}", detection.app.as_str(), detection.config_path);
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

    if !linked.is_empty() && confirm("Link their theme files?", yes)? {
        for app in &linked {
            let result = block_on(themes::link_app_themes(*app));
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
    }

    if confirm("Verify their config paths?", yes)? {
        for app in &found {
            let verification = block_on(updaters::verify_app_path(*app));
            println!("  {:<10} {}", app.as_str(), config_label(&verification));
        }
    }
    Ok(())
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

    let themes = catalog::themes();
    let options: Vec<String> = themes
        .iter()
        .map(|theme| format!("{}  [{}]", theme.key, theme.appearance))
        .collect();

    let choice = inquire::Select::new("Theme", options)
        .with_page_size(15)
        .raw_prompt()
        .map_err(|e| format!("no theme picked: {e}"))?;

    apply(&themes[choice.index].key)
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
