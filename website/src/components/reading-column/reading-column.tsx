import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import styles from "./reading-column.module.css";

type Props = Omit<useRender.ComponentProps<"div">, "className">;

/** A column narrow enough for long text, with room between its sections. */
export function ReadingColumn({ render, ...props }: Props) {
    return useRender({
        render,
        props: mergeProps({ className: styles.root, "data-layout": "ReadingColumn" }, props),
    });
}
