import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import styles from "./dialog.module.css";

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    /** Right-side header hint. */
    hint?: string;
    /** Footer left slot, e.g. live result count "12 THEMES MATCH". */
    footerLeft?: React.ReactNode;
    /** Footer right slot, e.g. key vocabulary. */
    footerRight?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

/**
 * Modal dialog frame: title + hint header, content slot, meta footer.
 * Strong border, subtle surface, no backdrop blur or shadow — the page
 * behind dims to 30% opacity. Focus trap, escape-to-close, and aria-modal
 * wiring are delegated to @base-ui/react's Dialog primitives.
 *
 * Spec: docs/design-system/reference/components/containers/Dialog.jsx
 */
export function Dialog({
    open,
    onClose,
    title,
    hint = "esc CLOSE",
    footerLeft,
    footerRight,
    children,
    className,
}: Props) {
    return (
        <BaseDialog.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) onClose();
            }}
        >
            <BaseDialog.Portal>
                <BaseDialog.Backdrop className={styles.backdrop} />
                <BaseDialog.Popup
                    data-component="dialog"
                    className={[styles.root, className].filter(Boolean).join(" ")}
                >
                    <div className={styles.header}>
                        <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>
                        <span className={styles.hint}>{hint}</span>
                    </div>
                    <div className={styles.body}>{children}</div>
                    {(footerLeft || footerRight)
                        ? (
                            <div className={styles.footer}>
                                <span>{footerLeft}</span>
                                <span>{footerRight}</span>
                            </div>
                        )
                        : null}
                </BaseDialog.Popup>
            </BaseDialog.Portal>
        </BaseDialog.Root>
    );
}
