fn main() {
    for path in [
        "claude-code/themes",
        "delta/themes",
        "ghostty/themes",
        "herdr/themes",
        "kagi/themes",
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
        "nvim/plugin",
    ] {
        println!("cargo:rerun-if-changed=../../adapters/{path}");
    }
}
