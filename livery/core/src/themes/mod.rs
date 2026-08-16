//! Managed theme downloads — fetches each adapter repo's committed theme
//! output into `~/.config/black-atom/themes/<adapter>/` (issue #34).

pub mod commands;
pub mod detect;
pub mod extract;
pub mod manifest;
pub mod registry;
pub mod symlinks;
