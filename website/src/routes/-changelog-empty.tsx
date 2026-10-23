/** Shown in place of an empty changelog list, also when GitHub does not answer. */
export function ChangelogEmpty({ href }: { href: string }) {
    return (
        <>
            Nothing to show here yet. Every release and commit is on <a href={href}>GitHub</a>.
        </>
    );
}
