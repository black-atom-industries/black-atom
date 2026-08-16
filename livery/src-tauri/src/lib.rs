pub mod commands;

#[cfg(debug_assertions)]
mod dev_bridge;

use tauri_specta::{collect_commands, Builder};

fn specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::get_config,
        commands::save_config,
        commands::download_theme,
        commands::get_themes_status,
        commands::link_app_themes,
        commands::dismiss_themes_greeting,
        commands::detect_apps,
        commands::update_app,
        commands::update_system_appearance,
        commands::verify_app_path,
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn start_app() {
    let builder = specta_builder();

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .invoke_handler(builder.invoke_handler())
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
        .setup(|app| {
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
    /// Regenerates ../src/bindings.ts on every test run, so command/type
    /// changes never ship stale bindings — no GUI launch required.
    #[test]
    fn export_typescript_bindings() {
        super::specta_builder()
            .export(
                specta_typescript::Typescript::default(),
                "../src/bindings.ts",
            )
            .expect("Failed to export typescript bindings");
    }
}
