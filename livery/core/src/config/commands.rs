use super::io;
use super::types::Config;

pub fn get_config() -> Config {
    io::ensure_config_exists();

    let mut config = io::read_config_from_disk();
    io::collapse_app_paths(&mut config);
    config
}

pub fn save_config(mut config: Config) -> Result<(), String> {
    io::collapse_app_paths(&mut config);
    io::write_config_to_disk(&config)?;
    Ok(())
}

/// Why the config file can't be read as a Config, if it can't.
pub fn get_config_file_error() -> Option<String> {
    io::config_file_error(&io::config_path())
}

pub fn get_active_theme() -> Option<String> {
    get_config().active_theme
}

pub fn set_active_theme(key: &str) -> Result<(), String> {
    let mut config = get_config();
    // A theme change from outside is already on disk when its apply lands here,
    // and rewriting the file would dirty a config tracked in dotfiles.
    if config.active_theme.as_deref() == Some(key) {
        return Ok(());
    }
    config.active_theme = Some(key.to_string());
    save_config(config)
}
