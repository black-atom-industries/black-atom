pub mod commands;
pub mod config_watcher;

#[cfg(debug_assertions)]
pub mod dev_bridge;

use livery_core::config::file_tracker::ConfigFileEvent;
use tauri_specta::{collect_commands, collect_events, Builder, Event};

/// The config file changed outside Livery, or can't be read.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, Event)]
pub struct ConfigFileChanged(pub ConfigFileEvent);

fn specta_builder<R: tauri::Runtime>() -> Builder<R> {
    Builder::<R>::new()
        .commands(collect_commands![
            commands::get_config,
            commands::get_config_file_error,
            commands::save_config,
            commands::get_app_status,
            commands::link_app_themes,
            commands::detect_apps,
            commands::update_app,
            commands::update_system_appearance,
            commands::verify_app_path,
            commands::reload_nvim,
            commands::get_active_theme,
            commands::set_active_theme,
        ])
        .events(collect_events![ConfigFileChanged])
}

fn start_config_watcher(app: &tauri::App) {
    use tauri::Manager;

    livery_core::config::io::ensure_config_exists();
    let handle = app.handle().clone();
    let watcher = config_watcher::ConfigWatcher::start(
        livery_core::config::io::config_path(),
        livery_core::config::file_tracker::config_file_tracker(),
        move |event| {
            if let Err(error) = ConfigFileChanged(event).emit(&handle) {
                log::error!("Could not report a config file change: {error}");
            }
        },
    );
    match watcher {
        Ok(watcher) => {
            app.manage(watcher);
        }
        Err(error) => log::error!("Could not watch the config file: {error}"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn start_app() {
    let builder = specta_builder::<tauri::Wry>();

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    let app = tauri::Builder::default();

    #[cfg(all(debug_assertions, target_os = "macos"))]
    let app = app.activate_ignoring_other_apps(false);

    app.invoke_handler(builder.invoke_handler())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("livery".into()),
                    }),
                ])
                .max_file_size(5_000_000) // 5 MB
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .setup(move |app| {
            builder.mount_events(app);

            if tauri::is_dev() {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.set_title("Livery Dev")?;
                }
            }

            match livery_core::themes::unpack::ensure_unpacked() {
                Ok(report) if report.unpacked => log::info!(
                    "Unpacked {} theme files for {} adapters (stamp {})",
                    report.files,
                    report.adapters,
                    report.stamp
                ),
                Ok(report) => log::info!("Themes already unpacked (stamp {})", report.stamp),
                Err(e) => log::error!("Failed to unpack the bundled themes: {e}"),
            }

            start_config_watcher(app);

            #[cfg(debug_assertions)]
            if let Some(bridge) = dev_bridge::start() {
                use tauri::Manager;
                app.manage(bridge);
            }

            #[cfg(desktop)]
            {
                use tauri::Manager;
                use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

                let config = livery_core::config::io::read_config_from_disk();
                let shortcut_str = config.keymappings.toggle_window.clone();

                let toggle_shortcut: Shortcut = shortcut_str
                    .parse()
                    .expect("Invalid global_shortcut in config");

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            if shortcut == &toggle_shortcut
                                && event.state() == ShortcutState::Pressed
                            {
                                if let Some(window) = app.get_webview_window("main") {
                                    if window.is_visible().unwrap_or(false) {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(toggle_shortcut)?;
                log::info!("Global shortcut registered: {shortcut_str}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use livery_core::capability::Capability;

    fn to_camel(snake: &str) -> String {
        let mut camel = String::with_capacity(snake.len());
        let mut capitalize = false;
        for c in snake.chars() {
            if c == '_' {
                capitalize = true;
            } else if capitalize {
                camel.extend(c.to_uppercase());
                capitalize = false;
            } else {
                camel.push(c);
            }
        }
        camel
    }

    /// Every capability reaches the frontend: the exported bindings carry a
    /// wrapper for each one, so a capability cannot ship CLI-only.
    #[test]
    fn capabilities_have_commands() {
        let bindings = super::specta_builder::<tauri::Wry>()
            .export_str(specta_typescript::Typescript::default())
            .expect("Failed to export typescript bindings");

        for cap in Capability::ALL {
            let wrapper = format!("async {}(", to_camel(cap.command_name()));
            assert!(
                bindings.contains(&wrapper),
                "{cap:?} has no binding: '{wrapper}' is missing from the exported bindings"
            );
        }
    }

    /// The event reaches a Tauri listener under the name the bindings listen on.
    /// Emitting needs `mount_events` first, or it panics.
    #[test]
    fn config_file_changed_reaches_a_listener_under_the_bound_name() {
        use std::sync::mpsc;
        use tauri::Listener;
        use tauri_specta::Event;

        let app = tauri::test::mock_app();
        let builder = super::specta_builder::<tauri::test::MockRuntime>();
        builder.mount_events(&app);
        let (sender, payloads) = mpsc::channel();
        app.listen("config-file-changed", move |event| {
            sender.send(event.payload().to_string()).unwrap();
        });

        super::ConfigFileChanged(super::ConfigFileEvent {
            error: None,
            nvim_settings_changed: true,
            active_theme_changed: false,
            active_theme: None,
        })
        .emit(&app)
        .unwrap();

        let payload = payloads
            .recv_timeout(std::time::Duration::from_secs(5))
            .unwrap();
        assert!(
            payload.contains("\"nvim_settings_changed\":true"),
            "{payload}"
        );
        let bindings = builder
            .export_str(specta_typescript::Typescript::default())
            .unwrap();
        assert!(bindings.contains("configFileChanged: \"config-file-changed\""));
    }

    /// Regenerates ../src/bindings.ts on every test run, so command/type
    /// changes never ship stale bindings — no GUI launch required.
    /// tsc type-checks livery/src in parallel with this test, so the file is
    /// only replaced when it changed, and atomically through a rename.
    #[test]
    fn export_typescript_bindings() {
        let bindings = super::specta_builder::<tauri::Wry>()
            .export_str(specta_typescript::Typescript::default())
            .expect("Failed to export typescript bindings");
        let path = std::path::Path::new("../src/bindings.ts");
        if std::fs::read_to_string(path).ok().as_deref() == Some(bindings.as_str()) {
            return;
        }
        let tmp = path.with_extension("ts.tmp");
        std::fs::write(&tmp, bindings).expect("Failed to write typescript bindings");
        std::fs::rename(&tmp, path).expect("Failed to replace typescript bindings");
    }
}
