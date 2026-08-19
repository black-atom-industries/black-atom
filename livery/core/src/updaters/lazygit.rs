use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let Some(config_path) = app_config.config_path.as_deref() else {
        return UpdateResult::error(app_str, "Missing config_path");
    };
    let themes_path = match &app_config.themes_path {
        Some(tp) => tp,
        None => return UpdateResult::error(app_str, "Missing themes_path"),
    };

    let source_path = format!(
        "{}/{}/{}.yml",
        themes_path, ctx.collection_key, ctx.theme_key
    );

    match file_ops::yaml::patch_yaml_file(config_path.to_string(), source_path) {
        Ok(()) => {
            log::info!("Updated lazygit config: {}", config_path);
            UpdateResult::done(app_str)
        }
        Err(e) => UpdateResult::error(app_str, e),
    }
}
