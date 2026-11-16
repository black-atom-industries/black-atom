import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import styles from "./text-link.module.css";

type Props = Omit<useRender.ComponentProps<"a">, "className">;

export function TextLink({ render, ...props }: Props) {
    return useRender({
        defaultTagName: "a",
        render,
        props: mergeProps({ className: styles.root, "data-component": "TextLink" }, props),
    });
}
