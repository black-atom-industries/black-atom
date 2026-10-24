import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "cva";
import { Panel } from "#/components/panel/index.ts";
import styles from "./section.module.css";

const sectionVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            default: null,
            hero: styles.hero,
            page: styles.page,
            compact: styles.compact,
            footer: styles.footer,
        },
    },
});

type Props = Omit<useRender.ComponentProps<"section">, "className"> &
    VariantProps<typeof sectionVariants>;

export function Section({ render, variant = "default", children, ...props }: Props) {
    return useRender({
        defaultTagName: "section",
        render,
        props: mergeProps(
            {
                className: sectionVariants({ variant }),
                "data-layout": "Section",
                children: (
                    <div className={styles.wrap}>
                        {variant === "hero" || variant === "footer" ? (
                            children
                        ) : (
                            <Panel variant="backdrop">{children}</Panel>
                        )}
                    </div>
                ),
            },
            props,
        ),
    });
}
