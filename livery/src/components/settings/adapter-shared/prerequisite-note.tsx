import styles from "./adapter-shared.module.css";

type Props = {
    children: React.ReactNode;
    link?: { label: string; url: string };
    onOpenUrl?: (url: string) => void;
};

/** Adapter-specific one-time setup note, rendered by each page below its
    ClassDefinition. Content lives on the page, not in a shared data map. */
export function PrerequisiteNote({ children, link, onOpenUrl }: Props) {
    return (
        <p className={styles.classPrerequisite}>
            {children}
            {link && (
                <>
                    {" "}
                    <a
                        href={link.url}
                        className={styles.classLink}
                        onClick={(event) => {
                            // The webview must never navigate — hand the URL
                            // to the OS browser instead.
                            event.preventDefault();
                            onOpenUrl?.(link.url);
                        }}
                    >
                        {link.label}
                    </a>
                </>
            )}
        </p>
    );
}
