//! Managed theme files — the adapter output livery ships in its binary and
//! unpacks into `$XDG_DATA_HOME/black-atom/themes/<adapter>/`.

pub mod commands;
pub mod detect;
pub mod embedded;
pub mod extract;
pub mod manifest;
pub mod registry;
pub mod symlinks;
pub mod unpack;
