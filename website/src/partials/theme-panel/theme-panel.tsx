import { Dialog } from "@base-ui/react/dialog";
import { collectionOrder, DEFAULT_THEME_KEY, themeCatalog } from "@black-atom/core";
import { useLocation } from "@tanstack/react-router";
import { useTheme } from "#/hooks/use-theme.ts";
import { siblingThemeKey, stepThemeKey, toShortKey } from "#/lib/theme-precedence.ts";
import styles from "./theme-panel.module.css";

const siteHost = "black-atom.industries";

const collections = collectionOrder.map((collectionKey) => {
    const themes = Object.values(themeCatalog).filter(
        (theme) => theme.meta.collection.key === collectionKey,
    );
    return { key: collectionKey, label: themes[0].meta.collection.label, themes };
});

export function ThemePanel() {
    const { theme, setTheme } = useTheme();
    const pathname = useLocation({ select: (location) => location.pathname });
    const key = theme.meta.key;
    const sibling = siblingThemeKey(key);
    const shareQuery = key === DEFAULT_THEME_KEY ? "" : `?theme=${toShortKey(key)}`;

    return (
        <Dialog.Root modal={false}>
            <div className={styles.dock}>
                <Dialog.Trigger className={styles.dockButton} aria-label="Theme">
                    <i className={styles.swatch} />
                </Dialog.Trigger>
            </div>
            <Dialog.Portal>
                <Dialog.Popup className={styles.panel}>
                    <div className={styles.row}>
                        <Dialog.Title className={styles.label}>Theme</Dialog.Title>
                        <Dialog.Close className={styles.close} aria-label="Close">
                            ×
                        </Dialog.Close>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.current}>{theme.meta.label}</span>
                        <div className={styles.step}>
                            <button
                                type="button"
                                aria-label="Previous theme"
                                onClick={() => setTheme(stepThemeKey(key, -1))}
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                aria-label="Next theme"
                                onClick={() => setTheme(stepThemeKey(key, 1))}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.caption}>Appearance</span>
                        <button
                            type="button"
                            className={styles.pair}
                            disabled={sibling === undefined}
                            onClick={() => sibling && setTheme(sibling)}
                        >
                            <span data-active={theme.meta.appearance === "dark"}>dark</span> /{" "}
                            <span data-active={theme.meta.appearance === "light"}>light</span>
                        </button>
                    </div>
                    <div className={styles.section}>
                        {collections.map((collection) => (
                            <div key={collection.key} className={styles.collection}>
                                <span className={styles.caption}>{collection.label}</span>
                                <div className={styles.themes}>
                                    {collection.themes.map((entry) => (
                                        <button
                                            key={entry.meta.key}
                                            type="button"
                                            className={styles.theme}
                                            aria-pressed={entry.meta.key === key}
                                            onClick={() => setTheme(entry.meta.key)}
                                        >
                                            {entry.meta.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.section}>
                        <span className={styles.caption}>This page in this theme</span>
                        <div className={styles.share}>
                            {siteHost}
                            {pathname}
                            <b>{shareQuery}</b>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
