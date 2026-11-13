import type * as Theme from "@black-atom/core";
import { themeToPreviewProperties } from "#/lib/preview-vars.ts";
import styles from "./terminal-preview.module.css";

/** Palette slots in ANSI order: the eight normal colors, then the eight bright ones. */
const ansiSlots = [
    "black",
    "dark-red",
    "dark-green",
    "dark-yellow",
    "dark-blue",
    "dark-magenta",
    "dark-cyan",
    "light-gray",
    "gray",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
] as const;

type Props = {
    theme: Theme.Definition;
    /** Replaces the theme's border color: the Before story draws idle lines in subtle text. */
    borderColor?: string;
    /** A caption above the terminal, such as `Before · HEAD`. */
    label?: string;
};

/** A mock terminal in one theme: a session, the palette in ANSI order and a tab bar. */
export function TerminalPreview({ theme, borderColor, label }: Props) {
    const short = theme.meta.key.replace(/^black-atom-/, "");

    return (
        <div
            data-component="TerminalPreview"
            className={styles.root}
            style={themeToPreviewProperties(theme, { borderColor })}
        >
            {label !== undefined && <p className={styles.label}>{label}</p>}
            <div className={styles.frame} role="group" aria-label="Terminal preview">
                <div className={styles.panes}>
                    <div className={styles.pane} tabIndex={0} aria-label="Session">
                        <div>
                            <span className={styles.green}>~/code/black-atom</span>{" "}
                            <span className={styles.subtle}>on</span>{" "}
                            <span className={styles.magenta}>main</span>{" "}
                            <span className={styles.yellow}>[!?]</span>
                        </div>
                        <div>
                            <span className={styles.accent}>❯</span> livery apply {short}
                        </div>
                        <div>
                            <span className={styles.green}>✓</span> ghostty{" "}
                            <span className={styles.green}>✓</span> tmux{" "}
                            <span className={styles.green}>✓</span> nvim{" "}
                            <span className={styles.yellow}>!</span> zed{" "}
                            <span className={styles.subtle}>not running</span>
                        </div>
                        <div>
                            <span className={styles.red}>error</span> obsidian: vault not found
                        </div>
                        <div>
                            <span className={styles.blue}>info</span>{" "}
                            <span className={styles.subtle}>4 of 5 tools on</span> {theme.meta.name}
                        </div>
                        <div>
                            <span className={styles.accent}>❯</span> git status -sb
                        </div>
                        <div>
                            <span className={styles.cyan}>## main...origin/main</span>
                        </div>
                        <div>
                            <span className={styles.red}> M</span> core/src/themes/jpn.ts
                        </div>
                        <div>
                            <span className={styles.green}>A </span> adapters/nvim/border.lua
                        </div>
                        <div>
                            <span className={styles.accent}>❯</span>{" "}
                            <span className={styles.cursor}> </span>{" "}
                            <span className={styles.gray}>git commit -m "border token"</span>
                        </div>
                    </div>
                    <div className={styles.pane} tabIndex={0} aria-label="Palette">
                        <div className={styles.subtle}>palette</div>
                        <div className={styles.names}>
                            {ansiSlots.map((slot) => (
                                <span key={slot} style={{ color: `var(--tp-c-${slot})` }}>
                                    {slot}{" "}
                                </span>
                            ))}
                        </div>
                        <div className={styles.ansi} aria-hidden="true">
                            {ansiSlots.map((slot) => (
                                <i key={slot} style={{ background: `var(--tp-c-${slot})` }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.bar}>
                    <b>1:zsh</b>
                    <span>2:nvim</span>
                    <span>3:lazygit</span>
                </div>
            </div>
        </div>
    );
}
