# Product

## Register

product

## Users

Developers who use Black Atom themes across their toolchain (Neovim, Ghostty, Tmux, Zed, Delta,
Lazygit, Obsidian). They're at their desk, in a focused workflow — often in terminal-native,
keyboard-driven environments. They want their tools to feel cohesive without manually syncing config
files.

## Product Purpose

Livery is a theme management desktop app (Tauri v2). Pick a Black Atom theme once, apply it across
all configured developer tools simultaneously. It replaces manual config-file patching with a single
selection — then delegates all file I/O to Rust commands.

## Brand Personality

**Technical. Institutional. Grounded.**

The visual identity draws from technical documentation, industrial datasheets, and vintage
space-program aesthetics (NASA 1970s, DHARMA Initiative). It's a "vault terminal" for browsing and
deploying color themes. The personality is confident and precise but quiet — the tool gets out of
the way.

Voice tone: direct, label-driven, never chatty. Uppercase monospace is the default voice of the
interface chrome.

## Anti-references

- **SaaS cream**: rounded corners, soft drop shadows, gradient surfaces, centered hero layouts
- **Over-decorated tools**: saturated chrome colors, neon accents, decorative icons, emoji
- **AI-slop copy**: "Elevate your workflow," "Seamless integration," "Next-gen experience"
- **Pure black** (`#000`) or **pure white** (`#fff`) — everything is tinted
- **Competing chrome**: the app's frame never competes with the themes it displays

## Design Principles

1. **Chrome is monochrome. Themes bring color.** The app frame stays in warm-tinted grays. Accent
   (green, hue ~145) is used sparingly for status indicators and active states. Theme previews are
   where saturation lives.

2. **Mono is the default voice.** Labels, navigation, status text, section headers, metadata —
   anything that is part of the chrome uses monospace with uppercase and tracked-out letterspacing.
   Display type (Space Grotesk) is the exception, reserved for headlines and theme names.

3. **Squared-off and bordered.** 1px solid borders define panels and containers. No rounded corners.
   Depth is communicated through tonal layering, not drop shadows.

4. **Hierarchy through contrast.** Extreme scale jumps (massive display headlines paired with tiny
   monospace metadata labels) create the "technical datasheet" effect.

5. **Keyboard-first.** Full keyboard navigability. The app serves terminal-native users who expect
   Vim-style interaction patterns. Mouse is secondary.

6. **Light and dark are both first-class.** The app manages themes for both appearances — its own
   chrome must work equally well in both modes. This is not a "dark mode app" that tolerates light
   mode.

## Accessibility & Inclusion

- Target: WCAG 2.1 AA
- Full keyboard navigability — primary interaction model for Vim/terminal users
- Color contrast is delegated to `@black-atom/core` theme tokens; chrome follows the same token
  system
- Motion: ease-out exponential curves only, no bounce/elastic. Respects `prefers-reduced-motion`
