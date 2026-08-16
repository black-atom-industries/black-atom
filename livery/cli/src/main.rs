//! `livery` — apply Black Atom themes from a terminal.

mod commands;

use clap::{Parser, Subcommand};
use livery_core::capability::Capability;

#[derive(Parser)]
#[command(
    name = "livery",
    version,
    about = "Apply Black Atom themes across your tools",
    long_about = "Apply Black Atom themes across your tools.\n\nRun without a subcommand to pick a theme interactively."
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    /// Apply a theme to every enabled app
    Apply {
        /// Theme key, for example black-atom-jpn-koyo-yoru
        theme: String,
    },
    /// List every available theme, grouped by collection
    List,
    /// Show each app's enabled, provisioning, linked and config state
    Status,
    /// Enable detected apps, link their themes, and verify their config paths
    Setup {
        /// Accept every prompt
        #[arg(short, long)]
        yes: bool,
    },
    /// Switch the system between dark and light mode
    Appearance {
        /// dark or light
        mode: String,
    },
    /// Write the stored Neovim plugin settings into nvim's managed Lua block
    NvimSettings,
}

/// The CLI surface exposing a capability. Exhaustive on purpose: a new
/// `Capability` variant fails to compile until the terminal client covers
/// it too.
#[allow(dead_code)]
fn cli_surface(cap: Capability) -> &'static str {
    match cap {
        Capability::GetConfig => "status",
        Capability::SaveConfig => "setup",
        Capability::DetectApps => "setup",
        Capability::GetAppStatus => "status",
        Capability::LinkAppThemes => "setup",
        Capability::UpdateApp => "apply",
        Capability::VerifyAppPath => "status",
        Capability::UpdateSystemAppearance => "appearance",
        Capability::WriteNvimSettings => "nvim-settings",
    }
}

fn main() -> std::process::ExitCode {
    let cli = Cli::parse();

    let result = match cli.command {
        Some(Command::Apply { theme }) => commands::apply(&theme),
        Some(Command::List) => commands::list(),
        Some(Command::Status) => commands::status(),
        Some(Command::Setup { yes }) => commands::setup(yes),
        Some(Command::Appearance { mode }) => commands::appearance(&mode),
        Some(Command::NvimSettings) => commands::nvim_settings(),
        None => commands::pick_and_apply(),
    };

    match result {
        Ok(()) => std::process::ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("error: {message}");
            std::process::ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn every_capability_has_a_subcommand() {
        let cli = Cli::command();
        for cap in Capability::ALL {
            let surface = cli_surface(*cap);
            assert!(!surface.is_empty(), "{:?} names no CLI surface", cap);
            assert!(
                cli.get_subcommands().any(|sub| sub.get_name() == surface),
                "{:?} claims subcommand '{surface}', which the CLI does not define",
                cap
            );
        }
    }
}
