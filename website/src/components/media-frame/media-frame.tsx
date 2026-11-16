import styles from "./media-frame.module.css";

type Props = {
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
};

export function MediaFrame({ src, alt, caption, width, height }: Props) {
    return (
        <figure data-component="MediaFrame" className={styles.root}>
            <div className={styles.frame}>
                <img src={src} alt={alt} width={width} height={height} loading="lazy" />
            </div>
            {caption !== undefined && <figcaption className={styles.caption}>{caption}</figcaption>}
        </figure>
    );
}
