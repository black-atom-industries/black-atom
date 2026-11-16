import { Caption } from "#/components/caption/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { Stack } from "#/components/stack/index.ts";

type Props = {
    number: string;
    title: string;
    /** A short note beside the title, such as a count or a source. */
    aside?: string;
};

export function SectionHead({ number, title, aside }: Props) {
    return (
        <Stack direction="row" gap="md" align="baseline" isWrapped data-partial="SectionHead">
            <Caption tone="accent">{number}</Caption>
            <Heading variant="section">{title}</Heading>
            {aside !== undefined && <Caption tone="subtle">{aside}</Caption>}
        </Stack>
    );
}
