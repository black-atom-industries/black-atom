fn main() {
    for path in [
        "delta/themes",
        "ghostty/themes",
        "herdr/themes",
        "lazygit/themes",
        "niri/themes",
        "obsidian/themes",
        "obsidian/theme.css",
        "obsidian/manifest.json",
        "tmux/themes",
        "tuicr/themes",
        "waybar/themes",
        "wezterm/themes",
        "zed/themes",
        "nvim/colors",
        "nvim/lua",
    ] {
        println!("cargo:rerun-if-changed=../../adapters/{path}");
    }
}
