import type { ReactNode } from "react";
import type * as Theme from "@black-atom/core";
import { DiffPreview } from "#/components/diff-preview/index.ts";
import { EditorPreview } from "#/components/editor-preview/index.ts";
import { Heading } from "#/components/heading/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { TerminalPreview } from "#/components/terminal-preview/index.ts";

type Props = {
    theme: Theme.Definition;
    /** The theme as it was before, drawn beside the current one. */
    before?: Theme.Definition;
    /** The name the before version carries in its label. */
    beforeLabel?: string;
};

type Preview = (version: {
    theme: Theme.Definition;
    borderColor?: string;
    label?: string;
}) => ReactNode;

function PreviewSection({
    title,
    theme,
    before,
    beforeLabel,
    render,
}: {
    title: string;
    theme: Theme.Definition;
    before: Theme.Definition | undefined;
    beforeLabel: string;
    render: Preview;
}) {
    return (
        <Stack gap="md">
            <Heading variant="section">{title}</Heading>
            {before === undefined ? (
                render({ theme })
            ) : (
                <PageGrid columns="two">
                    {render({
                        theme: before,
                        borderColor: Object.hasOwn(before.ui.fg, "border")
                            ? undefined
                            : before.ui.fg.subtle,
                        label: beforeLabel,
                    })}
                    {render({ theme, label: "After · working tree" })}
                </PageGrid>
            )}
        </Stack>
    );
}

/** The editor, diff and terminal previews of one theme, each with a before version when one is given. */
export function ThemePreviews({ theme, before, beforeLabel = "Before · HEAD" }: Props) {
    return (
        <Stack gap="2xl">
            <PreviewSection
                title="Editor"
                theme={theme}
                before={before}
                beforeLabel={beforeLabel}
                render={(version) => <EditorPreview {...version} />}
            />
            <PreviewSection
                title="Diff"
                theme={theme}
                before={before}
                beforeLabel={beforeLabel}
                render={(version) => <DiffPreview {...version} />}
            />
            <PreviewSection
                title="Terminal"
                theme={theme}
                before={before}
                beforeLabel={beforeLabel}
                render={(version) => <TerminalPreview {...version} />}
            />
        </Stack>
    );
}
