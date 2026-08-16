import { createFileRoute } from "@tanstack/react-router";
import { Typo, typoColors } from "@/components/typo/index.ts";

export const Route = createFileRoute("/dev/typography")({
    component: Component,
});

function Component() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            <section>
                <SectionLabel>Headings</SectionLabel>
                <Typo.H1>System Configuration</Typo.H1>
                <Typo.H2>Theme Management</Typo.H2>
                <Typo.H3>Active color scheme</Typo.H3>
                <Typo.H4>Token overrides</Typo.H4>
            </section>

            <section>
                <SectionLabel>Body text</SectionLabel>
                <Typo.Lead>
                    Livery applies your chosen theme across all configured developer tools
                    simultaneously. Pick once, update everywhere.
                </Typo.Lead>
                <Typo.P>
                    Each theme defines a set of semantic color tokens that map to specific UI roles
                    — foreground, background, accents, and status colors. These tokens are resolved
                    at runtime and written to each tool's configuration file through dedicated
                    updaters.
                </Typo.P>
                <Typo.P>
                    The updater pipeline reads the current theme definition from{" "}
                    <Typo.InlineCode>@black-atom/core</Typo.InlineCode>, transforms it into
                    tool-specific formats, and writes the results to disk. Neovim receives a Lua
                    colorscheme, Alacritty gets a TOML snippet, and Delta picks up a gitconfig block
                    — all from the same source of truth.
                </Typo.P>
                <Typo.Small>
                    Last synced 2 minutes ago · 14 tools configured · 0 errors
                </Typo.Small>
            </section>

            <section>
                <SectionLabel>Inline elements</SectionLabel>
                <Typo.P>
                    Run <Typo.InlineCode>livery apply --theme jpn-koyo-yoru</Typo.InlineCode>{" "}
                    to switch themes from the command line. Use the{" "}
                    <Typo.Highlight>--dry-run</Typo.Highlight>{" "}
                    flag to preview changes before writing to disk.
                </Typo.P>
                <Typo.P>
                    The <Typo.InlineCode>file_ops</Typo.InlineCode>{" "}
                    module handles all filesystem writes through Tauri's scoped FS API. Direct
                    access from the{" "}
                    <Typo.Highlight>TypeScript layer is not permitted</Typo.Highlight>{" "}
                    — all mutations flow through Rust commands.
                </Typo.P>
            </section>

            <section>
                <SectionLabel>Blockquote</SectionLabel>
                <Typo.Blockquote>
                    TypeScript decides what to do. Rust decides how to do it. No direct filesystem
                    access from the frontend — all OS operations go through the backend.
                </Typo.Blockquote>
            </section>

            <section>
                <SectionLabel>Lists</SectionLabel>
                <div style={{ display: "flex", gap: 64 }}>
                    <div>
                        <Typo.H4>Supported tools</Typo.H4>
                        <Typo.UnorderedList>
                            <li>Neovim (Lua colorscheme + live reload)</li>
                            <li>Alacritty (TOML color config)</li>
                            <li>Delta (gitconfig theme block)</li>
                            <li>Tmux (status line colors)</li>
                            <li>macOS (system appearance)</li>
                        </Typo.UnorderedList>
                    </div>
                    <div>
                        <Typo.H4>Update pipeline</Typo.H4>
                        <Typo.OrderedList>
                            <li>Select theme from the sidebar</li>
                            <li>Resolve semantic tokens from core</li>
                            <li>Transform tokens per tool format</li>
                            <li>Write config files via Rust backend</li>
                            <li>Trigger live reload where supported</li>
                        </Typo.OrderedList>
                    </div>
                </div>
            </section>

            <section>
                <SectionLabel>Color variants</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {typoColors.map((color) => (
                        <Typo.P key={color} color={color} style={{ margin: 0 }}>
                            <Typo.Small color={color}>[{color}]</Typo.Small>{" "}
                            The quick brown fox jumps over the lazy dog
                        </Typo.P>
                    ))}
                </div>
            </section>

            <section>
                <SectionLabel>Font families (3 voices)</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Typo.P style={{ margin: 0, fontFamily: "var(--ba-font-display)" }}>
                        <Typo.Small>[display]</Typo.Small>{" "}
                        The quick brown fox jumps over the lazy dog
                    </Typo.P>
                    <Typo.P style={{ margin: 0, fontFamily: "var(--ba-font-body)" }}>
                        <Typo.Small>[body]</Typo.Small> The quick brown fox jumps over the lazy dog
                    </Typo.P>
                    <Typo.P style={{ margin: 0, fontFamily: "var(--ba-font-mono)" }}>
                        <Typo.Small>[mono]</Typo.Small> The quick brown fox jumps over the lazy dog
                    </Typo.P>
                </div>
            </section>

            <section>
                <SectionLabel>Font weights (3 voices)</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Typo.P style={{ margin: 0, fontWeight: "var(--ba-font-weight-regular)" }}>
                        <Typo.Small>[regular · 400]</Typo.Small>{" "}
                        The quick brown fox jumps over the lazy dog
                    </Typo.P>
                    <Typo.P style={{ margin: 0, fontWeight: "var(--ba-font-weight-medium)" }}>
                        <Typo.Small>[medium · 500]</Typo.Small>{" "}
                        The quick brown fox jumps over the lazy dog
                    </Typo.P>
                    <Typo.P style={{ margin: 0, fontWeight: "var(--ba-font-weight-bold)" }}>
                        <Typo.Small>[bold · 700]</Typo.Small>{" "}
                        The quick brown fox jumps over the lazy dog
                    </Typo.P>
                </div>
            </section>

            <section>
                <SectionLabel>Font sizes (00 – 8)</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(["00", "0", "1", "2", "3", "4", "5", "6", "7", "8"] as const).map((step) => (
                        <div
                            key={step}
                            style={{
                                margin: 0,
                                fontSize: `var(--ba-font-size-${step})`,
                                fontFamily: "var(--ba-font-mono)",
                            }}
                        >
                            [{step}] The quick brown fox
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <SectionLabel>Line heights</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <Typo.P style={{ margin: 0, lineHeight: "var(--ba-font-lineheight-tight)" }}>
                        <Typo.Small>[tight · display]</Typo.Small>{" "}
                        Livery applies your chosen theme across all configured developer tools
                        simultaneously.
                    </Typo.P>
                    <Typo.P style={{ margin: 0, lineHeight: "var(--ba-font-lineheight-ui)" }}>
                        <Typo.Small>[ui · mono UI]</Typo.Small>{" "}
                        Livery applies your chosen theme across all configured developer tools
                        simultaneously.
                    </Typo.P>
                    <Typo.P style={{ margin: 0, lineHeight: "var(--ba-font-lineheight-body)" }}>
                        <Typo.Small>[body · prose]</Typo.Small>{" "}
                        Livery applies your chosen theme across all configured developer tools
                        simultaneously.
                    </Typo.P>
                    <Typo.P style={{ margin: 0, lineHeight: "var(--ba-font-lineheight-code)" }}>
                        <Typo.Small>[code · previews]</Typo.Small>{" "}
                        Livery applies your chosen theme across all configured developer tools
                        simultaneously.
                    </Typo.P>
                </div>
            </section>

            <section>
                <SectionLabel>Letter spacing</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Typo.P
                        style={{ margin: 0, letterSpacing: "var(--ba-font-letterspacing-display)" }}
                    >
                        <Typo.Small>[display]</Typo.Small> THE QUICK BROWN FOX
                    </Typo.P>
                    <Typo.P
                        style={{ margin: 0, letterSpacing: "var(--ba-font-letterspacing-label)" }}
                    >
                        <Typo.Small>[label]</Typo.Small> THE QUICK BROWN FOX
                    </Typo.P>
                    <Typo.P
                        style={{ margin: 0, letterSpacing: "var(--ba-font-letterspacing-wide)" }}
                    >
                        <Typo.Small>[wide]</Typo.Small> THE QUICK BROWN FOX
                    </Typo.P>
                    <Typo.P
                        style={{ margin: 0, letterSpacing: "var(--ba-font-letterspacing-chip)" }}
                    >
                        <Typo.Small>[chip]</Typo.Small> THE QUICK BROWN FOX
                    </Typo.P>
                </div>
            </section>

            <section>
                <SectionLabel>Theme detail</SectionLabel>
                <Typo.H2>Theme: JPN Koyo Yoru</Typo.H2>
                <Typo.Lead>
                    A warm autumn palette inspired by Japanese maple forests at dusk.
                </Typo.Lead>
                <Typo.P>
                    Koyo Yoru uses deep burgundy and amber tones as its accent palette, with a muted
                    charcoal base that keeps contrast comfortable for extended coding sessions. The
                    {" "}
                    <Typo.InlineCode>fg-accent</Typo.InlineCode> token maps to{" "}
                    <Typo.InlineCode>#c4956a</Typo.InlineCode>, giving keywords and UI highlights a
                    distinctly warm character.
                </Typo.P>
                <Typo.Blockquote>
                    Designed for developers who spend 8+ hours in their editor and want warmth
                    without sacrificing readability.
                </Typo.Blockquote>
                <Typo.P>
                    <Typo.Small>
                        Collection: JPN · Appearance: Dark · 24 semantic tokens · 6 syntax groups
                    </Typo.Small>
                </Typo.P>
            </section>

            <section>
                <SectionLabel>Error state</SectionLabel>
                <Typo.H3>Updater failed</Typo.H3>
                <Typo.P color="negative">
                    The Alacritty updater could not write to{" "}
                    <Typo.InlineCode>~/.config/alacritty/colors.toml</Typo.InlineCode>. The file is
                    locked by another process or the directory does not exist.
                </Typo.P>
                <Typo.P color="warn">
                    Neovim live reload timed out after 5 seconds. The socket at{" "}
                    <Typo.InlineCode>/tmp/nvim.sock</Typo.InlineCode>{" "}
                    may be stale. Try restarting your Neovim instance.
                </Typo.P>
                <Typo.P color="positive">
                    Delta, Tmux, and macOS appearance updated successfully. All 3 tools are in sync
                    with <Typo.Highlight color="positive">TERRA Spring Night</Typo.Highlight>.
                </Typo.P>
                <Typo.Small>Attempted at 18:32 · 3 of 5 tools synced</Typo.Small>
            </section>

            <section>
                <SectionLabel>Configuration guide</SectionLabel>
                <Typo.H3>Adding a new tool</Typo.H3>
                <Typo.P>
                    To add support for a new developer tool, you need to implement an updater in the
                    Rust backend. Each updater is a struct that implements the{" "}
                    <Typo.InlineCode>Updater</Typo.InlineCode> trait:
                </Typo.P>
                <Typo.OrderedList>
                    <li>
                        Create a new module under{" "}
                        <Typo.InlineCode>src-tauri/src/updaters/</Typo.InlineCode>
                    </li>
                    <li>
                        Implement <Typo.InlineCode>Updater::apply()</Typo.InlineCode>{" "}
                        to transform tokens into the tool's config format
                    </li>
                    <li>
                        Register the updater in{" "}
                        <Typo.InlineCode>updater_registry.rs</Typo.InlineCode>
                    </li>
                    <li>
                        Add the tool's config path to the Tauri FS scope in{" "}
                        <Typo.InlineCode>tauri.conf.json</Typo.InlineCode>
                    </li>
                </Typo.OrderedList>
                <Typo.Blockquote>
                    All file writes must go through the <Typo.InlineCode>file_ops</Typo.InlineCode>
                    {" "}
                    module. Never use <Typo.InlineCode>std::fs</Typo.InlineCode>{" "}
                    directly — the scoped FS API ensures Livery can only touch paths the user has
                    explicitly allowed.
                </Typo.Blockquote>
                <Typo.P>
                    <Typo.Small color="hint">
                        See the Neovim updater for a reference implementation with live reload
                        support.
                    </Typo.Small>
                </Typo.P>
            </section>

            <section>
                <SectionLabel>Release notes</SectionLabel>
                <Typo.H2>Livery v0.2.0</Typo.H2>
                <Typo.Lead>MNML collection and consolidated updaters</Typo.Lead>
                <Typo.P>
                    This release introduces the{" "}
                    <Typo.Highlight>MNML theme collection</Typo.Highlight>{" "}
                    — 14 minimal, low-saturation themes designed for distraction-free coding.
                    Available in both light and dark variants across Clay, Orange, Mikado, 47,
                    E-Ink, Mono, and ITA palettes.
                </Typo.P>
                <Typo.H4>What changed</Typo.H4>
                <Typo.UnorderedList>
                    <li>
                        <Typo.Highlight>New:</Typo.Highlight> MNML collection with 14 themes
                    </li>
                    <li>
                        <Typo.Highlight>New:</Typo.Highlight>{" "}
                        Consolidated updater architecture — one pipeline, all tools
                    </li>
                    <li>
                        <Typo.Highlight>Fixed:</Typo.Highlight>{" "}
                        Neovim socket detection on Linux with XDG runtime dir
                    </li>
                    <li>
                        <Typo.Highlight>Fixed:</Typo.Highlight>{" "}
                        Delta config not applying when gitconfig uses includes
                    </li>
                </Typo.UnorderedList>
                <Typo.H4>Breaking changes</Typo.H4>
                <Typo.P color="warn">
                    The <Typo.InlineCode>updaters.tool_configs</Typo.InlineCode> field in{" "}
                    <Typo.InlineCode>livery.toml</Typo.InlineCode> has been replaced by{" "}
                    <Typo.InlineCode>updaters.targets</Typo.InlineCode>. Run{" "}
                    <Typo.InlineCode>livery migrate</Typo.InlineCode>{" "}
                    to update your configuration automatically.
                </Typo.P>
                <Typo.Small>Released 2026-03-15 · 847 downloads</Typo.Small>
            </section>

            <section>
                <SectionLabel>Article</SectionLabel>
                <Typo.H1>Why We Built Our Own Theme Engine</Typo.H1>
                <Typo.Lead>
                    Most theme switchers change one tool. We wanted to change all of them at once.
                </Typo.Lead>
                <Typo.Small>
                    Nik Böhmer · April 2026 · 6 min read
                </Typo.Small>

                <Typo.H3>The problem with dotfiles</Typo.H3>
                <Typo.P>
                    Every developer has a dotfiles repo. Mine had 23 files across 8 tools, each with
                    its own color format — hex triplets in Alacritty, Lua tables in Neovim, ANSI
                    indices in Tmux. Changing a theme meant editing half a dozen files by hand and
                    hoping nothing broke.
                </Typo.P>
                <Typo.P>
                    The first version of Livery was a shell script. It read a JSON palette and ran
                    {" "}
                    <Typo.InlineCode>sed</Typo.InlineCode>{" "}
                    replacements across config files. It worked until it didn't — one malformed
                    regex and my <Typo.InlineCode>.tmux.conf</Typo.InlineCode>{" "}
                    was gone. That was the moment I decided to build something real.
                </Typo.P>

                <Typo.Blockquote>
                    The goal was never to build a theme editor. It was to make theme switching a
                    single action, no matter how many tools you use.
                </Typo.Blockquote>

                <Typo.H3>Semantic tokens as the common language</Typo.H3>
                <Typo.P>
                    Instead of mapping raw hex colors to each tool, Livery works with semantic
                    tokens. A token like <Typo.InlineCode>fg-accent</Typo.InlineCode> means{" "}
                    <Typo.Highlight>the primary accent foreground color</Typo.Highlight>, regardless
                    of whether it ends up as{" "}
                    <Typo.InlineCode>vim.api.nvim_set_hl()</Typo.InlineCode>{" "}
                    in Neovim or a TOML value in Alacritty. The theme defines the token values, and
                    each updater knows how to translate them.
                </Typo.P>
                <Typo.P>
                    This separation is what makes the system extensible. Adding a new tool means
                    writing one updater — you never touch the theme definitions.
                </Typo.P>

                <Typo.H3>The Rust boundary</Typo.H3>
                <Typo.P>
                    Early on we made a decision that shaped everything:{" "}
                    <Typo.Highlight>
                        TypeScript orchestrates, Rust executes
                    </Typo.Highlight>
                    . The frontend decides which theme to apply and which tools to update. The
                    backend handles every filesystem write, socket connection, and platform-specific
                    operation.
                </Typo.P>
                <Typo.P>
                    This isn't just architecture for architecture's sake. Tauri's scoped filesystem
                    API means the app can only write to paths the user has explicitly allowed. If a
                    bug in the UI layer tries to write somewhere unexpected, the backend refuses.
                    It's a safety net that shell scripts can never provide.
                </Typo.P>

                <Typo.H3>What we learned</Typo.H3>
                <Typo.OrderedList>
                    <li>
                        Config formats are messier than you think. TOML, YAML, Lua, and gitconfig
                        all have different quoting rules, comment syntax, and merge semantics
                    </li>
                    <li>
                        Live reload is the killer feature. Neovim's socket API lets us push
                        colorscheme changes without restarting — once you have that, going back to
                        manual restarts feels broken
                    </li>
                    <li>
                        Platform paths are a minefield. macOS uses{" "}
                        <Typo.InlineCode>~/Library/Application Support</Typo.InlineCode>, Linux uses
                        {" "}
                        <Typo.InlineCode>$XDG_CONFIG_HOME</Typo.InlineCode>, and some tools ignore
                        both conventions entirely
                    </li>
                </Typo.OrderedList>

                <Typo.H3>What comes next</Typo.H3>
                <Typo.P>
                    We're working on theme previews — a way to see how a palette looks across your
                    tools before committing to it. The challenge is rendering accurate previews for
                    terminal emulators and editors without actually launching them. We're exploring
                    a token-based preview system that renders synthetic UI from the semantic
                    palette.
                </Typo.P>
                <Typo.P color="subtle">
                    If you're interested in contributing or just want to follow along, the project
                    is open source on GitHub. We'd especially love help with updaters for tools we
                    don't use ourselves — Kitty, WezTerm, Zellij, and others.
                </Typo.P>
            </section>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontFamily: "var(--ba-font-mono)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ba-color-fg-subtle)",
                marginBottom: 24,
                borderBottom: "3px solid var(--ba-color-fg-subtle)",
            }}
        >
            {children}
        </div>
    );
}
