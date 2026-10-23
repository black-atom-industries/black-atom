import { ColorStrip } from "#/components/color-strip/index.ts";
import styles from "./theme-preview.module.css";

type Props = {
    shortKey: string;
    name: string;
    /** The theme's sixteen terminal colours. */
    palette: readonly string[];
};

/** An editor and a terminal in the surrounding theme, for a theme's documentation page. */
export function ThemePreview({ shortKey, name, palette }: Props) {
    return (
        <div data-component="ThemePreview" className={styles.root}>
            <figure className={styles.editor} aria-label="Editor preview">
                <div className={styles.tabs}>
                    <span className={styles.activeTab}>theme.lua</span>
                    <span>init.lua</span>
                </div>
                <pre className={styles.code}>
                    <code>
                        <span className={styles.line}>
                            <span className={styles.lineNumber}>1</span>
                            <span>
                                <span className={styles.keyword}>local</span>{" "}
                                <span className={styles.variable}>M</span>{" "}
                                <span className={styles.operator}>=</span>{" "}
                                <span className={styles.punctuation}>{"{}"}</span>
                            </span>
                        </span>
                        <span className={styles.line}>
                            <span className={styles.lineNumber}>2</span>
                            <span className={styles.comment}>-- one definition, every tool</span>
                        </span>
                        <span className={styles.cursorLine}>
                            <span className={styles.lineNumber}>3</span>
                            <span>
                                <span className={styles.keyword}>function</span>{" "}
                                <span className={styles.variable}>M</span>
                                <span className={styles.punctuation}>.</span>
                                <span className={styles.func}>apply</span>
                                <span className={styles.punctuation}>(</span>
                                <span className={styles.variable}>name</span>
                                <span className={styles.punctuation}>)</span>
                            </span>
                        </span>
                        <span className={styles.line}>
                            <span className={styles.lineNumber}>4</span>
                            <span>
                                {"  "}
                                <span className={styles.func}>vim.cmd</span>
                                <span className={styles.punctuation}>(</span>
                                <span className={styles.string}>"colorscheme "</span>{" "}
                                <span className={styles.operator}>..</span>{" "}
                                <span className={styles.variable}>name</span>
                                <span className={styles.punctuation}>)</span>
                            </span>
                        </span>
                        <span className={styles.line}>
                            <span className={styles.lineNumber}>5</span>
                            <span>
                                {"  "}
                                <span className={styles.keyword}>return</span>{" "}
                                <span className={styles.constant}>true</span>
                                <span className={styles.punctuation}>,</span>{" "}
                                <span className={styles.number}>31</span>
                            </span>
                        </span>
                        <span className={styles.line}>
                            <span className={styles.lineNumber}>6</span>
                            <span className={styles.keyword}>end</span>
                        </span>
                    </code>
                </pre>
                <figcaption className={styles.status}>
                    <b>Normal</b>
                    <span>{shortKey}.lua · 3:12</span>
                </figcaption>
            </figure>
            <div className={styles.side}>
                <pre className={styles.terminal}>
                    <code>
                        <span className={styles.success}>~/code</span>{" "}
                        <span className={styles.subtle}>on</span>{" "}
                        <span className={styles.magenta}>main</span>{" "}
                        <span className={styles.subtle}>❯</span> livery apply {shortKey}
                        {"\n"}
                        <span className={styles.success}>✓</span> ghostty{" "}
                        <span className={styles.success}>✓</span> tmux{" "}
                        <span className={styles.success}>✓</span> nvim{" "}
                        <span className={styles.warning}>!</span> zed
                        {"\n"}
                        <span className={styles.info}>info</span>{" "}
                        <span className={styles.subtle}>active theme</span> {name}
                    </code>
                </pre>
                <ColorStrip colors={palette} height="sm" />
            </div>
        </div>
    );
}
