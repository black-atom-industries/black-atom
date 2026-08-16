//! `livery` — apply Black Atom themes from a terminal.

mod commands;

use clap::{Parser, Subcommand};

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
}

fn main() -> std::process::ExitCode {
    let cli = Cli::parse();

    let result = match cli.command {
        Some(Command::Apply { theme }) => commands::apply(&theme),
        Some(Command::List) => commands::list(),
        Some(Command::Status) => commands::status(),
        Some(Command::Setup { yes }) => commands::setup(yes),
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
