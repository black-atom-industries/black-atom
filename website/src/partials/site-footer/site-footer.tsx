import type { ReactElement } from "react";
import { Caption } from "#/components/caption/index.ts";
import { NavLink } from "#/components/nav-link/index.ts";
import { PageGrid } from "#/components/page-grid/index.ts";
import { Section } from "#/components/section/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { TextLink } from "#/components/text-link/index.ts";

export type FooterLink = {
    label: string;
    /** The link element, such as a router `<Link>` or an external `<a>`. */
    render: ReactElement;
};

export type FooterColumn = {
    title: string;
    links: readonly FooterLink[];
};

type Props = {
    columns: readonly FooterColumn[];
    about: { title: string; text: string };
    copyright: string;
    legalLabel: string;
    legalLinks: readonly FooterLink[];
};

export function SiteFooter({ columns, about, copyright, legalLabel, legalLinks }: Props) {
    return (
        <Section variant="footer" render={<footer />} data-partial="SiteFooter">
            <PageGrid columns="four">
                {columns.map((column) => (
                    <Stack key={column.title} gap="xs" render={<nav aria-label={column.title} />}>
                        <Caption tone="subtle">{column.title}</Caption>
                        <Stack gap="2xs">
                            {column.links.map((link) => (
                                <TextLink key={link.label} render={link.render}>
                                    {link.label}
                                </TextLink>
                            ))}
                        </Stack>
                    </Stack>
                ))}
                <Stack gap="sm">
                    <Caption tone="subtle">{about.title}</Caption>
                    <Text variant="small" tone="subtle">
                        {about.text}
                    </Text>
                </Stack>
            </PageGrid>
            <Stack direction="row" justify="between" align="center" gap="md" isWrapped isDivided>
                <Caption tone="subtle">{copyright}</Caption>
                <Stack render={<nav aria-label={legalLabel} />} direction="row" gap="md">
                    {legalLinks.map((link) => (
                        <NavLink key={link.label} render={link.render}>
                            {link.label}
                        </NavLink>
                    ))}
                </Stack>
            </Stack>
        </Section>
    );
}
