import { changelogCopy } from "#/content/studio.ts";

type Props = {
    href: string;
    /** A feed failed, so the list may be empty only because GitHub did not answer. */
    hasFailed: boolean;
};

/** Shown in place of an empty changelog list. */
export function ChangelogEmpty({ href, hasFailed }: Props) {
    return (
        <>
            {hasFailed ? changelogCopy.failed : changelogCopy.empty} {changelogCopy.elsewhere}{" "}
            <a href={href}>GitHub</a>.
        </>
    );
}
