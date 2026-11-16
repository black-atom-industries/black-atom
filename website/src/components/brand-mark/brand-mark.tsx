import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import styles from "./brand-mark.module.css";

type Props = Omit<useRender.ComponentProps<"a">, "className" | "children"> & {
    title: string;
    subtitle: string;
};

export function BrandMark({ render, title, subtitle, ...props }: Props) {
    return useRender({
        defaultTagName: "a",
        render,
        props: mergeProps(
            {
                className: styles.root,
                "data-component": "BrandMark",
                children: (
                    <>
                        <i aria-hidden="true" className={styles.atom}>
                            <b />
                        </i>
                        <span className={styles.words}>
                            <strong>{title}</strong> <small>{subtitle}</small>
                        </span>
                    </>
                ),
            },
            props,
        ),
    });
}
