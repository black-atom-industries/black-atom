use crate::config::types::AppConfig;

use super::file_ops;
use super::{UpdateContext, UpdateResult};

pub fn update(app_str: &str, app_config: &AppConfig, ctx: &UpdateContext) -> UpdateResult {
    let themes_path = match &app_config.themes_path {
        Some(tp) => tp,
        None => return UpdateResult::error(app_str, "Missing themes_path"),
    };

    let source_path = format!(
        "{}/{}/{}.yml",
        themes_path, ctx.collection_key, ctx.theme_key
    );

    match file_ops::yaml::patch_yaml_file(app_config.config_path.clone(), source_path) {
        Ok(()) => {
            log::info!("Updated lazygit config: {}", app_config.config_path);
            UpdateResult::done(app_str)
        }
        Err(e) => UpdateResult::error(app_str, e),
    }
}
