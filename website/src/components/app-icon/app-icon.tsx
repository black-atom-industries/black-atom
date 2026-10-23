import styles from "./app-icon.module.css";

type Props = {
    src: string;
    /** Empty when the icon only decorates a name shown next to it. */
    alt: string;
};

export function AppIcon({ src, alt }: Props) {
    return (
        <img
            data-component="AppIcon"
            className={styles.root}
            src={src}
            alt={alt}
            width={56}
            height={56}
        />
    );
}
